class OptionsManager {
    constructor() {
        this.settings = {
            geminiApiKey: '',
            enableAutoFill: true,
            enableLogoUpload: true,
            enableDebugMode: false,
            interfaceLanguage: 'zh',
            contentLanguage: 'en'
        };

        this.stats = {
            totalAnalyses: 0,
            totalFills: 0,
            savedProducts: 0
        };

        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadStats();
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // API Key相关
        document.getElementById('toggleApiKey').addEventListener('click', () => this.toggleApiKeyVisibility());
        document.getElementById('testApiKey').addEventListener('click', () => this.testApiConnection());
        document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKeyWithMessage());
        document.getElementById('apiKey').addEventListener('input', (e) => {
            this.settings.geminiApiKey = e.target.value;
            // 实时保存API Key（无提示）
            this.saveApiKey();
        });

        // 设置选项
        document.getElementById('enableAutoFill').addEventListener('change', (e) => {
            this.settings.enableAutoFill = e.target.checked;
            this.saveSettings();
        });
        document.getElementById('enableLogoUpload').addEventListener('change', (e) => {
            this.settings.enableLogoUpload = e.target.checked;
            this.saveSettings();
        });
        document.getElementById('enableDebugMode').addEventListener('change', (e) => {
            this.settings.enableDebugMode = e.target.checked;
            this.saveSettings();
        });

        // 语言设置
        document.getElementById('interfaceLanguage').addEventListener('change', async (e) => {
            this.settings.interfaceLanguage = e.target.value;
            this.saveSettings();

            // 更新语言管理器并刷新界面
            if (window.langManager) {
                await window.langManager.setInterfaceLanguage(e.target.value);
                window.langManager.updatePageTexts();
            }
        });

        document.getElementById('contentLanguage').addEventListener('change', (e) => {
            this.settings.contentLanguage = e.target.value;
            this.saveSettings();

            // 更新语言管理器
            if (window.langManager) {
                window.langManager.setContentLanguage(e.target.value);
            }
        });

