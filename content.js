// Content Script for Link Extractor Chrome Extension
// 负责在网页中自动填充表单

class FormFiller {
    constructor() {
        this.debug = true; // 暂时启用调试信息来帮助排查问题
        this.init();
    }

    init() {
        // 监听来自popup的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'fillForm') {
                this.fillForm(request.data);
                sendResponse({ success: true });
            } else if (request.action === 'extractContent') {
                const content = this.extractPageContent();
                sendResponse({ success: true, content });
            }
            
            return true; // 保持消息通道开放
        });

        if (this.debug) {
            console.log('外链填充助手 Content Script 已加载');
            console.log('使用 window.testFormFields() 来测试字段识别');
            
            // 暴露测试方法到全局作用域
            window.testFormFields = () => {
                const fields = this.findFormFields();
                console.log('=== 表单字段识别测试 ===');
                console.log('产品名称字段:', fields.name.length, '个');
                console.log('网站URL字段:', fields.website.length, '个');
                console.log('标语字段:', fields.tagline.length, '个');
                console.log('描述字段:', fields.description.length, '个');
                console.log('功能字段:', fields.features.length, '个');
                console.log('Logo字段:', fields.logo.length, '个');
                console.log('详细信息:', fields);
                return fields;
            };
        }
    }

    /**
     * 填充表单
     * @param {Object} data 要填充的数据
     */
    fillForm(data) {
        try {
            const fields = this.findFormFields();
            
            if (this.debug) {
                console.log('=== 外链填充助手调试信息 ===');
                console.log('找到的表单字段:', fields);
                console.log('要填充的数据:', data);
                console.log('网站URL字段数量:', fields.website.length);
                if (fields.website.length > 0) {
                    console.log('网站URL字段详情:', fields.website.map(el => ({
                        tagName: el.tagName,
                        name: el.name,
                        id: el.id,
                        placeholder: el.placeholder,
                        className: el.className,
                        type: el.type
                    })));
                }
                console.log('==============================');
            }

            // 填充产品名称
            if (data.productName) {
                this.fillField(fields.name, data.productName);
            }

            // 填充网站URL
            if (data.website) {
                if (this.debug) {
                    console.log(`尝试填充网站URL: ${data.website} 到 ${fields.website.length} 个字段`);
                }
                this.fillField(fields.website, data.website);
            }

            // 填充标语
            if (data.tagline) {
                this.fillField(fields.tagline, data.tagline);
            }

            // 填充描述
            if (data.description) {
                this.fillField(fields.description, data.description);
            }

            // 填充功能特点
            if (data.features) {
                this.fillField(fields.features, data.features);
            }

            // 处理logo
            if (data.logo) {
                this.handleLogoUpload(fields.logo, data.logo);
            }

            // 触发change事件以确保网站检测到变化
            this.triggerChangeEvents(fields);

            if (this.debug) {
                console.log('表单填充完成');
            }

        } catch (error) {
            console.error('填充表单时发生错误:', error);
        }
    }

    /**
     * 查找页面中的表单字段
     * @returns {Object} 包含各类字段的对象
     */
    findFormFields() {
        const fields = {
            name: [],
            website: [],
            tagline: [],
            description: [],
            features: [],
            logo: []
        };

        // 产品名称字段的可能选择器
        const nameSelectors = [
            'input[name*="name" i]',
            'input[placeholder*="name" i]',
            'input[id*="name" i]',
            'input[name*="title" i]',
            'input[placeholder*="title" i]',
            'input[id*="title" i]',
            'input[name*="product" i]',
            'input[placeholder*="product" i]',
            'input[id*="product" i]',
            'input[aria-label*="name" i]',
            'input[aria-label*="title" i]'
        ];

        // 网站URL字段的可能选择器
        const websiteSelectors = [
            // 基础URL字段
            'input[type="url"]',
            'input[name*="url" i]',
            'input[placeholder*="url" i]',
            'input[id*="url" i]',
            'input[class*="url" i]',
            
            // 网站相关字段
            'input[name*="website" i]',
            'input[placeholder*="website" i]',
            'input[id*="website" i]',
            'input[class*="website" i]',
            
            // 站点相关字段
            'input[name*="site" i]',
            'input[placeholder*="site" i]',
            'input[id*="site" i]',
            'input[class*="site" i]',
            
            // 链接相关字段
            'input[name*="link" i]',
            'input[placeholder*="link" i]',
            'input[id*="link" i]',
            'input[class*="link" i]',
            
            // 域名相关字段
            'input[name*="domain" i]',
            'input[placeholder*="domain" i]',
            'input[id*="domain" i]',
            'input[class*="domain" i]',
            
            // 主页相关字段
            'input[name*="homepage" i]',
            'input[placeholder*="homepage" i]',
            'input[id*="homepage" i]',
            'input[name*="home" i]',
            'input[placeholder*="home" i]',
            'input[id*="home" i]',
            
            // Web相关字段
            'input[name*="web" i]',
            'input[placeholder*="web" i]',
            'input[id*="web" i]',
            
            // HTTP相关字段
            'input[name*="http" i]',
            'input[placeholder*="http" i]',
            'input[id*="http" i]',
            
            // 项目相关字段
            'input[name*="project" i]',
            'input[placeholder*="project" i]',
            'input[id*="project" i]',
            
            // Accessibility标签
            'input[aria-label*="url" i]',
            'input[aria-label*="website" i]',
            'input[aria-label*="link" i]',
            'input[aria-label*="site" i]',
            'input[aria-label*="domain" i]'
        ];

        // 标语字段的可能选择器
        const taglineSelectors = [
            'input[name*="tagline" i]',
            'input[placeholder*="tagline" i]',
            'input[id*="tagline" i]',
            'input[name*="slogan" i]',
            'input[placeholder*="slogan" i]',
            'input[id*="slogan" i]',
            'input[name*="subtitle" i]',
            'input[placeholder*="subtitle" i]',
            'input[id*="subtitle" i]',
            'input[name*="short" i]',
            'input[placeholder*="short" i]',
            'input[aria-label*="tagline" i]',
            'input[aria-label*="slogan" i]'
        ];

        // 描述字段的可能选择器
        const descriptionSelectors = [
            'textarea[name*="description" i]',
            'textarea[placeholder*="description" i]',
            'textarea[id*="description" i]',
            'textarea[name*="desc" i]',
            'textarea[placeholder*="desc" i]',
            'textarea[id*="desc" i]',
            'textarea[name*="about" i]',
            'textarea[placeholder*="about" i]',
            'textarea[id*="about" i]',
            'textarea[name*="summary" i]',
            'textarea[placeholder*="summary" i]',
            'textarea[id*="summary" i]',
            'textarea[aria-label*="description" i]',
            'input[name*="description" i]',
            'input[placeholder*="description" i]',
            'input[id*="description" i]',
            // 富文本编辑器
            '[contenteditable="true"]',
            '.ql-editor', // Quill编辑器
            '.fr-element', // Froala编辑器
            '.note-editable' // Summernote编辑器
        ];

        // 功能特点字段的可能选择器
        const featuresSelectors = [
            'textarea[name*="feature" i]',
            'textarea[placeholder*="feature" i]',
            'textarea[id*="feature" i]',
            'input[name*="feature" i]',
            'input[placeholder*="feature" i]',
            'input[id*="feature" i]',
            'textarea[name*="benefit" i]',
            'textarea[placeholder*="benefit" i]',
            'textarea[id*="benefit" i]',
            'textarea[name*="highlight" i]',
            'textarea[placeholder*="highlight" i]',
            'textarea[id*="highlight" i]',
            'textarea[name*="key" i]',
            'textarea[placeholder*="key" i]',
            'textarea[id*="key" i]',
            'input[name*="benefit" i]',
            'input[placeholder*="benefit" i]',
            'input[id*="benefit" i]',
            'textarea[aria-label*="feature" i]',
            'input[aria-label*="feature" i]'
        ];

        // Logo上传字段的可能选择器
        const logoSelectors = [
            'input[type="file"][name*="logo" i]',
            'input[type="file"][id*="logo" i]',
            'input[type="file"][placeholder*="logo" i]',
            'input[type="file"][name*="image" i]',
            'input[type="file"][id*="image" i]',
            'input[type="file"][name*="icon" i]',
            'input[type="file"][id*="icon" i]',
            'input[type="file"][accept*="image"]',
            'input[type="file"][aria-label*="logo" i]',
            'input[type="file"][aria-label*="image" i]'
        ];

        // 收集所有匹配的字段
        nameSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.name.push(el);
                }
            });
        });

        websiteSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.website.push(el);
                }
            });
        });

        taglineSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.tagline.push(el);
                }
            });
        });

        descriptionSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.description.push(el);
                }
            });
        });

        featuresSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.features.push(el);
                }
            });
        });

        logoSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.logo.push(el);
                }
            });
        });

        // 去重
        Object.keys(fields).forEach(key => {
            fields[key] = [...new Set(fields[key])];
        });

        return fields;
    }

    /**
     * 填充字段
     * @param {Array} elements 要填充的元素数组
     * @param {string} value 要填充的值
     */
    fillField(elements, value) {
        if (!elements || elements.length === 0) return;

        elements.forEach(element => {
            try {
                if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                    // 普通输入框和文本域
                    element.focus();
                    element.value = value;
                    
                    // 触发各种事件以确保网站检测到变化
                    this.triggerEvent(element, 'input');
                    this.triggerEvent(element, 'change');
                    this.triggerEvent(element, 'blur');
                    
                } else if (element.hasAttribute('contenteditable')) {
                    // 富文本编辑器
                    element.focus();
                    element.innerHTML = value.replace(/\n/g, '<br>');
                    
                    this.triggerEvent(element, 'input');
                    this.triggerEvent(element, 'blur');
                }

                if (this.debug) {
                    console.log(`✅ 已填充字段: ${element.tagName}[name="${element.name || '无'}", id="${element.id || '无'}", placeholder="${element.placeholder || '无'}"] = ${value}`);
                }

            } catch (error) {
                console.error('填充字段时出错:', error, element);
            }
        });
    }

    /**
     * 处理Logo上传
     * @param {Array} elements logo上传字段数组  
     * @param {string} logoDataUrl logo的Data URL
     */
    async handleLogoUpload(elements, logoDataUrl) {
        if (!elements || elements.length === 0) return;

        try {
            // 将Data URL转换为File对象
            const file = await this.dataURLtoFile(logoDataUrl, 'logo.png');
            
            elements.forEach(element => {
                try {
                    // 创建DataTransfer对象来模拟文件选择
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    
                    element.files = dataTransfer.files;
                    
                    // 触发change事件
                    this.triggerEvent(element, 'change');
                    
                    if (this.debug) {
                        console.log(`已上传Logo到字段: ${element.name || element.id}`);
                    }
                    
                } catch (error) {
                    console.error('上传logo到字段时出错:', error, element);
                }
            });
            
        } catch (error) {
            console.error('处理logo上传时出错:', error);
        }
    }

    /**
     * 将Data URL转换为File对象
     * @param {string} dataurl Data URL
     * @param {string} filename 文件名
     * @returns {Promise<File>} File对象
     */
    dataURLtoFile(dataurl, filename) {
        return new Promise((resolve) => {
            const arr = dataurl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            const file = new File([u8arr], filename, { type: mime });
            resolve(file);
        });
    }

    /**
     * 触发DOM事件
     * @param {Element} element 目标元素
     * @param {string} eventType 事件类型
     */
    triggerEvent(element, eventType) {
        try {
            const event = new Event(eventType, {
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(event);
            
            // 额外触发React/Vue等框架可能需要的事件
            if (eventType === 'input') {
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: element.value
                });
                element.dispatchEvent(inputEvent);
            }
        } catch (error) {
            if (this.debug) {
                console.warn('触发事件失败:', eventType, error);
            }
        }
    }

    /**
     * 为所有填充的字段触发change事件
     * @param {Object} fields 字段对象
     */
    triggerChangeEvents(fields) {
        Object.values(fields).forEach(fieldArray => {
            fieldArray.forEach(element => {
                // 延迟触发事件，让浏览器有时间处理
                setTimeout(() => {
                    this.triggerEvent(element, 'change');
                    this.triggerEvent(element, 'blur');
                }, 100);
            });
        });
    }

    /**
     * 检查元素是否可见
     * @param {Element} element 要检查的元素
     * @returns {boolean} 是否可见
     */
    isVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }

    /**
     * 检查元素是否被禁用
     * @param {Element} element 要检查的元素
     * @returns {boolean} 是否被禁用
     */
    isDisabled(element) {
        return element.disabled || element.readOnly;
    }

    /**
     * 提取页面内容（用于AI分析的备用方案）
     * @returns {string} 页面内容
     */
    extractPageContent() {
        const title = document.title || '';
        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
        const h1Elements = Array.from(document.querySelectorAll('h1')).map(h1 => h1.textContent.trim());
        const h2Elements = Array.from(document.querySelectorAll('h2')).slice(0, 5).map(h2 => h2.textContent.trim());
        
        // 提取可能的logo
        const logoImg = document.querySelector('img[alt*="logo" i], .logo img, #logo img, [class*="brand"] img');
        const logoUrl = logoImg ? new URL(logoImg.src, window.location.href).href : '';
        
        // 提取主要内容段落
        const paragraphs = Array.from(document.querySelectorAll('p, .description, .about'))
            .slice(0, 10)
            .map(p => p.textContent.trim())
            .filter(text => text.length > 20);

        const content = `
标题: ${title}
描述: ${metaDescription}
主要标题: ${h1Elements.join(', ')}
次级标题: ${h2Elements.join(', ')}
Logo URL: ${logoUrl}
主要内容: ${paragraphs.join(' ').substring(0, 1000)}
        `.trim();

        return content;
    }
}

// 初始化FormFiller
const formFiller = new FormFiller();