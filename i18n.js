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
        downloadLogo: "下载Logo",
        logoDownloaded: "Logo已下载",
        downloadLogoFailed: "下载Logo失败",
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
        comment: "提交说明",
        commentPlaceholder: "简单说明为什么要推荐这个产品，语气轻松自然",
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
        contentLanguageNote: "选择AI分析和表单填充时使用的语言",
        pleaseEnterApiKey: "请先输入API Key",

        // 侧边栏与截图
        sidepanelModeTip: "💡 侧边栏模式：不会自动关闭，便于操作",
        noScreenshot: "未截图",
        captureScreenshot: "截屏网页",
        uploadScreenshot: "上传截图",
        downloadScreenshot: "下载截图",
        category: "分类",
        categoryPlaceholder: "输入产品分类",

        // 选项页 - API Key步骤与说明
        apiKeyStepsTitle: "获取API Key步骤：",
        visit: "访问",
        googleAIStudio: "Google AI Studio",
        stepLoginGoogle: "登录你的Google账户",
        stepCreateAPIKey: "点击\"Create API Key\"创建新的API密钥",
        stepCopyPasteKey: "复制生成的API Key并粘贴到上面的输入框",
        apiKeySecurityNote: "🔒 你的API Key只会保存在本地浏览器中，不会被上传到任何服务器",

        // 选项页 - 自动填充设置帮助
        autoFillHelp: "关闭后将不会自动识别和填充表单字段",
        logoUploadHelp: "自动将Logo上传到支持的文件上传字段",
        debugModeHelp: "在浏览器控制台显示详细的调试信息",

        // 数据管理与统计
        dataManagement: "💾 数据管理",
        usageStats: "📊 使用统计",
        statAnalyses: "AI分析次数",
        statFills: "表单填充次数",
        statSavedProducts: "保存的产品",
        about: "ℹ️ 关于",
        aboutAppName: "外链信息填充助手",
        aboutDescription: "使用AI自动分析网站信息并一键填充外链表单的Chrome插件",
        help: "使用帮助",
        feedback: "反馈建议",
        checkUpdates: "检查更新",
        resetSettings: "重置所有设置",
        testingConnection: "测试连接中...",
        backToSidepanel: "← 返回侧边栏",

        // 动态消息与提示
        analysisAutoSaved: "AI分析完成并已自动保存！",
        selectImageFile: "请选择图片文件",
        screenshotTaken: "已截取当前页面截图",
        screenshotFailed: "截图失败，请重试",
        productLoaded: "产品信息已加载",
        confirmDeleteProduct: "确定要删除这个产品吗？",
        productDeleted: "产品已删除",
        noSavedProducts: "暂无保存的产品",
        aiAnalyzedProduct: "AI分析产品",
        none: "无",
        unnamedProduct: "未命名产品",
        noWebsite: "无网站",
        noTagline: "无标语",
        use: "使用",
        delete: "删除"
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
        downloadLogo: "Download Logo",
        logoDownloaded: "Logo downloaded",
        downloadLogoFailed: "Failed to download logo",
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
        comment: "Submission Note",
        commentPlaceholder: "Briefly explain why you recommend this product, keep it casual and natural",
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
        contentLanguageNote: "Choose the language for AI analysis and form filling",
        pleaseEnterApiKey: "Please enter API Key first",

        // Sidebar and screenshot
        sidepanelModeTip: "💡 Sidebar mode: stays open for easy operation",
        noScreenshot: "No screenshot",
        captureScreenshot: "Capture Page",
        uploadScreenshot: "Upload Screenshot",
        downloadScreenshot: "Download Screenshot",
        category: "Category",
        categoryPlaceholder: "Enter product category",

        // Options - API Key steps and notes
        apiKeyStepsTitle: "Steps to obtain API Key:",
        visit: "Visit",
        googleAIStudio: "Google AI Studio",
        stepLoginGoogle: "Sign in to your Google account",
        stepCreateAPIKey: "Click \"Create API Key\" to create a new key",
        stepCopyPasteKey: "Copy the generated API Key and paste above",
        apiKeySecurityNote: "🔒 Your API Key is stored locally and never sent to any server",

        // Options - Auto fill helps
        autoFillHelp: "When off, fields will not be auto-detected or filled",
        logoUploadHelp: "Automatically upload the logo to supported file fields",
        debugModeHelp: "Show detailed debug info in the browser console",

        // Data management and stats
        dataManagement: "💾 Data Management",
        usageStats: "📊 Usage Statistics",
        statAnalyses: "AI Analyses",
        statFills: "Form Fills",
        statSavedProducts: "Saved Products",
        about: "ℹ️ About",
        aboutAppName: "Link Extractor Assistant",
        aboutDescription: "A Chrome extension that uses AI to analyze websites and fill forms",
        help: "Help",
        feedback: "Feedback",
        checkUpdates: "Check for updates",
        resetSettings: "Reset all settings",
        testingConnection: "Testing connection...",
        backToSidepanel: "← Back to side panel",

        // Dynamic messages and prompts
        analysisAutoSaved: "AI analysis completed and auto-saved!",
        selectImageFile: "Please select an image file",
        screenshotTaken: "Captured screenshot of current page",
        screenshotFailed: "Screenshot failed, please try again",
        productLoaded: "Product loaded",
        confirmDeleteProduct: "Are you sure you want to delete this product?",
        productDeleted: "Product deleted",
        noSavedProducts: "No saved products",
        aiAnalyzedProduct: "AI Analyzed Product",
        none: "None",
        unnamedProduct: "Untitled product",
        noWebsite: "No website",
        noTagline: "No tagline",
        use: "Use",
        delete: "Delete"
    }
};

// 语言管理器
class LanguageManager {
    constructor() {
        this.interfaceLanguage = 'en'; // 界面语言，默认英文
        this.contentLanguage = 'en';   // 填充内容语言，默认英文
        this.loadLanguages();
    }

    async loadLanguages() {
        try {
            const result = await chrome.storage.local.get(['interfaceLanguage', 'contentLanguage']);
            this.interfaceLanguage = result.interfaceLanguage || 'en';
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

            if (element.tagName === 'INPUT' && (['text', 'url', 'password', 'search', 'email', 'tel'].includes(element.type))) {
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
    // 让其他脚本可以访问到已初始化的语言管理器实例
    if (typeof window !== 'undefined') {
        window.langManager = langManager;
    }
});

// 导出给其他文件使用
if (typeof window !== 'undefined') {
    window.LanguageManager = LanguageManager;
    window.I18N = I18N;
}