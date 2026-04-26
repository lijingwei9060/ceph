# Bug 06: SSO 登录流程和自定义 Banner 显示问题

**Date**: 2026-04-26
**Status**: Fixed

## Bug 描述

1. 登录页面缺少 SSO 登录流程处理。当配置了 SSO 时，用户应该被自动重定向到 SSO 登录页面。
2. 登录页面显示 "null" 文字，当 `custom_login_banner` 未配置时。

## 问题分析

### 问题 1: SSO 登录流程

旧前端在登录页面加载时调用 `auth/check` API：
- 如果返回 `login_url` 且不等于 `#/login`：重定向到 SSO 登录 URL
- 如果返回 `login_url === '#/login'`：显示普通登录表单

### 问题 2: Custom Banner 显示 null

后端 `/ui-api/login/custom_banner` 端点在没有设置 `custom_login_banner` 时返回 `null`（Python None）。

前端使用 `.text()` 方法获取响应：
```javascript
uiApiClient.get('login/custom_banner').text().then(setBanner)
```

当 API 返回 JSON `null` 时，`.text()` 返回字符串 `"null"`，导致页面上显示 "null"。

## 修复方案

### 问题 1: SSO 登录流程

在 `src/features/auth/pages/login.tsx` 中实现完整的 SSO 登录流程：
- 页面加载时调用 `auth/check` API
- 根据 `login_url` 响应决定重定向或显示登录表单
- 支持 SSO 回调处理（URL 中的 `access_token` 参数）

### 问题 2: Banner 过滤

过滤 `.text()` 返回的 `"null"` 字符串：
```javascript
uiApiClient.get('login/custom_banner').text().then((text) => {
  if (text && text !== 'null') {
    setBanner(text);
  }
})
```

## 修改的文件

| 文件 | 修改内容 |
|------|----------|
| `src/features/auth/pages/login.tsx` | SSO 流程、banner 过滤、加载状态 |
| `src/routes/auth-guard.test.tsx` | 测试更新适配新的登录页面行为 |

## 测试情况

- **ESLint**: 0 errors, 44 warnings
- **TypeScript**: 通过
- **单元测试**: 223 passed (34 files)

## 后续建议

1. 考虑使用 `.json()` 方法获取 banner，处理 null 更优雅
2. 添加 SSO 登录按钮选项（如果需要同时支持 SSO 和普通登录）
