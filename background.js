// Background Service Worker for Link Extractor Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
    console.log('Link Extractor Assistant installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchWebsite') {
        fetchWebsiteContent(request.url)
            .then(content => {
                sendResponse({ success: true, content });
            })
            .catch(error => {
                console.error('Failed to fetch website content:', error);
                sendResponse({ success: false, error: error.message });
            });

        // Return true for async response
        return true;
    } else if (request.action === 'fetchLogo') {
        fetchLogoAsDataURL(request.logoUrl)
            .then(dataUrl => {
                sendResponse({ success: true, dataUrl });
            })
            .catch(error => {
                console.error('Failed to fetch logo:', error);
                sendResponse({ success: false, error: error.message });
            });

        // Return true for async response
        return true;
    }
});

/**
 * Fetch logo and convert to data URL with retry mechanism
 * @param {string} logoUrl Logo URL
 * @returns {Promise<string>} Data URL of the logo
 */
async function fetchLogoAsDataURL(logoUrl) {
    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`尝试获取logo (第${attempt + 1}次):`, logoUrl);

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            };

            // 某些网站需要Referer
            try {
                const logoUrlObj = new URL(logoUrl);
                headers['Referer'] = `${logoUrlObj.protocol}//${logoUrlObj.hostname}`;
            } catch (e) {
                // Ignore referer setting errors
            }

            const response = await fetch(logoUrl, {
                method: 'GET',
                headers: headers,
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            console.log('Logo内容类型:', contentType);

            // 检查是否是图片类型
            if (!contentType || !contentType.startsWith('image/')) {
                throw new Error(`Invalid content type: ${contentType || 'unknown'}`);
            }

            const blob = await response.blob();

            // 检查文件大小（避免过大的文件）
            if (blob.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error(`Logo文件过大: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
            }

            console.log(`Logo获取成功，大小: ${(blob.size / 1024).toFixed(2)}KB`);

            // Convert blob to data URL
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    console.log('Logo转换为DataURL成功');
                    resolve(reader.result);
                };
                reader.onerror = () => {
                    const error = new Error('Failed to convert logo to data URL');
                    console.error('DataURL转换失败:', error);
                    reject(error);
                };
                reader.readAsDataURL(blob);
            });

        } catch (error) {
            lastError = error;
            console.error(`Logo获取失败 (第${attempt + 1}次):`, error.message);

            if (attempt < maxRetries) {
                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    console.error('Logo获取最终失败:', lastError.message);
    throw new Error(`Unable to fetch logo after ${maxRetries + 1} attempts: ${lastError.message}`);
}

/**
 * Extract logos from document with improved detection
 * @param {Document} doc Parsed HTML document
 * @param {string} baseUrl Base URL for resolving relative URLs
 * @returns {Array<string>} Array of logo URLs
 */
function extractLogos(doc, baseUrl) {
    const logoUrls = [];
    const foundUrls = new Set();

    // 辅助函数：尝试多种相对路径解析方式
    const resolveLogoUrl = (href, baseUrl) => {
        try {
            // 首先尝试标准相对路径解析
            let absoluteUrl = new URL(href, baseUrl).href;
            return absoluteUrl;
        } catch (e) {
            // 如果标准解析失败，尝试其他方式
            try {
                const baseUrlObj = new URL(baseUrl);
                const basePathParts = baseUrlObj.pathname.split('/').filter(p => p);

                // 对于子页面，尝试向上一级目录
                if (href.startsWith('./') || href.startsWith('../')) {
                    // 移除子页面文件名，保留目录路径
                    const dirPath = baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/'));
                    const testUrl = new URL(href, `${baseUrlObj.protocol}//${baseUrlObj.host}${dirPath}/`);
                    return testUrl.href;
                }
            } catch (e2) {
                // Ignore fallback errors
            }
        }
        return null;
    };

    // 1. 首先检查 favicon 和网站图标
    const iconSelectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="apple-touch-icon-precomposed"]',
        'meta[property="og:image"]',
        'meta[name="twitter:image"]'
    ];

    iconSelectors.forEach(selector => {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => {
            const href = el.getAttribute('href') || el.getAttribute('content');
            if (href) {
                const absoluteUrl = resolveLogoUrl(href, baseUrl);
                if (absoluteUrl && !foundUrls.has(absoluteUrl)) {
                    foundUrls.add(absoluteUrl);
                    logoUrls.push(absoluteUrl);
                }
            }
        });
    });

    // 2. 扩展的logo选择器
    const logoSelectors = [
        // 直接logo相关
        'img[alt*="logo" i]',
        'img[src*="logo" i]',
        'img[class*="logo" i]',
        'img[id*="logo" i]',

        // 容器中的logo
        '.logo img', '#logo img',
        '.site-logo img', '.site-brand img',
        '.brand img', '.brand-logo img',
        '.navbar-brand img', '.header-logo img',

        // 语义化标签
        'header img[alt*="logo" i]',
        'nav img[alt*="logo" i]',
        '.navbar img[alt*="logo" i]',
        '.header img[alt*="logo" i]',

        // 常见class名
        '.company-logo img',
        '.organization-logo img',
        '.site-identity img',
        '.masthead img',

        // SVG logo
        'svg[class*="logo" i]',
        'svg[id*="logo" i]',
        '.logo svg',
        '#logo svg'
    ];

    logoSelectors.forEach(selector => {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => {
            let src = null;

            if (el.tagName.toLowerCase() === 'img') {
                src = el.getAttribute('src') || el.getAttribute('data-src');
            } else if (el.tagName.toLowerCase() === 'svg') {
                // For SVG, we'll skip for now as it's more complex to handle
                return;
            }

            if (src) {
                const absoluteUrl = resolveLogoUrl(src, baseUrl);
                if (absoluteUrl && !foundUrls.has(absoluteUrl)) {
                    foundUrls.add(absoluteUrl);
                    logoUrls.push(absoluteUrl);
                }
            }
        });
    });

    // 3. 智能检测：在header区域查找最大的图片（通常是logo）
    const headerArea = doc.querySelector('header, .header, .navbar, .nav, .masthead, .site-header');
    if (headerArea) {
        const headerImages = headerArea.querySelectorAll('img');
        headerImages.forEach(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src');
            if (src) {
                const absoluteUrl = resolveLogoUrl(src, baseUrl);
                if (absoluteUrl && !foundUrls.has(absoluteUrl)) {
                    foundUrls.add(absoluteUrl);
                    logoUrls.push(absoluteUrl);
                }
            }
        });
    }

    // 4. 按质量排序（优先级：明确的logo > header区域图片 > 图标）
    return prioritizeLogos(logoUrls, baseUrl);
}

