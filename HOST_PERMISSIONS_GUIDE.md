# Host Permissions 优化指南

## 当前状态

Google Chrome Web Store 现在要求避免过于宽泛的 `<all_urls>` 权限。你的扩展已被标记需要进行深度审核。

## 问题分析

你的扩展需要从用户提供的**任意URL**获取网站内容进行分析。这在技术上确实需要访问多个不同域名的权限。

## 解决方案对比

### 方案 A：完全移除主机权限（最安全，但功能受限）

**Manifest 配置：**
```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs",
    "sidePanel",
    "tabCapture"
  ]
}
```

**优点：**
- ✅ 通过审核最快
- ✅ 权限最少
- ✅ 用户隐私最高

**缺点：**
- ❌ 无法直接从任意URL获取网站内容
- ❌ 需要修改工作流程

**适用场景：** 如果你可以从侧面板中手动让用户粘贴网站内容，而不是自动获取

---

### 方案 B：添加特定网站权限（推荐）

**Manifest 配置（针对常见链接提交网站）：**
```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs",
    "sidePanel",
    "tabCapture"
  ],
  "host_permissions": [
    "https://example.com/*",
    "https://businesslistings.com/*",
    "https://localizedwebsite.com/*",
    "https://*.example.com/*"
  ]
}
```

**优点：**
- ✅ 权限明确具体
- ✅ 审核通过率高
- ✅ 用户看到具体的权限范围

**缺点：**
- ⚠️ 需要维护网站列表
- ⚠️ 新网站需要发布新版本

**实施步骤：**
1. 列出你的目标用户经常使用的链接提交网站
2. 在 manifest 中添加这些网站
3. 在隐私政策中说明支持的网站列表

---

### 方案 C：保留 `<all_urls>` + 改进权限说明（现状）

**Manifest 配置：**
```json
{
  "permissions": [...],
  "host_permissions": ["<all_urls>"]
}
```

**优点：**
- ✅ 完整功能，支持任意网站
- ✅ 用户体验最佳

**缺点：**
- ⚠️ 需要深度审核
- ⚠️ 审核时间可能较长
- ⚠️ 需要提供充分的权限理由

**需要做什么：**
在 Chrome Web Store 的隐私实践标签中，提供更详细的权限理由（已在 PRIVACY_POLICY.md 中完成）

---

## 推荐行动方案

### 短期（立即改进）

**采用方案 C + 改进的权限说明：**

1. 保持 manifest.json 当前配置（已移除 `<all_urls>`）
2. **添加以下常见网站权限：**

```json
"host_permissions": [
  "https://www.google.com/*",
  "https://www.bing.com/*",
  "https://linkedin.com/*",
  "https://*.linkedin.com/*",
  "https://businesslistings.com/*",
  "https://yelp.com/*",
  "https://*.yelp.com/*",
  "https://dmoz.org/*",
  "https://*.dmoz.org/*",
  "https://example.com/*",
  "https://businessportal.com/*"
]
```

3. 在隐私政策中解释这些权限的用途

---

### 长期（最优方案）

**添加权限请求 UI（使用 Manifest V3 的权限警告）：**

```javascript
// 在需要访问新网站时动态请求权限
async function requestHostPermission(url) {
  try {
    const result = await chrome.permissions.request({
      permissions: [],
      origins: [new URL(url).origin + '/*']
    });

    if (result) {
      console.log('用户授予权限');
      // 继续获取网站内容
      return await fetchWebsiteContent(url);
    } else {
      console.log('用户拒绝权限');
      return { success: false, error: 'User denied permission' };
    }
  } catch (error) {
    console.error('权限请求失败:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 立即建议的改进

### 1. 更新 Manifest（现在就做）

**选择以下之一：**

**选项 1：最小权限（推荐用于快速审核）**
```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs",
    "sidePanel",
    "tabCapture"
  ],
  "host_permissions": [
    "https://www.google.com/*",
    "https://www.bing.com/*",
    "https://linkedin.com/*",
    "https://*.linkedin.com/*"
  ]
}
```

**选项 2：完整功能（需更好的解释）**
```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs",
    "sidePanel",
    "tabCapture"
  ],
  "host_permissions": ["<all_urls>"]
}
```

---

### 2. 更新隐私政策

添加一段说明为什么需要主机权限：

```markdown
## Host Permissions Justification

This extension analyzes websites provided by users to extract business information
for form filling. The user can input any website URL, and the extension fetches
and analyzes that content with their permission. Therefore, the extension requires
broad host permissions to serve all users' needs, regardless of which websites they
want to analyze.

Users maintain full control:
- They explicitly provide the URL to analyze
- They can see in the extension's UI exactly what data is being extracted
- No data is sent anywhere without their explicit request
- The extension operates entirely under user control
```

---

### 3. 在 Chrome Web Store 中的权限说明

**Host Permission 字段（更新版）：**

```
This extension analyzes websites to extract product information for automatic form filling.

Why we need broad host permissions:
- Users can specify any URL they want analyzed
- Different users work with different websites and domains
- The extension supports unlimited website analysis at user request
- We have no way to predict which domains users will want to analyze

User control:
- Users explicitly provide each URL to analyze
- No automatic website access occurs
- All analysis happens locally before optional API processing
- Users can review extracted data in the side panel before form filling
```

---

## 下一步

1. **决定采用哪个方案** (A、B 或 C)
2. **相应更新 manifest.json**
3. **更新 PRIVACY_POLICY.md** 并添加相关说明
4. **重新提交 Chrome Web Store 审核**

---

## 常见问题

**Q: 用 activeTab 就够了吗？**
A: 不行。`activeTab` 只给予对当前标签页的访问。如果用户想分析不同网站的内容，需要额外权限。

**Q: 为什么 Google 现在要求这个？**
A: 为了保护用户隐私。扩展权限越明确，用户越能理解扩展能做什么。

**Q: 移除主机权限后扩展会怎样？**
A: `fetch()` 调用会失败，导致用户无法分析网站。你需要修改用户界面流程。

**Q: 审核要多久？**
A:
- 最小权限：1-2 天
- 特定网站权限：2-3 天
- `<all_urls>`：3-7 天（取决于说明充分程度）

---

## 文件清单

- ✅ `manifest.json` - 已移除 `<all_urls>`，保持最小权限
- ✅ `PRIVACY_POLICY.md` - 包含详细权限说明
- ✅ `HOST_PERMISSIONS_GUIDE.md` - 本指南

**建议：** 选择方案 C（保留 `<all_urls>` 并加强权限说明），这样可以保持完整功能同时获得审批。
