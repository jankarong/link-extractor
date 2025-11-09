class SidePanelApp {
    constructor() {
        this.currentMode = 'ai';
        this.currentProduct = {
            productName: '',
            website: '',
            tagline: '',
            description: '',
            category: '',
            features: '',
            comment: '',
            logo: null,
            screenshot: null
        };
        this.savedProducts = [];

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadSavedProducts();
        this.updateUI();
    }

    bindEvents() {
        // 模式切换
        document.getElementById('aiModeBtn').addEventListener('click', () => this.switchMode('ai'));
        document.getElementById('manualModeBtn').addEventListener('click', () => this.switchMode('manual'));

        // AI分析按钮
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeWebsite());

        // Logo上传与下载
        document.getElementById('uploadLogoBtn').addEventListener('click', () => this.triggerLogoUpload());
        document.getElementById('logoUpload').addEventListener('change', (e) => this.handleLogoUpload(e));
        document.getElementById('downloadLogoBtn').addEventListener('click', () => this.downloadLogo());

        // 网页截图/上传
        const captureBtn = document.getElementById('captureScreenshotBtn');
        const uploadScreenshotBtn = document.getElementById('uploadScreenshotBtn');
        const downloadScreenshotBtn = document.getElementById('downloadScreenshotBtn');
        const screenshotUpload = document.getElementById('screenshotUpload');
        if (captureBtn) captureBtn.addEventListener('click', () => this.captureScreenshot());
        if (uploadScreenshotBtn) uploadScreenshotBtn.addEventListener('click', () => screenshotUpload && screenshotUpload.click());
        if (downloadScreenshotBtn) downloadScreenshotBtn.addEventListener('click', () => this.downloadScreenshot());
        if (screenshotUpload) screenshotUpload.addEventListener('change', (e) => this.handleScreenshotUpload(e));

        // 表单输入
        document.getElementById('productName').addEventListener('input', (e) => this.updateCurrentProduct('productName', e.target.value));
        document.getElementById('website').addEventListener('input', (e) => this.updateCurrentProduct('website', e.target.value));
        document.getElementById('tagline').addEventListener('input', (e) => this.updateCurrentProduct('tagline', e.target.value));
        document.getElementById('description').addEventListener('input', (e) => this.updateCurrentProduct('description', e.target.value));
        document.getElementById('category').addEventListener('input', (e) => this.updateCurrentProduct('category', e.target.value));
        document.getElementById('features').addEventListener('input', (e) => this.updateCurrentProduct('features', e.target.value));
        document.getElementById('comment').addEventListener('input', (e) => this.updateCurrentProduct('comment', e.target.value));

        // 操作按钮
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProduct());
        document.getElementById('fillBtn').addEventListener('click', () => this.fillForm());

        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    }

    switchMode(mode) {
        this.currentMode = mode;

        // 更新按钮状态
        document.getElementById('aiModeBtn').classList.toggle('active', mode === 'ai');
        document.getElementById('manualModeBtn').classList.toggle('active', mode === 'manual');

        // 切换界面
        document.getElementById('aiMode').classList.toggle('hidden', mode !== 'ai');
        document.getElementById('manualMode').classList.toggle('hidden', mode !== 'manual');

        this.updateFillButton();
    }

    async analyzeWebsite() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();

        if (!url) {
            const text = (window.langManager && window.langManager.getText('enterUrl')) || '请输入网站URL';
            this.showMessage(text, 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            const text = (window.langManager && window.langManager.getText('invalidUrl')) || '请输入有效的URL';
            this.showMessage(text, 'error');
            return;
        }

        // 检查API key
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            const text = (window.langManager && window.langManager.getText('configureApiKey')) || '请先在设置中配置Gemini API Key';
            this.showMessage(text, 'error');
            return;
        }

        this.showLoading(true);

        try {
            const analysis = await this.callGeminiAPI(url, apiKey);
            this.fillProductInfo(analysis);

            // 分析完成后，自动截图所输入网址的首页
            try {
                await this.captureUrlHomepage(url);
            } catch (capErr) {
                console.error('自动截图失败，跳过:', capErr);
            }

            // 自动保存（包含可能截到的截图）
            const autoSaved = await this.autoSaveAfterAnalysis();
            if (autoSaved) {
                const text = (window.langManager && window.langManager.getText('analysisAutoSaved')) || 'AI分析完成并已自动保存！';
                this.showMessage(text, 'success');
            }

        } catch (error) {
            console.error('AI分析失败:', error);

            // 根据错误类型提供更详细的诊断信息
            let errorMessage = 'AI分析失败，请检查网络连接和API Key';

            if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = 'API Key无效或已过期，请检查设置中的API Key';
            } else if (error.message.includes('429')) {
                errorMessage = 'API请求过于频繁，请稍后再试';
            } else if (error.message.includes('50')) {
                errorMessage = 'Gemini API服务器故障，请稍后重试';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = '网络连接失败，请检查互联网连接';
            } else if (error.message.includes('timeout')) {
                errorMessage = '请求超时，网络可能较慢，请重试';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'AI返回的数据格式错误，请重试或联系开发者';
            }

            this.showMessage(errorMessage, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async callGeminiAPI(url, apiKey) {
        try {
            // 首先获取网站内容
            const websiteContent = await this.fetchWebsiteContent(url);

            // 获取内容语言设置
            const contentLanguage = await this.getContentLanguage();

            // 使用新的Gemini API客户端
            const gemini = new GeminiAPI(apiKey);
            const analysis = await gemini.analyzeWebsite(websiteContent, url, contentLanguage);

            return analysis;
        } catch (error) {
            console.error('Gemini API调用失败:', error);
            throw error;
        }
    }

    async fetchWebsiteContent(url) {
        try {
            // 使用Chrome扩展的能力获取网站内容
            const response = await chrome.runtime.sendMessage({
                action: 'fetchWebsite',
                url: url
            });

            if (response.success) {
                return response.content;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('获取网站内容失败:', error);
            return `网站URL: ${url}`;  // 回退方案
        }
    }

    fillProductInfo(analysis) {
        console.log('AI分析结果:', analysis);

        if (analysis.productName) {
            document.getElementById('productName').value = analysis.productName;
            this.currentProduct.productName = analysis.productName;
            console.log('设置产品名称:', analysis.productName);
        }

        if (analysis.website) {
            document.getElementById('website').value = analysis.website;
            this.currentProduct.website = analysis.website;
            console.log('设置网站:', analysis.website);
        }

        if (analysis.tagline) {
            document.getElementById('tagline').value = analysis.tagline;
            this.currentProduct.tagline = analysis.tagline;
            console.log('设置标语:', analysis.tagline);
        }

        if (analysis.description) {
            document.getElementById('description').value = analysis.description;
            this.currentProduct.description = analysis.description;
            console.log('设置描述:', analysis.description);
        }

        if (analysis.category) {
            document.getElementById('category').value = analysis.category;
            this.currentProduct.category = analysis.category;
            console.log('设置分类:', analysis.category);
        }

        if (analysis.features) {
            document.getElementById('features').value = analysis.features;
            this.currentProduct.features = analysis.features;
            console.log('设置功能:', analysis.features);
        }

        if (analysis.comment) {
            document.getElementById('comment').value = analysis.comment;
            this.currentProduct.comment = analysis.comment;
            console.log('设置评论:', analysis.comment);
        }

        // 处理logo
        if (analysis.logoUrl) {
            this.loadLogoFromUrl(analysis.logoUrl);
        }

        console.log('填充完成后的currentProduct:', this.currentProduct);
        this.updateFillButton();
    }

    async loadLogoFromUrl(logoUrl) {
        try {
            // 使用background script来获取logo以避免CORS问题
            const response = await chrome.runtime.sendMessage({
                action: 'fetchLogo',
                logoUrl: logoUrl
            });

            if (response.success) {
                this.currentProduct.logo = response.dataUrl;
                this.updateLogoDisplay();
                console.log('Logo加载成功');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('加载logo失败:', error);
            // 设置一个占位符或保持原有状态
            console.log('尝试直接使用logoUrl作为src');
            this.currentProduct.logo = logoUrl; // 尝试直接使用URL
            this.updateLogoDisplay();
        }
    }

    triggerLogoUpload() {
        document.getElementById('logoUpload').click();
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            const text = (window.langManager && window.langManager.getText('selectImageFile')) || '请选择图片文件';
            this.showMessage(text, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentProduct.logo = e.target.result;
            this.updateLogoDisplay();
            this.updateFillButton();
        };
        reader.readAsDataURL(file);
    }

    updateLogoDisplay() {
        const logoContainer = document.getElementById('logoContainer');
        if (this.currentProduct.logo) {
            logoContainer.innerHTML = `<img src="${this.currentProduct.logo}" alt="Product Logo">`;
        } else {
            const noLogo = (window.langManager && window.langManager.getText('noLogo')) || '未选择Logo';
            logoContainer.innerHTML = `<div class="logo-placeholder">${noLogo}</div>`;
        }
    }

    updateScreenshotDisplay() {
        const container = document.getElementById('screenshotContainer');
        if (!container) return;
        if (this.currentProduct.screenshot) {
            container.innerHTML = `<img src="${this.currentProduct.screenshot}" alt="Page Screenshot">`;
        } else {
            const text = (window.langManager && window.langManager.getText('noScreenshot')) || '未截图';
            container.innerHTML = `<div class="logo-placeholder">${text}</div>`;
        }
    }

    async captureScreenshot() {
        try {
            // 优先使用表单中的网站链接；没有则使用AI输入框中的URL
            const websiteInput = document.getElementById('website');
            const aiUrlInput = document.getElementById('urlInput');
            const urlFromInputs = (websiteInput && websiteInput.value.trim()) || (aiUrlInput && aiUrlInput.value.trim()) || '';

            if (urlFromInputs && this.isValidUrl(urlFromInputs)) {
                await this.captureUrlHomepage(urlFromInputs);
            } else {
                // 回退：直接截取当前活动标签页
                const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
                this.currentProduct.screenshot = dataUrl;
                this.updateScreenshotDisplay();
                const okText = (window.langManager && window.langManager.getText('screenshotTaken')) || '已截取当前页面截图';
                this.showMessage(okText, 'success');
            }
        } catch (error) {
            console.error('截图失败:', error);
            const errText = (window.langManager && window.langManager.getText('screenshotFailed')) || '截图失败，请重试';
            this.showMessage(errText, 'error');
        }
    }

    async captureUrlHomepage(urlString) {
        // 记录当前活动标签页
        const [originalTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        let createdTabId = null;
        try {
            console.log('开始截图:', urlString);

            // 打开新的标签页并激活
            const newTab = await chrome.tabs.create({ url: urlString, active: true });
            createdTabId = newTab.id;
            console.log('创建新标签页:', createdTabId);

            // 等待页面加载完成并渲染
            await this.waitForTabComplete(createdTabId, 20000);
            await this.delay(1000); // 增加等待时间确保渲染完成

            // 确保标签页仍然存在且可见
            const tab = await chrome.tabs.get(createdTabId);
            if (tab.status !== 'complete') {
                console.log('页面仍在加载，等待更长时间');
                await this.delay(2000);
            }

            // 截图可见页面
            console.log('开始截图可见区域');
            const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

            if (dataUrl) {
                this.currentProduct.screenshot = dataUrl;
                this.updateScreenshotDisplay();
                const okText = (window.langManager && window.langManager.getText('screenshotTaken')) || '已截取页面截图';
                this.showMessage(okText, 'success');
                console.log('截图成功');
            } else {
                throw new Error('截图返回空数据');
            }
        } catch (error) {
            console.error('截图过程中出错:', error);
            const errText = (window.langManager && window.langManager.getText('screenshotFailed')) || `截图失败: ${error.message}`;
            this.showMessage(errText, 'error');
        } finally {
            // 清理：关闭临时标签并切回原标签
            try {
                if (createdTabId) {
                    console.log('关闭临时标签页:', createdTabId);
                    await chrome.tabs.remove(createdTabId);
                }
                if (originalTab && originalTab.id) {
                    console.log('切回原标签页:', originalTab.id);
                    await chrome.tabs.update(originalTab.id, { active: true });
                }
            } catch (cleanupError) {
                console.error('清理阶段出错:', cleanupError);
            }
        }
    }

    async waitForTabComplete(tabId, timeoutMs = 15000) {
        return new Promise((resolve) => {
            let resolved = false;

            const done = () => {
                if (!resolved) {
                    resolved = true;
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            };

            const listener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                    done();
                }
            };

            chrome.tabs.onUpdated.addListener(listener);

            // 双保险：超时也继续
            setTimeout(done, timeoutMs);
        });
    }

    async delay(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    downloadLogo() {
        try {
            if (!this.currentProduct.logo) {
                const text = (window.langManager && window.langManager.getText('noLogo')) || '未选择Logo';
                this.showMessage(text, 'error');
                return;
            }

            const link = document.createElement('a');
            link.href = this.currentProduct.logo;
            const productName = this.currentProduct.productName || 'logo';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `${productName}-logo-${timestamp}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            const successText = (window.langManager && window.langManager.getText('logoDownloaded')) || 'Logo已下载';
            this.showMessage(successText, 'success');
        } catch (error) {
            console.error('下载Logo失败:', error);
            const errorText = (window.langManager && window.langManager.getText('downloadLogoFailed')) || '下载Logo失败';
            this.showMessage(errorText, 'error');
        }
    }

    downloadScreenshot() {
        try {
            if (!this.currentProduct.screenshot) {
                const text = (window.langManager && window.langManager.getText('noScreenshot')) || '未截图';
                this.showMessage(text, 'error');
                return;
            }

            const link = document.createElement('a');
            link.href = this.currentProduct.screenshot;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `screenshot-${timestamp}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('下载截图失败:', error);
        }
    }

    handleScreenshotUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            const text = (window.langManager && window.langManager.getText('selectImageFile')) || '请选择图片文件';
            this.showMessage(text, 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentProduct.screenshot = e.target.result;
            this.updateScreenshotDisplay();
        };
        reader.readAsDataURL(file);
    }

    updateCurrentProduct(field, value) {
        this.currentProduct[field] = value;
        this.updateFillButton();
    }

    updateFillButton() {
        const fillBtn = document.getElementById('fillBtn');
        const hasRequiredInfo = this.currentProduct.productName ||
            this.currentProduct.website ||
            this.currentProduct.tagline ||
            this.currentProduct.description ||
            this.currentProduct.features;

        fillBtn.disabled = !hasRequiredInfo;
    }

    async autoSaveAfterAnalysis() {
        try {
            // 强制检查DOM中的值，以防currentProduct没有正确更新
            const productName = document.getElementById('productName').value;
            const website = document.getElementById('website').value;
            const tagline = document.getElementById('tagline').value;
            const description = document.getElementById('description').value;
            const category = document.getElementById('category').value;
            const features = document.getElementById('features').value;
            const comment = document.getElementById('comment').value;

            // 更新currentProduct以确保数据同步
            this.currentProduct.productName = productName;
            this.currentProduct.website = website;
            this.currentProduct.tagline = tagline;
            this.currentProduct.description = description;
            this.currentProduct.category = category;
            this.currentProduct.features = features;
            this.currentProduct.comment = comment;

            // 检查是否有足够的信息进行自动保存
            if (!productName && !website) {
                return false;
            }

            // 检查是否已经存在相同的产品（通过productName或website判断）
            const isDuplicate = this.savedProducts.some(product =>
                (this.currentProduct.productName && product.productName === this.currentProduct.productName) ||
                (this.currentProduct.website && product.website === this.currentProduct.website)
            );

            if (isDuplicate) {
                console.log('产品已存在，跳过自动保存');
                return false;
            }

            // 自动生成产品名称（如果缺失）
            if (!this.currentProduct.productName) {
                if (this.currentProduct.website) {
                    // 从网站URL提取域名作为产品名称
                    try {
                        const url = new URL(this.currentProduct.website);
                        this.currentProduct.productName = url.hostname.replace('www.', '').replace('.com', '').replace('.cn', '');
                        document.getElementById('productName').value = this.currentProduct.productName;
                    } catch (e) {
                        this.currentProduct.productName = (window.langManager && window.langManager.getText('aiAnalyzedProduct')) || 'AI分析产品';
                    }
                } else {
                    this.currentProduct.productName = (window.langManager && window.langManager.getText('aiAnalyzedProduct')) || 'AI分析产品';
                }
            }

            // 执行自动保存
            const productId = Date.now().toString();
            const productToSave = {
                id: productId,
                ...this.currentProduct,
                createdAt: new Date().toISOString(),
                autoSaved: true // 标记为自动保存
            };

            this.savedProducts.push(productToSave);
            await this.saveSavedProducts();
            this.updateProductsList();

            console.log('AI分析后自动保存成功');
            return true;

        } catch (error) {
            console.error('自动保存失败:', error);
            return false;
        }
    }

    async saveProduct() {
        if (!this.currentProduct.productName) {
            const text = (window.langManager && window.langManager.getText('enterProductName')) || '请至少填写产品名称';
            this.showMessage(text, 'error');
            return;
        }

        const productId = Date.now().toString();
        const productToSave = {
            id: productId,
            ...this.currentProduct,
            createdAt: new Date().toISOString()
        };

        this.savedProducts.push(productToSave);
        await this.saveSavedProducts();
        this.updateProductsList();
        const savedText = (window.langManager && window.langManager.getText('infoSaved')) || '产品信息已保存';
        this.showMessage(savedText, 'success');
    }

    async fillForm() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            // Ensure content script is injected on demand before sending message
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            } catch (_) {
                // Ignore if already injected or injection not needed
            }

            await chrome.tabs.sendMessage(tab.id, {
                action: 'fillForm',
                data: this.currentProduct
            });

            const okText = (window.langManager && window.langManager.getText('formFilled')) || '表单填充完成！';
            this.showMessage(okText, 'success');

        } catch (error) {
            console.error('填充表单失败:', error);
            const errText = (window.langManager && window.langManager.getText('fillFailed')) || '填充表单失败，请确保页面支持自动填充';
            this.showMessage(errText, 'error');
        }
    }

    async loadSavedProducts() {
        try {
            const result = await chrome.storage.local.get(['savedProducts']);
            this.savedProducts = result.savedProducts || [];
        } catch (error) {
            console.error('加载已保存产品失败:', error);
            this.savedProducts = [];
        }
    }

    async saveSavedProducts() {
        try {
            await chrome.storage.local.set({ savedProducts: this.savedProducts });
        } catch (error) {
            console.error('保存产品失败:', error);
        }
    }

    updateProductsList() {
        const productsList = document.getElementById('productsList');

        if (this.savedProducts.length === 0) {
            const text = (window.langManager && window.langManager.getText('noSavedProducts')) || '暂无保存的产品';
            productsList.innerHTML = `<p style="color: #666; text-align: center; padding: 20px;">${text}</p>`;
            return;
        }

        productsList.innerHTML = this.savedProducts.map(product => `
            <div class="product-item" data-product-id="${product.id}">
                <div class="product-item-logo">
                    ${product.logo ? `<img src="${product.logo}" alt="${product.productName}">` : `<div style=\"background-color: #f0f0f0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;\">${(window.langManager && window.langManager.getText('none')) || '无'}</div>`}
                </div>
                <div class="product-item-info">
                    <div class="product-item-name">
                        ${product.productName || ((window.langManager && window.langManager.getText('unnamedProduct')) || '未命名产品')}
                        ${product.autoSaved ? '<span style="font-size: 10px; color: #1a73e8; margin-left: 4px;">🤖</span>' : ''}
                    </div>
                    <div class="product-item-website" style="font-size: 11px; color: #888; margin: 2px 0;">${product.website || ((window.langManager && window.langManager.getText('noWebsite')) || '无网站')}</div>
                    <div class="product-item-tagline">${product.tagline || ((window.langManager && window.langManager.getText('noTagline')) || '无标语')}</div>
                    ${product.category ? `<div class="product-item-category" style="font-size: 10px; color: #007bff; background-color: #e3f2fd; padding: 2px 6px; border-radius: 8px; display: inline-block; margin: 2px 0;">${product.category}</div>` : ''}
                    ${product.features ? `<div class="product-item-features" style="font-size: 10px; color: #666; margin-top: 2px;">${product.features.substring(0, 50)}${product.features.length > 50 ? '...' : ''}</div>` : ''}
                </div>
                <div class="product-item-actions">
                    <button class="load-product-btn" data-product-id="${product.id}" title="${(window.langManager && window.langManager.getText('use')) || '使用'}">📝</button>
                    <button class="delete-product-btn" data-product-id="${product.id}" title="${(window.langManager && window.langManager.getText('delete')) || '删除'}">🗑️</button>
                </div>
            </div>
        `).join('');

        // 绑定产品操作按钮事件
        this.bindProductButtonEvents();
    }

    bindProductButtonEvents() {
        const productsList = document.getElementById('productsList');

        // 避免重复绑定，先移除现有监听器
        if (this.productsListHandler) {
            productsList.removeEventListener('click', this.productsListHandler);
        }

        // 创建新的事件处理器
        this.productsListHandler = (e) => {
            const target = e.target;
            let productId = target.getAttribute('data-product-id');

            // 如果点击的不是按钮，向上查找产品项目
            if (!productId) {
                const productItem = target.closest('.product-item');
                if (productItem) {
                    productId = productItem.getAttribute('data-product-id');
                }
            }

            if (!productId) return;

            if (target.classList.contains('load-product-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.loadProduct(productId);
            } else if (target.classList.contains('delete-product-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.deleteProduct(productId);
            } else if (target.closest('.product-item') && !target.closest('.product-item-actions')) {
                // 点击产品项目的其他区域（不是按钮区域）时加载产品
                e.preventDefault();
                this.loadProduct(productId);
            }
        };

        // 绑定事件监听器
        productsList.addEventListener('click', this.productsListHandler);
    }

    loadProduct(productId) {
        const product = this.savedProducts.find(p => p.id === productId);
        if (!product) return;

        // 深拷贝产品数据，确保不会共享引用
        this.currentProduct = JSON.parse(JSON.stringify(product));
        this.updateUI();
        const text = (window.langManager && window.langManager.getText('productLoaded')) || '产品信息已加载';
        this.showMessage(text, 'success');
    }

    async deleteProduct(productId) {
        const confirmText = (window.langManager && window.langManager.getText('confirmDeleteProduct')) || '确定要删除这个产品吗？';
        if (!confirm(confirmText)) return;

        this.savedProducts = this.savedProducts.filter(p => p.id !== productId);
        await this.saveSavedProducts();
        this.updateProductsList();
        const text = (window.langManager && window.langManager.getText('productDeleted')) || '产品已删除';
        this.showMessage(text, 'success');
    }

    updateUI() {
        document.getElementById('productName').value = this.currentProduct.productName || '';
        document.getElementById('website').value = this.currentProduct.website || '';
        document.getElementById('tagline').value = this.currentProduct.tagline || '';
        document.getElementById('description').value = this.currentProduct.description || '';
        document.getElementById('category').value = this.currentProduct.category || '';
        document.getElementById('features').value = this.currentProduct.features || '';
        document.getElementById('comment').value = this.currentProduct.comment || '';
        this.updateLogoDisplay();
        this.updateScreenshotDisplay();
        this.updateFillButton();
        this.updateProductsList();
    }

    async getApiKey() {
        try {
            const result = await chrome.storage.local.get(['geminiApiKey']);
            return result.geminiApiKey;
        } catch (error) {
            console.error('获取API Key失败:', error);
            return null;
        }
    }

    async getContentLanguage() {
        try {
            const result = await chrome.storage.local.get(['contentLanguage']);
            return result.contentLanguage || 'en'; // 默认英文
        } catch (error) {
            console.error('获取内容语言设置失败:', error);
            return 'en';
        }
    }

    openSettings() {
        try {
            // 在侧边栏内直接跳转到设置页面，而不是打开新标签页
            const optionsUrl = chrome.runtime.getURL('options.html?from=sidepanel');
            window.location.href = optionsUrl;
        } catch (error) {
            console.error('打开设置失败，回退到默认行为:', error);
            chrome.runtime.openOptionsPage();
        }
    }

    showMessage(text, type = 'success') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');

        // 根据消息类型和长度调整显示时间
        let duration = 3000; // 默认3秒
        if (type === 'error') {
            duration = Math.max(5000, text.length * 50); // 错误消息至少5秒，长消息更久
        }

        // 确保滚动到消息位置（顶部），避免在底部看不到
        try {
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (_) { }

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, duration);
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
        document.getElementById('analyzeBtn').disabled = show;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// 初始化侧边栏应用
document.addEventListener('DOMContentLoaded', () => {
    new SidePanelApp();
});