/**
 * Prioritize logos by quality and relevance
 * @param {Array<string>} logoUrls Array of logo URLs
 * @param {string} baseUrl Base URL for scoring
 * @returns {Array<string>} Sorted array of logo URLs
 */
function prioritizeLogos(logoUrls, baseUrl) {
    return logoUrls.sort((a, b) => {
        const scoreA = calculateLogoScore(a, baseUrl);
        const scoreB = calculateLogoScore(b, baseUrl);
        return scoreB - scoreA; // Higher score first
    });
}

/**
 * Calculate logo quality score
 * @param {string} logoUrl Logo URL
 * @param {string} baseUrl Base URL
 * @returns {number} Score (higher is better)
 */
function calculateLogoScore(logoUrl, baseUrl) {
    let score = 0;

    // 优先本域名的图片
    try {
        const logoHost = new URL(logoUrl).hostname;
        const baseHost = new URL(baseUrl).hostname;
        if (logoHost === baseHost || logoHost.includes(baseHost.replace('www.', ''))) {
            score += 20;
        }
    } catch (e) {
        // Ignore URL parsing errors
    }

    // 文件名包含logo关键词
    const filename = logoUrl.toLowerCase();
    if (filename.includes('logo')) score += 15;
    if (filename.includes('brand')) score += 10;
    if (filename.includes('icon')) score += 5;

    // 文件格式偏好（SVG > PNG > JPG > ICO）
    if (filename.includes('.svg')) score += 10;
    else if (filename.includes('.png')) score += 8;
    else if (filename.includes('.jpg') || filename.includes('.jpeg')) score += 6;
    else if (filename.includes('.ico')) score += 3;

    // 排除明显不是logo的图片
    if (filename.includes('avatar')) score -= 10;
    if (filename.includes('background')) score -= 10;
    if (filename.includes('banner')) score -= 5;

    return score;
}

/**
 * Fetch website content
 * @param {string} url Website URL
 * @returns {Promise<string>} Website content
 */
async function fetchWebsiteContent(url) {
    try {
        // Use fetch to get website content
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();

        // Extract key information
        const extractedContent = extractRelevantContent(html, url);

        return extractedContent;
    } catch (error) {
        console.error('Fetch failed:', error);

        // If direct fetch fails, try via content script
        try {
            return await getContentViaContentScript(url);
        } catch (contentScriptError) {
            throw new Error(`Unable to fetch website content: ${error.message}`);
        }
    }
}

/**
 * Extract relevant content from HTML
 * @param {string} html HTML content
 * @param {string} url Original URL
 * @returns {string} Extracted content
 */
