// 多语言配置文件
const I18N = {
    zh: {
        // Popup界面
        title: "外链信息填充助手",
        aiMode: "AI分析",
        manualMode: "手动输入",
        urlPlaceholder: "输入网站URL进行AI分析",
        analyzeBtn: "分析",
        manualTip: "手动填写产品信息",
        noLogo: "未选择Logo",
        uploadLogo: "上传Logo",
        productName: "产品名称",
        productNamePlaceholder: "输入产品名称",
        website: "网站链接",
        websitePlaceholder: "输入产品网站URL",
        tagline: "标语",
        taglinePlaceholder: "输入产品标语",
        description: "描述",
        descriptionPlaceholder: "输入产品描述",
        features: "主要功能",
        featuresPlaceholder: "输入产品的主要功能特点，用逗号分隔",
        saveInfo: "保存信息",
        fillForm: "一键填充",
        savedProducts: "已保存的产品",
        analyzing: "AI正在分析中...",
        
        // 设置页面
        settingsTitle: "外链信息填充助手 - 设置",
        settingsSubtitle: "设置和配置",
        geminiConfig: "🤖 Gemini AI 配置",
        apiKey: "Gemini API Key",
        apiKeyPlaceholder: "输入你的Gemini API Key",
        testConnection: "测试API连接",
        saveApiKey: "保存API Key",
        autoFillSettings: "⚙️ 自动填充设置",
        enableAutoFill: "启用自动填充功能",
        enableLogoUpload: "启用Logo自动上传",
        enableDebugMode: "启用调试模式",
        dataManagement: "💾 数据管理",
        exportData: "导出已保存的产品数据",
        importData: "导入产品数据",
        clearData: "清除所有数据",
        resetSettings: "重置所有设置",
        autoSaveNote: "💡 设置会自动保存，无需手动操作",
        
        // 消息
        enterUrl: "请输入网站URL",
        invalidUrl: "请输入有效的URL",
        configureApiKey: "请先在设置中配置Gemini API Key",
        analysisComplete: "AI分析完成！",
        analysisFailed: "AI分析失败，请检查网络连接和API Key",
        formFilled: "表单填充完成！",
        fillFailed: "填充表单失败，请确保页面支持自动填充",
        infoSaved: "产品信息已保存",
        enterProductName: "请至少填写产品名称",
        apiConnected: "✅ API连接成功！可以正常使用AI分析功能",
        apiError: "❌ API连接失败",
        
        // 语言设置
        languageSettings: "🌐 语言设置",
        interfaceLanguage: "界面语言",
        contentLanguage: "填充内容语言",
        chinese: "中文",
        english: "English",
        interfaceLanguageNote: "选择插件界面显示的语言",
        contentLanguageNote: "选择AI分析和表单填充时使用的语言"
    },
    
    en: {
        // Popup界面
        title: "Link Extractor Assistant",
        aiMode: "AI Analysis",
        manualMode: "Manual Input",
        urlPlaceholder: "Enter website URL for AI analysis",
        analyzeBtn: "Analyze",
        manualTip: "Manually fill product information",
        noLogo: "No Logo Selected",
        uploadLogo: "Upload Logo",
        productName: "Product Name",
        productNamePlaceholder: "Enter product name",
        website: "Website URL",
        websitePlaceholder: "Enter product website URL",
        tagline: "Tagline",
        taglinePlaceholder: "Enter product tagline",
        description: "Description",
        descriptionPlaceholder: "Enter product description",
        features: "Key Features",
        featuresPlaceholder: "Enter main product features, separated by commas",
        saveInfo: "Save Info",
        fillForm: "Auto Fill",
        savedProducts: "Saved Products",
        analyzing: "AI is analyzing...",
        
        // 设置页面
        settingsTitle: "Link Extractor Assistant - Settings",
        settingsSubtitle: "Settings and Configuration",
        geminiConfig: "🤖 Gemini AI Configuration",
        apiKey: "Gemini API Key",
        apiKeyPlaceholder: "Enter your Gemini API Key",
        testConnection: "Test Connection",
        saveApiKey: "Save API Key",
        autoFillSettings: "⚙️ Auto Fill Settings",
        enableAutoFill: "Enable auto fill functionality",
        enableLogoUpload: "Enable automatic logo upload",
        enableDebugMode: "Enable debug mode",
        dataManagement: "💾 Data Management",
        exportData: "Export saved product data",
        importData: "Import product data",
        clearData: "Clear all data",
        resetSettings: "Reset all settings",
        autoSaveNote: "💡 Settings are automatically saved",
        
        // 消息
        enterUrl: "Please enter website URL",
        invalidUrl: "Please enter a valid URL",
        configureApiKey: "Please configure Gemini API Key in settings first",
        analysisComplete: "AI analysis completed!",
        analysisFailed: "AI analysis failed, please check network connection and API Key",
        formFilled: "Form filled successfully!",
        fillFailed: "Failed to fill form, please ensure the page supports auto-fill",
        infoSaved: "Product information saved",
        enterProductName: "Please enter at least the product name",
        apiConnected: "✅ API connected successfully! You can now use AI analysis",
        apiError: "❌ API connection failed",
        
        // 语言设置
        languageSettings: "🌐 Language Settings",
        interfaceLanguage: "Interface Language",
        contentLanguage: "Content Language",
        chinese: "中文",
        english: "English",
        interfaceLanguageNote: "Choose the language for plugin interface",
        contentLanguageNote: "Choose the language for AI analysis and form filling"
    }
};

// 语言管理器
class LanguageManager {
    constructor() {
        this.interfaceLanguage = 'zh'; // 界面语言，默认中文
        this.contentLanguage = 'en';   // 填充内容语言，默认英文
        this.loadLanguages();
    }

    async loadLanguages() {
        try {
            const result = await chrome.storage.local.get(['interfaceLanguage', 'contentLanguage']);
            this.interfaceLanguage = result.interfaceLanguage || 'zh';
            this.contentLanguage = result.contentLanguage || 'en';
        } catch (error) {
            console.error('加载语言设置失败:', error);
        }
    }

    async setInterfaceLanguage(lang) {
        this.interfaceLanguage = lang;
        try {
            await chrome.storage.local.set({ interfaceLanguage: lang });
        } catch (error) {
            console.error('保存界面语言设置失败:', error);
        }
    }

    async setContentLanguage(lang) {
        this.contentLanguage = lang;
        try {
            await chrome.storage.local.set({ contentLanguage: lang });
        } catch (error) {
            console.error('保存内容语言设置失败:', error);
        }
    }

    getInterfaceLanguage() {
        return this.interfaceLanguage;
    }

    getContentLanguage() {
        return this.contentLanguage;
    }

    getText(key) {
        return I18N[this.interfaceLanguage]?.[key] || I18N.zh[key] || key;
    }

    updatePageTexts() {
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.getText(key);
            
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'url')) {
                element.placeholder = text;
            } else if (element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });

        // 更新页面标题
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.getText(titleKey);
        }
    }
}

// 全局语言管理器实例
let langManager;

// 初始化语言管理器
document.addEventListener('DOMContentLoaded', async () => {
    langManager = new LanguageManager();
    await langManager.loadLanguages();
    langManager.updatePageTexts();
});

// 导出给其他文件使用
if (typeof window !== 'undefined') {
    window.LanguageManager = LanguageManager;
    window.I18N = I18N;
}