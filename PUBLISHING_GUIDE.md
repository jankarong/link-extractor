# Chrome Web Store 发布指南 - Backlink Form Filler

## 解决"unable to publish"错误

你收到的错误提示要求提供两个权限的使用说明：
1. Host permission (`<all_urls>`)
2. Tab Capture (`tabCapture`)

## Chrome Web Store 发布步骤

### 1. 登录开发者控制面板
- 访问: https://chrome.google.com/webstore/developer/dashboard
- 使用你的 Google 账户登录

### 2. 选择你的扩展程序
- 找到 "Backlink Form Filler" 扩展
- 点击进入编辑页面

### 3. 导航到"项目详情" → "隐私权做法"

### 4. 添加权限说明

#### 4.1 Host Permission (`<all_urls>`) 说明
在相应字段中填入以下内容（或类似的英文版本）：

```
This extension requires access to all websites to:
- Automatically detect and fill link submission forms on any website you visit
- Fetch website content when you request AI analysis
- Extract product information and logos from web pages
- Enable the auto-fill functionality across the internet

This permission only allows the extension to function when you actively use the form-filling features.
It does not automatically access any sites without your explicit action.
```

#### 4.2 Tab Capture Permission (`tabCapture`) 说明
在相应字段中填入以下内容（或类似的英文版本）：

```
This extension uses the Tab Capture permission to:
- Capture website content for AI-powered analysis at your request
- Extract product information (name, tagline, description, features, logos) from the pages you provide
- Process the captured content locally and optionally send it to Google Gemini API for intelligent analysis

Captured content is used only for the form-filling purpose and is not stored or used for any other purpose.
```

### 5. 其他必填项检查清单

- [ ] 扩展名称：Backlink Form Filler
- [ ] 扩展描述：Chrome extension that uses AI to analyze websites and auto-fill link submission forms
- [ ] 分类：Productivity 或 Tools
- [ ] 隐私政策链接：指向你的隐私政策页面
- [ ] 截图（1280×800 或 640×400）：至少 1 张，最多 5 张
- [ ] 图标（128×128）：已提供在 icons/icon128.png
- [ ] 权限说明：已填入上述内容
- [ ] 支持电子邮件：aiinlinktutorial@gmail.com

### 6. 更新隐私政策链接

在 Chrome Web Store 项目详情中，确保你的隐私政策指向有效位置。
可选：将 PRIVACY_POLICY.md 上传到网站或使用 GitHub Raw 链接。

示例 GitHub Raw 链接：
```
https://raw.githubusercontent.com/[你的用户名]/link-extractor/main/PRIVACY_POLICY.md
```

### 7. 保存并提交审核

- 点击"保存草稿"以保存所有更改
- 点击"提交审核"以提交发布
- 等待 Google 的审核（通常需要 1-3 天）

## 常见问题

### Q: 为什么需要这些权限说明？
A: Google Chrome Web Store 要求所有声明权限的扩展必须清楚地说明它们为什么需要这些权限，以保护用户隐私和安全。

### Q: 权限说明语言有什么要求？
A: 根据你的扩展的目标地区用英文或相应语言撰写。建议使用英文以获得更好的国际审核结果。

### Q: 隐私政策需要在线吗？
A: 是的，隐私政策需要在线可访问。你可以：
- 在自己的网站上托管
- 使用 GitHub Pages
- 使用 GitHub Raw 链接（https://raw.githubusercontent.com/...）

### Q: 如果审核被拒绝怎么办？
A:
1. 查看 Google 的反馈信息
2. 根据反馈修改权限说明或隐私政策
3. 修改 manifest.json 或代码
4. 重新提交审核

## 已更新文件

- ✅ `PRIVACY_POLICY.md` - 已添加权限说明部分
- ✅ `manifest.json` - 确认权限配置正确
- ✅ 本指南 - `PUBLISHING_GUIDE.md`

## 后续步骤

1. 按照上述步骤在 Chrome Web Store 中添加权限说明
2. 确保所有必填项都已完成
3. 提交审核
4. 等待 Google 的反馈
5. 根据需要进行调整

祝你发布成功！