function extractRelevantContent(html, url) {
    // Create temporary DOM to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let extractedInfo = {
        url: url,
        title: '',
        description: '',
        keywords: '',
        headings: [],
        logoUrls: [],
        text: ''
    };

    // Extract title
    const titleEl = doc.querySelector('title');
    if (titleEl) {
        extractedInfo.title = titleEl.textContent.trim();
    }

    // Extract meta description - 尝试多个来源
    let descriptionMeta = doc.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
        descriptionMeta = doc.querySelector('meta[property="og:description"]');
    }
    if (descriptionMeta) {
        extractedInfo.description = descriptionMeta.getAttribute('content') || '';
    }

    // 如果没有找到meta description，尝试从Schema.org结构化数据中提取
    if (!extractedInfo.description) {
        try {
            const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
            for (const script of schemaScripts) {
                try {
                    const schema = JSON.parse(script.textContent);
                    // 查找description或name字段
                    if (schema.description) {
                        extractedInfo.description = schema.description;
                        break;
                    } else if (schema.name && !extractedInfo.title) {
                        extractedInfo.title = schema.name;
                    }
                } catch (e) {
                    // 继续下一个schema
                }
            }
        } catch (e) {
            console.warn('Schema.org parsing error:', e.message);
        }
    }

    // Extract keywords
    const keywordsMeta = doc.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
        extractedInfo.keywords = keywordsMeta.getAttribute('content') || '';
    }

    // Extract main headings
    const headings = doc.querySelectorAll('h1, h2, h3');
    extractedInfo.headings = Array.from(headings)
        .slice(0, 5) // Take only first 5 headings
        .map(h => h.textContent.trim())
        .filter(text => text.length > 0);

    // Extract possible logos with improved detection
    extractedInfo.logoUrls = extractLogos(doc, url);

    // Extract main text content - 优先级方式提取，避免重复
    let textContent = '';

    // 优先级1：尝试从明确的容器中提取
    const mainContentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.main-content',
        '.content',
        '#content'
    ];

    for (const selector of mainContentSelectors) {
        try {
            const element = doc.querySelector(selector);
            if (element) {
                textContent = element.textContent.trim();
                if (textContent.length > 100) {
                    break; // 找到足够内容就停止
                }
            }
        } catch (e) {
            // 继续
        }
    }

    // 优先级2：如果没有找到足够内容，从段落中收集
    if (textContent.length < 100) {
        const paragraphs = Array.from(doc.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(text => text.length > 20)
            .slice(0, 5);
        textContent = paragraphs.join(' ');
    }

    // 优先级3：最后尝试其他容器
    if (textContent.length < 100) {
        const otherSelectors = [
            '.description',
            '.about',
            '.intro',
            '[class*="desc"]'
        ];

        for (const selector of otherSelectors) {
            try {
                const elements = Array.from(doc.querySelectorAll(selector))
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 20)
                    .slice(0, 3);
                if (elements.length > 0) {
                    textContent = textContent ? textContent + ' ' + elements.join(' ') : elements.join(' ');
                    break;
                }
            } catch (e) {
                // 继续
            }
        }
    }

    extractedInfo.text = textContent.substring(0, 1200); // 合理的限制

    // Format output
    let formattedContent = `Website Title: ${extractedInfo.title}\n`;

    if (extractedInfo.description) {
        formattedContent += `Website Description: ${extractedInfo.description}\n`;
    }

    if (extractedInfo.keywords) {
        formattedContent += `Keywords: ${extractedInfo.keywords}\n`;
    }

    if (extractedInfo.headings.length > 0) {
        formattedContent += `Main Headings: ${extractedInfo.headings.join(', ')}\n`;
    }

    if (extractedInfo.logoUrls.length > 0) {
        formattedContent += `Possible Logo: ${extractedInfo.logoUrls[0]}\n`;
    }

    if (extractedInfo.text) {
        formattedContent += `Website Content Summary: ${extractedInfo.text}\n`;
    }

    return formattedContent;
}

/**
 * Get content via content script (fallback method)
 * @param {string} url Website URL
 * @returns {Promise<string>} Website content
 */
async function getContentViaContentScript(url) {
    return new Promise((resolve, reject) => {
        // Create new tab
        chrome.tabs.create({ url: url, active: false }, (tab) => {
            // Wait for page to load
            setTimeout(() => {
                // Inject content script on demand before requesting extraction
                chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
                    // Proceed to message after injection attempt
                    chrome.tabs.sendMessage(tab.id, { action: 'extractContent' }, (response) => {
                        // Close tab
                        chrome.tabs.remove(tab.id);

                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }

                        if (response && response.success) {
                            resolve(response.content);
                        } else {
                            reject(new Error('Unable to extract website content'));
                        }
                    });
                });
            }, 3000); // Wait 3 seconds for page to load
        });
    });
}

// Handle extension icon click - prioritize opening sidebar
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Try to open sidebar first
        await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (error) {
        console.log('Unable to open sidebar, using default popup:', error);
        // If unable to open sidebar, fall back to popup configured in manifest
    }
});

// Listen for storage changes, for debugging
chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('Storage changes:', changes, namespace);
});

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Extension first time installation');
        // Can set default values or show welcome page here
    } else if (details.reason === 'update') {
        console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Background script error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});