        // 数据管理
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => this.importData());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImportFile(e));
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());

        // 页脚按钮
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());

        // 关于链接
        document.getElementById('helpLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHelp();
        });
        document.getElementById('feedbackLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showFeedback();
        });
        document.getElementById('updateLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.checkUpdates();
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'geminiApiKey',
                'enableAutoFill',
                'enableLogoUpload',
                'enableDebugMode',
                'interfaceLanguage',
                'contentLanguage'
            ]);

            this.settings = {
                geminiApiKey: result.geminiApiKey || '',
                enableAutoFill: result.enableAutoFill !== false,
                enableLogoUpload: result.enableLogoUpload !== false,
                enableDebugMode: result.enableDebugMode || false,
                interfaceLanguage: result.interfaceLanguage || 'zh',
                contentLanguage: result.contentLanguage || 'en'
            };
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async loadStats() {
        try {
            const result = await chrome.storage.local.get([
                'totalAnalyses',
                'totalFills',
                'savedProducts'
            ]);

            // 获取保存的产品数量
            const productsResult = await chrome.storage.local.get(['savedProducts']);
            const savedProducts = productsResult.savedProducts || [];

            this.stats = {
                totalAnalyses: result.totalAnalyses || 0,
                totalFills: result.totalFills || 0,
                savedProducts: savedProducts.length
            };
        } catch (error) {
            console.error('加载统计失败:', error);
        }
    }

    updateUI() {
        // 更新设置UI
        document.getElementById('apiKey').value = this.settings.geminiApiKey;
        document.getElementById('enableAutoFill').checked = this.settings.enableAutoFill;
        document.getElementById('enableLogoUpload').checked = this.settings.enableLogoUpload;
        document.getElementById('enableDebugMode').checked = this.settings.enableDebugMode;
        document.getElementById('interfaceLanguage').value = this.settings.interfaceLanguage;
        document.getElementById('contentLanguage').value = this.settings.contentLanguage;

        // 更新统计UI
        document.getElementById('totalAnalyses').textContent = this.stats.totalAnalyses;
        document.getElementById('totalFills').textContent = this.stats.totalFills;
        document.getElementById('savedProducts').textContent = this.stats.savedProducts;
    }

    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('apiKey');
        const toggleBtn = document.getElementById('toggleApiKey');

        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            apiKeyInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    }

    async testApiConnection() {
        const apiKey = this.settings.geminiApiKey.trim();

        if (!apiKey) {
            this.showApiStatus('请先输入API Key', 'error');
            return;
        }

        this.showLoading(true, '测试API连接中...');

        try {
            const gemini = new GeminiAPI(apiKey);
            const isConnected = await gemini.testConnection();

            if (isConnected) {
                this.showApiStatus('✅ API连接成功！可以正常使用AI分析功能', 'success');
            } else {
                this.showApiStatus('❌ API响应异常，请检查API Key是否正确', 'error');
            }

        } catch (error) {
            console.error('API测试失败:', error);

            if (error.message.includes('400')) {
                this.showApiStatus('❌ API Key无效或请求格式错误', 'error');
            } else if (error.message.includes('403')) {
                this.showApiStatus('❌ API Key权限不足或已被限制', 'error');
            } else if (error.message.includes('网络')) {
                this.showApiStatus('❌ 网络连接错误，请检查网络设置', 'error');
            } else {
                this.showApiStatus(`❌ API连接失败: ${error.message}`, 'error');
            }
        } finally {
            this.showLoading(false);
        }
    }

    async saveApiKey() {
        try {
            await chrome.storage.local.set({
                geminiApiKey: this.settings.geminiApiKey
            });
        } catch (error) {
            console.error('保存API Key失败:', error);
        }
    }

    async saveApiKeyWithMessage() {
        const apiKey = this.settings.geminiApiKey.trim();

        if (!apiKey) {
            this.showMessage('请先输入API Key', 'error');
            return;
        }

        try {
            await chrome.storage.local.set({
                geminiApiKey: this.settings.geminiApiKey
            });
            this.showMessage('✅ API Key保存成功！', 'success');
        } catch (error) {
            console.error('保存API Key失败:', error);
            this.showMessage('保存失败，请重试', 'error');
        }
    }

    showApiStatus(message, type) {
        const statusEl = document.getElementById('apiStatus');
        statusEl.textContent = message;
        statusEl.className = `api-status ${type}`;
        statusEl.classList.remove('hidden');

        // 5秒后自动隐藏
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 5000);
    }

    async exportData() {
        try {
            const result = await chrome.storage.local.get(['savedProducts']);
            const savedProducts = result.savedProducts || [];

            if (savedProducts.length === 0) {
                this.showMessage('没有数据可导出', 'info');
                return;
            }

            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                products: savedProducts
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `link-extractor-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showMessage('数据导出成功！', 'success');
        } catch (error) {
            console.error('导出数据失败:', error);
            this.showMessage('导出数据失败，请重试', 'error');
        }
    }

    importData() {
        document.getElementById('importFile').click();
    }

    async handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            // 验证数据格式
            if (!importData.products || !Array.isArray(importData.products)) {
                throw new Error('无效的数据格式');
            }

            // 确认导入
            const confirmMessage = `将导入 ${importData.products.length} 个产品数据。\n\n是否继续？这将覆盖现有数据。`;
            if (!confirm(confirmMessage)) return;

            // 保存导入的数据
            await chrome.storage.local.set({ savedProducts: importData.products });

            // 更新统计
            await this.loadStats();
            this.updateUI();

            this.showMessage(`成功导入 ${importData.products.length} 个产品！`, 'success');

        } catch (error) {
            console.error('导入数据失败:', error);
            this.showMessage('导入失败，请检查文件格式是否正确', 'error');
        }

        // 清空文件输入
        event.target.value = '';
    }

    async clearAllData() {
        const confirmMessage = '⚠️ 确定要清除所有数据吗？\n\n这将删除：\n• 所有保存的产品信息\n• 使用统计数据\n\n此操作不可恢复！';

        if (!confirm(confirmMessage)) return;

        try {
            await chrome.storage.local.clear();

            // 重新设置默认值
            this.settings = {
                geminiApiKey: '',
                enableAutoFill: true,
                enableLogoUpload: true,
                enableDebugMode: false
            };

            this.stats = {
                totalAnalyses: 0,
                totalFills: 0,
                savedProducts: 0
            };

            this.updateUI();
            this.showMessage('所有数据已清除！', 'success');

        } catch (error) {
            console.error('清除数据失败:', error);
            this.showMessage('清除数据失败，请重试', 'error');
        }
    }

    async resetSettings() {
        if (!confirm('确定要重置所有设置到默认值吗？')) return;

        this.settings = {
            geminiApiKey: '',
            enableAutoFill: true,
            enableLogoUpload: true,
            enableDebugMode: false
        };

        this.updateUI();
        this.showMessage('设置已重置为默认值', 'success');
    }

    async saveSettings(showMessage = false) {
        try {
            await chrome.storage.local.set({
                geminiApiKey: this.settings.geminiApiKey,
                enableAutoFill: this.settings.enableAutoFill,
                enableLogoUpload: this.settings.enableLogoUpload,
                enableDebugMode: this.settings.enableDebugMode,
                interfaceLanguage: this.settings.interfaceLanguage,
                contentLanguage: this.settings.contentLanguage
            });

            if (showMessage) {
                this.showMessage('设置保存成功！', 'success');
            }
        } catch (error) {
            console.error('保存设置失败:', error);
            if (showMessage) {
                this.showMessage('保存设置失败，请重试', 'error');
            }
        }
    }

    showHelp() {
        const helpText = `
外链信息填充助手使用帮助：

1. 配置API Key：
   - 获取Gemini API Key并填入设置页面
   - 点击"测试API连接"确认配置正确

2. 使用AI分析：
   - 在popup中选择"AI分析"模式
   - 输入目标网站URL
   - 点击"分析"按钮等待AI提取信息

3. 手动输入：
   - 选择"手动输入"模式
   - 填写产品名称、标语、描述
   - 上传或让AI提取Logo

4. 保存和使用：
   - 点击"保存信息"将数据存储到本地
   - 在外链网站页面点击"一键填充"自动填写表单

5. 管理数据：
   - 查看已保存的产品列表
   - 导出/导入数据进行备份和迁移
        `;

        alert(helpText);
    }

    showFeedback() {
        const feedbackText = `
感谢使用外链信息填充助手！

如果您遇到问题或有改进建议，请：

1. 通过Chrome扩展商店留言反馈
2. 联系开发者邮箱（如有提供）
3. 在GitHub仓库提交Issue（如有开源）

您的反馈有助于我们改进产品！
        `;

        alert(feedbackText);
    }

    async checkUpdates() {
        this.showMessage('当前版本：v1.0.0\n暂未检测到新版本', 'info');
    }

    showMessage(text, type = 'success') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 4000);
    }

    showLoading(show, text = '处理中...') {
        const loadingEl = document.getElementById('loading');
        if (show) {
            loadingEl.querySelector('p').textContent = text;
            loadingEl.classList.remove('hidden');
        } else {
            loadingEl.classList.add('hidden');
        }
    }
}

// 初始化选项管理器
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
    try {
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from');
        const backBtn = document.getElementById('backToSidepanel');
        if (from === 'sidepanel' && backBtn) {
            backBtn.style.display = 'inline-block';
            backBtn.addEventListener('click', () => {
                const sidepanelUrl = chrome.runtime.getURL('sidepanel.html');
                window.location.href = sidepanelUrl;
            });
        }
    } catch (e) {
        console.error('处理返回侧边栏按钮失败:', e);
    }
});