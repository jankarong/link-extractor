// 侧边栏模式JavaScript - 基于popup.js但添加了侧边栏特定功能
class SidebarLinkExtractor extends LinkExtractorPopup {
    constructor() {
        super();
        this.addSidebarFeatures();
    }

    addSidebarFeatures() {
        // 页面标题中显示模式
        document.title = '外链信息填充助手 - 侧边栏模式';
        
        // 侧边栏特定的初始化
        this.optimizeForSidebar();
    }

    optimizeForSidebar() {
        // 优化侧边栏显示
        this.adjustLayoutForSidebar();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.adjustLayoutForSidebar());
    }

    adjustLayoutForSidebar() {
        // 根据侧边栏宽度调整布局
        const container = document.querySelector('.container');
        if (container) {
            const width = window.innerWidth;
            
            // 如果宽度太窄，进一步压缩界面
            if (width < 300) {
                container.classList.add('narrow-sidebar');
            } else {
                container.classList.remove('narrow-sidebar');
            }
        }
    }

    // 覆盖显示消息方法，适配侧边栏模式
    showMessage(text, type = 'success') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');
        
        // 侧边栏模式中消息显示时间稍短一些，避免占用太多空间
        let duration = 2500; // 默认2.5秒
        if (type === 'error') {
            duration = Math.max(4000, text.length * 40); // 错误消息至少4秒
        }
        
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, duration);
    }

    // 覆盖填充表单方法，添加侧边栏模式的反馈
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
            
            this.showMessage('表单填充完成！', 'success');
            
            // 侧边栏模式下不需要切换标签页，用户已经可以看到目标页面
            
        } catch (error) {
            console.error('填充表单失败:', error);
            this.showMessage('填充表单失败，请确保目标页面已加载且支持自动填充', 'error');
        }
    }

    // 覆盖打开设置方法
    openSettings() {
        // 在侧边栏中可以直接打开设置页面
        chrome.runtime.openOptionsPage();
    }

    // 添加侧边栏专用方法
    minimizeSidebar() {
        // 如果需要的话，可以添加最小化侧边栏的功能
        try {
            chrome.sidePanel.close();
        } catch (error) {
            console.log('无法关闭侧边栏:', error);
        }
    }
}

// 等待DOM加载完成后初始化（仅在侧边栏页面中运行）
document.addEventListener('DOMContentLoaded', () => {
    // 确保只在侧边栏页面初始化
    if (document.title.includes('侧边栏模式') || window.location.href.includes('sidebar.html')) {
        new SidebarLinkExtractor();
        
        // 添加页面加载完成的提示
        setTimeout(() => {
            const messageEl = document.querySelector('.mode-info');
            if (messageEl && !document.querySelector('.sidebar-tip')) {
                const sidebarTip = document.createElement('p');
                sidebarTip.className = 'sidebar-tip';
                sidebarTip.style.fontSize = '11px';
                sidebarTip.style.marginTop = '4px';
                sidebarTip.style.opacity = '0.8';
                sidebarTip.innerHTML = '💡 侧边栏会保持打开状态，方便随时使用';
                messageEl.appendChild(sidebarTip);
            }
        }, 1000);
    }
});