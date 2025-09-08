// 全屏模式JavaScript - 基于popup.js但添加了全屏特定功能
class FullscreenLinkExtractor extends LinkExtractorPopup {
    constructor() {
        super();
        this.addFullscreenFeatures();
    }

    addFullscreenFeatures() {
        // 绑定返回按钮
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        
        // 添加键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // 页面标题中显示模式
        document.title = '外链信息填充助手 - 全屏模式';
    }

    goBack() {
        // 尝试回到原来的标签页
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // 如果没有历史记录，关闭当前标签页
            window.close();
        }
    }

    handleKeyboard(e) {
        // Ctrl/Cmd + Enter: 快速填充
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const fillBtn = document.getElementById('fillBtn');
            if (!fillBtn.disabled) {
                this.fillForm();
            }
        }
        
        // Ctrl/Cmd + S: 快速保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveProduct();
        }
        
        // Esc: 清空表单
        if (e.key === 'Escape') {
            this.clearForm();
        }
    }

    clearForm() {
        if (confirm('确定要清空当前表单吗？')) {
            this.currentProduct = {
                productName: '',
                website: '',
                tagline: '',
                description: '',
                features: '',
                logo: null
            };
            this.updateUI();
            this.showMessage('表单已清空', 'success');
        }
    }

    // 覆盖显示消息方法，适配全屏模式
    showMessage(text, type = 'success') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');
        
        // 全屏模式中显示时间稍长一些
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 4000);
    }

    // 覆盖填充表单方法，添加全屏模式的反馈
    async fillForm() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // 检查是否在插件页面上尝试填充
            if (tab.url.includes('chrome-extension://')) {
                this.showMessage('请先切换到要填充表单的网站页面', 'error');
                return;
            }
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'fillForm',
                data: this.currentProduct
            });
            
            this.showMessage('表单填充完成！请检查目标网站', 'success');
            
            // 可选：自动切换到目标标签页
            chrome.tabs.update(tab.id, { active: true });
            
        } catch (error) {
            console.error('填充表单失败:', error);
            this.showMessage('填充表单失败，请确保目标页面已加载且支持自动填充', 'error');
        }
    }
}

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new FullscreenLinkExtractor();
    
    // 添加页面加载完成的提示
    setTimeout(() => {
        const messageEl = document.querySelector('.mode-info');
        if (messageEl) {
            const shortcutTip = document.createElement('p');
            shortcutTip.className = 'tip';
            shortcutTip.innerHTML = '⌨️ 快捷键：Ctrl+Enter 填充表单，Ctrl+S 保存，Esc 清空表单';
            messageEl.appendChild(shortcutTip);
        }
    }, 1000);
});