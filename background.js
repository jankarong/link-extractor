// Background Service Worker for Link Extractor Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
    console.log('外链信息填充助手已安装');
});

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchWebsite') {
        fetchWebsiteContent(request.url)
            .then(content => {
                sendResponse({ success: true, content });
            })
            .catch(error => {
                console.error('获取网站内容失败:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        // 返回true表示异步响应
        return true;
    }
});

/**
 * 获取网站内容
 * @param {string} url 网站URL
 * @returns {Promise<string>} 网站内容
 */
async function fetchWebsiteContent(url) {
    try {
        // 使用fetch获取网站内容
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
        
        // 提取关键信息
        const extractedContent = extractRelevantContent(html, url);
        
        return extractedContent;
    } catch (error) {
        console.error('Fetch failed:', error);
        
        // 如果直接fetch失败，尝试通过content script获取
        try {
            return await getContentViaContentScript(url);
        } catch (contentScriptError) {
            throw new Error(`无法获取网站内容: ${error.message}`);
        }
    }
}

/**
 * 从HTML中提取相关内容
 * @param {string} html HTML内容
 * @param {string} url 原始URL
 * @returns {string} 提取的内容
 */
function extractRelevantContent(html, url) {
    // 创建临时DOM来解析HTML
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

    // 提取标题
    const titleEl = doc.querySelector('title');
    if (titleEl) {
        extractedInfo.title = titleEl.textContent.trim();
    }

    // 提取meta描述
    const descriptionMeta = doc.querySelector('meta[name="description"], meta[property="og:description"]');
    if (descriptionMeta) {
        extractedInfo.description = descriptionMeta.getAttribute('content') || '';
    }

    // 提取关键词
    const keywordsMeta = doc.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
        extractedInfo.keywords = keywordsMeta.getAttribute('content') || '';
    }

    // 提取主要标题
    const headings = doc.querySelectorAll('h1, h2, h3');
    extractedInfo.headings = Array.from(headings)
        .slice(0, 5) // 只取前5个标题
        .map(h => h.textContent.trim())
        .filter(text => text.length > 0);

    // 提取可能的logo
    const logoSelectors = [
        'img[alt*="logo" i]',
        'img[src*="logo" i]',
        'img[class*="logo" i]',
        '.logo img',
        '#logo img',
        '[class*="brand"] img',
        'header img[src*="logo" i]',
        '.navbar-brand img',
        '.site-logo img'
    ];

    logoSelectors.forEach(selector => {
        const logoEls = doc.querySelectorAll(selector);
        logoEls.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !extractedInfo.logoUrls.includes(src)) {
                // 转换相对URL为绝对URL
                try {
                    const absoluteUrl = new URL(src, url).href;
                    extractedInfo.logoUrls.push(absoluteUrl);
                } catch (e) {
                    // 忽略无效的URL
                }
            }
        });
    });

    // 提取主要文本内容
    const textElements = doc.querySelectorAll('p, .description, .about, .intro, [class*="desc"]');
    const textContent = Array.from(textElements)
        .slice(0, 10) // 只取前10个段落
        .map(el => el.textContent.trim())
        .filter(text => text.length > 20) // 过滤太短的文本
        .join(' ');

    extractedInfo.text = textContent.substring(0, 1000); // 限制长度

    // 格式化输出
    let formattedContent = `网站标题: ${extractedInfo.title}\n`;
    
    if (extractedInfo.description) {
        formattedContent += `网站描述: ${extractedInfo.description}\n`;
    }
    
    if (extractedInfo.keywords) {
        formattedContent += `关键词: ${extractedInfo.keywords}\n`;
    }
    
    if (extractedInfo.headings.length > 0) {
        formattedContent += `主要标题: ${extractedInfo.headings.join(', ')}\n`;
    }
    
    if (extractedInfo.logoUrls.length > 0) {
        formattedContent += `可能的Logo: ${extractedInfo.logoUrls[0]}\n`;
    }
    
    if (extractedInfo.text) {
        formattedContent += `网站内容摘要: ${extractedInfo.text}\n`;
    }

    return formattedContent;
}

/**
 * 通过content script获取内容（备用方案）
 * @param {string} url 网站URL
 * @returns {Promise<string>} 网站内容
 */
async function getContentViaContentScript(url) {
    return new Promise((resolve, reject) => {
        // 创建新标签页
        chrome.tabs.create({ url: url, active: false }, (tab) => {
            // 等待页面加载
            setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: 'extractContent' }, (response) => {
                    // 关闭标签页
                    chrome.tabs.remove(tab.id);
                    
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    
                    if (response && response.success) {
                        resolve(response.content);
                    } else {
                        reject(new Error('无法提取网站内容'));
                    }
                });
            }, 3000); // 等待3秒让页面加载
        });
    });
}

// 处理扩展图标点击
chrome.action.onClicked.addListener((tab) => {
    // 打开popup（这个在manifest中已经配置了，这里只是备用）
    chrome.action.openPopup();
});

// 监听存储变化，用于调试
chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('存储变化:', changes, namespace);
});

// 处理安装和更新
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('插件首次安装');
        // 可以在这里设置默认值或显示欢迎页面
    } else if (details.reason === 'update') {
        console.log('插件已更新到版本:', chrome.runtime.getManifest().version);
    }
});

// 错误处理
self.addEventListener('error', (event) => {
    console.error('Background script error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});