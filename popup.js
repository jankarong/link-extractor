class LinkExtractorPopup {
    constructor() {
        this.currentMode = 'ai';
        this.currentProduct = {
            productName: '',
            website: '',
            tagline: '',
            description: '',
            features: '',
            logo: null
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
        
        // Logo上传
        document.getElementById('uploadLogoBtn').addEventListener('click', () => this.triggerLogoUpload());
        document.getElementById('logoUpload').addEventListener('change', (e) => this.handleLogoUpload(e));
        
        // 表单输入
        document.getElementById('productName').addEventListener('input', (e) => this.updateCurrentProduct('productName', e.target.value));
        document.getElementById('website').addEventListener('input', (e) => this.updateCurrentProduct('website', e.target.value));
        document.getElementById('tagline').addEventListener('input', (e) => this.updateCurrentProduct('tagline', e.target.value));
        document.getElementById('description').addEventListener('input', (e) => this.updateCurrentProduct('description', e.target.value));
        document.getElementById('features').addEventListener('input', (e) => this.updateCurrentProduct('features', e.target.value));
        
        // 操作按钮
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProduct());
        document.getElementById('fillBtn').addEventListener('click', () => this.fillForm());
        
        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        
        // 侧边栏按钮
        document.getElementById('sidebarBtn').addEventListener('click', () => this.openSidebar());
        document.getElementById('tipSidebarBtn').addEventListener('click', () => this.openSidebar());
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
            this.showMessage('请输入网站URL', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showMessage('请输入有效的URL', 'error');
            return;
        }

        // 检查API key
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            this.showMessage('请先在设置中配置Gemini API Key', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            const analysis = await this.callGeminiAPI(url, apiKey);
            this.fillProductInfo(analysis);
            
            // AI分析成功后自动保存
            setTimeout(async () => {
                const autoSaved = await this.autoSaveAfterAnalysis();
                if (autoSaved) {
                    this.showMessage('AI分析完成并已自动保存！', 'success');
                }
            }, 100);
            
        } catch (error) {
            console.error('AI分析失败:', error);
            this.showMessage('AI分析失败，请检查网络连接和API Key', 'error');
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
        
        if (analysis.features) {
            document.getElementById('features').value = analysis.features;
            this.currentProduct.features = analysis.features;
            console.log('设置功能:', analysis.features);
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
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            
            // 转换为Data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentProduct.logo = e.target.result;
                this.updateLogoDisplay();
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('加载logo失败:', error);
        }
    }

    triggerLogoUpload() {
        document.getElementById('logoUpload').click();
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showMessage('请选择图片文件', 'error');
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
            logoContainer.innerHTML = '<div class="logo-placeholder">未选择Logo</div>';
        }
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
            const features = document.getElementById('features').value;
            
            // 更新currentProduct以确保数据同步
            this.currentProduct.productName = productName;
            this.currentProduct.website = website;
            this.currentProduct.tagline = tagline;
            this.currentProduct.description = description;
            this.currentProduct.features = features;
            
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
                        this.currentProduct.productName = 'AI分析产品';
                    }
                } else {
                    this.currentProduct.productName = 'AI分析产品';
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
            this.showMessage('请至少填写产品名称', 'error');
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
        this.showMessage('产品信息已保存', 'success');
    }

    async fillForm() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'fillForm',
                data: this.currentProduct
            });
            
            this.showMessage('表单填充完成！', 'success');
            
            // 关闭popup（可选）
            // window.close();
        } catch (error) {
            console.error('填充表单失败:', error);
            this.showMessage('填充表单失败，请确保页面支持自动填充', 'error');
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
            productsList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">暂无保存的产品</p>';
            return;
        }

        productsList.innerHTML = this.savedProducts.map(product => `
            <div class="product-item" data-product-id="${product.id}">
                <div class="product-item-logo">
                    ${product.logo ? `<img src="${product.logo}" alt="${product.productName}">` : '<div style="background-color: #f0f0f0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">无</div>'}
                </div>
                <div class="product-item-info">
                    <div class="product-item-name">
                        ${product.productName || '未命名产品'}
                        ${product.autoSaved ? '<span style="font-size: 10px; color: #1a73e8; margin-left: 4px;">🤖</span>' : ''}
                    </div>
                    <div class="product-item-website" style="font-size: 11px; color: #888; margin: 2px 0;">${product.website || '无网站'}</div>
                    <div class="product-item-tagline">${product.tagline || '无标语'}</div>
                    ${product.features ? `<div class="product-item-features" style="font-size: 10px; color: #666; margin-top: 2px;">${product.features.substring(0, 50)}${product.features.length > 50 ? '...' : ''}</div>` : ''}
                </div>
                <div class="product-item-actions">
                    <button class="load-product-btn" data-product-id="${product.id}" title="使用">📝</button>
                    <button class="delete-product-btn" data-product-id="${product.id}" title="删除">🗑️</button>
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

        this.currentProduct = { ...product };
        this.updateUI();
        this.showMessage('产品信息已加载', 'success');
    }

    async deleteProduct(productId) {
        if (!confirm('确定要删除这个产品吗？')) return;

        this.savedProducts = this.savedProducts.filter(p => p.id !== productId);
        await this.saveSavedProducts();
        this.updateProductsList();
        this.showMessage('产品已删除', 'success');
    }

    updateUI() {
        document.getElementById('productName').value = this.currentProduct.productName || '';
        document.getElementById('website').value = this.currentProduct.website || '';
        document.getElementById('tagline').value = this.currentProduct.tagline || '';
        document.getElementById('description').value = this.currentProduct.description || '';
        document.getElementById('features').value = this.currentProduct.features || '';
        this.updateLogoDisplay();
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
        chrome.runtime.openOptionsPage();
    }

    async openSidebar() {
        try {
            // 优先使用侧边栏模式
            console.log('正在打开侧边栏模式...');
            
            try {
                // 尝试打开侧边栏
                await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
                this.showMessage('侧边栏模式已打开！', 'success');
                
                // 1秒后关闭popup
                setTimeout(() => {
                    try {
                        window.close();
                    } catch (closeError) {
                        console.log('popup关闭失败，这是正常的:', closeError);
                    }
                }, 1000);
                return;
            } catch (sidebarError) {
                console.log('侧边栏API不可用，尝试全屏模式...', sidebarError);
            }
            
            // 如果侧边栏失败，回退到全屏模式
            console.log('正在打开全屏模式...');
            const fullscreenUrl = chrome.runtime.getURL('fullscreen.html');
            const tab = await chrome.tabs.create({ url: fullscreenUrl });
            
            if (tab && tab.id) {
                this.showMessage('已在新标签页打开！现在可以关闭这个弹窗了', 'success');
                
                // 1.5秒后自动关闭popup
                setTimeout(() => {
                    try {
                        window.close();
                    } catch (closeError) {
                        console.log('popup关闭失败，这是正常的:', closeError);
                    }
                }, 1500);
            } else {
                throw new Error('创建标签页失败');
            }
            
        } catch (error) {
            console.error('打开界面失败:', error);
            
            // 提供备用方案提示
            let errorMessage = '打开界面失败';
            if (error.message.includes('Chrome API')) {
                errorMessage += '：浏览器API不可用';
            } else if (error.message.includes('权限')) {
                errorMessage += '：扩展权限不足，请重新安装扩展';
            } else if (error.message.includes('标签页')) {
                errorMessage += '：无法创建新标签页';
            }
            
            this.showMessage(errorMessage + '，请手动在新标签页打开 chrome-extension://' + chrome.runtime.id + '/fullscreen.html', 'error');
        }
    }

    async openFullscreen() {
        try {
            const fullscreenUrl = chrome.runtime.getURL('fullscreen.html');
            const tab = await chrome.tabs.create({ url: fullscreenUrl });
            
            if (tab && tab.id) {
                this.showMessage('已改为全屏模式', 'success');
                setTimeout(() => {
                    try {
                        window.close();
                    } catch (closeError) {
                        console.log('popup关闭失败，这是正常的:', closeError);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('备用全屏模式也失败:', error);
            this.showMessage('无法打开扩展界面，请重新安装扩展', 'error');
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
        } else if (text.includes('全屏模式')) {
            duration = 4000; // 全屏模式相关消息显示4秒
        }
        
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

// 初始化popup（仅在popup页面中运行，不在其他模式中运行）
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否在其他模式中，如果是则不初始化
    const isFullscreen = document.title.includes('全屏模式') || window.location.href.includes('fullscreen.html');
    const isSidebar = document.title.includes('侧边栏模式') || window.location.href.includes('sidebar.html');
    
    if (!isFullscreen && !isSidebar) {
        new LinkExtractorPopup();
    }
});