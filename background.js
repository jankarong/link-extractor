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
    }
});

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

    // Extract meta description
    const descriptionMeta = doc.querySelector('meta[name="description"], meta[property="og:description"]');
    if (descriptionMeta) {
        extractedInfo.description = descriptionMeta.getAttribute('content') || '';
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

    // Extract possible logos
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
                // Convert relative URL to absolute URL
                try {
                    const absoluteUrl = new URL(src, url).href;
                    extractedInfo.logoUrls.push(absoluteUrl);
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        });
    });

    // Extract main text content
    const textElements = doc.querySelectorAll('p, .description, .about, .intro, [class*="desc"]');
    const textContent = Array.from(textElements)
        .slice(0, 10) // Take only first 10 paragraphs
        .map(el => el.textContent.trim())
        .filter(text => text.length > 20) // Filter out text that's too short
        .join(' ');

    extractedInfo.text = textContent.substring(0, 1000); // Limit length

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