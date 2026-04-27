# i18n 多语言支持恢复与完善

**Date**: 2026-04-26
**Status**: Completed

## 背景

在 bug-05 修复过程中，错误地移除了多个页面中的 `useTranslation` 导入，导致多语言支持功能受损。本次任务恢复了多语言支持并进行了完善。

## 完成的工作

### 1. 翻译文件完善

#### 简体中文 (zh-CN.json)
- 添加了 `"language": "语言"` 键
- 添加了 `"dashboard.title": "仪表盘"` 键
- 所有翻译文件已完整

#### 繁体中文 (zh-TW.json)
- 创建了完整的繁体中文翻译文件
- 基于 zh-CN.json 转换为繁体字
- 涵盖所有模块的翻译键

### 2. 语言切换组件

创建了 `src/components/language-switcher.tsx`:
- 下拉菜单显示所有支持的语言
- 点击即可切换语言
- 语言选择会保存到 cookie (`cd-lang`)
- 当前语言显示为选中状态

### 3. WorkbenchLayout 集成

在 `src/components/layouts/workbench-layout.tsx` 的头部添加了语言切换器:
- 位于通知铃铛和用户信息之间
- 响应式设计：在小屏幕上只显示图标

### 4. 恢复 useTranslation hooks

以下页面已恢复并使用 useTranslation:

| 模块 | 文件 | 翻译内容 |
|------|------|----------|
| Monitoring | `monitoring/pages/monitoring-page.tsx` | 标题、标签、状态 |
| RGW Bucket | `rgw/bucket/pages/bucket-list.tsx` | 标题、按钮、对话框 |
| RGW Daemon | `rgw/daemon/pages/daemon-list.tsx` | 标题、列名、按钮 |
| RGW User | `rgw/user/pages/user-list.tsx` | 标题、列名、按钮、对话框 |
| CephFS | `filesystem/pages/cephfs-list.tsx` | 标题、列名、按钮 |
| Pools | `cluster/pools/pages/pool-list.tsx` | 标题、列名、按钮、筛选 |
| Roles | `user-management/roles/pages/role-list.tsx` | 标题、列名、按钮、对话框 |
| Users | `user-management/users/pages/user-list.tsx` | 标题、列名、按钮、对话框 |

## 支持的语言

| 代码 | 名称 |
|------|------|
| en-US | English |
| zh-CN | 简体中文 |
| zh-TW | 繁體中文 |
| de | Deutsch |
| es | Español |
| fr | Français |
| it | Italiano |
| ja | 日本語 |
| ko | 한국어 |
| pl | Polski |
| pt-BR | Português (Brasil) |
| ru | Русский |
| tr | Türkçe |

## 技术细节

- 使用 `react-i18next` 进行国际化
- 使用 `i18next-browser-languagedetector` 自动检测用户语言
- 语言偏好存储在 cookie 中，持久化保存
- 翻译键采用嵌套结构，便于管理

## 测试情况

- **ESLint**: 0 errors, 44 warnings (与之前相同)
- **TypeScript**: 通过
- **单元测试**: 223 passed (34 files)

## 后续建议

1. 为剩余页面添加更完整的翻译覆盖
2. 考虑添加翻译键的 TypeScript 类型检查
3. 可以考虑使用翻译管理工具（如 Locize）来管理翻译
