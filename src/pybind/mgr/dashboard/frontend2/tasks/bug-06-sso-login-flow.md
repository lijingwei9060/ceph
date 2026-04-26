# Bug 06: SSO 登录流程未实现

**Date**: 2026-04-26
**Status**: Fixed

## Bug 描述

登录页面缺少 SSO 登录流程处理。当配置了 SSO 时，用户应该被自动重定向到 SSO 登录页面，而不是显示普通的用户名/密码登录表单。

## 问题分析

### 旧 Angular 前端实现

旧前端在登录页面加载时调用 `auth/check` API：

1. 如果返回 `login_url` 且不等于 `#/login`：重定向到 SSO 登录 URL
2. 如果返回 `login_url === '#/login'`：显示普通登录表单
3. 如果没有 `login_url` 且有用户信息：用户已认证，导航到首页

### 新 React 前端问题

新前端的登录页面直接显示登录表单，没有实现 SSO 流程：
- 不会检查 SSO 配置
- 不会自动重定向到 SSO 登录 URL
- 不支持 SSO 回调处理（access_token 参数）

## 修复方案

在 `src/features/auth/pages/login.tsx` 中实现完整的 SSO 登录流程：

1. **页面加载时检查认证状态**：
   - 调用 `auth/check` API
   - 检查 URL 中的 `access_token` 参数（SSO 回调）

2. **根据响应处理不同情况**：
   - `login_url` 存在且不等于 `#/login`：重定向到 SSO URL
   - `login_url === '#/login'`：显示普通登录表单
   - 用户已认证：导航到仪表板

3. **添加加载状态**：
   - 检查认证时显示加载中状态
   - 避免闪现登录表单

## 修改的文件

| 文件 | 修改内容 |
|------|----------|
| `src/features/auth/pages/login.tsx` | 添加 SSO 登录流程、auth/check 调用、加载状态 |

## 测试情况

- **ESLint**: 0 errors, 44 warnings
- **TypeScript**: 通过

## 后续建议

1. 添加 SSO 登录按钮选项（如果需要同时支持 SSO 和普通登录）
2. 添加 SSO 登录错误处理和用户提示
3. 考虑添加 SSO 登录状态的 E2E 测试
