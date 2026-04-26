# Bug 05: 批量修复未使用导入和变量

**Date**: 2026-04-26
**Status**: Fixed

## Bug 描述

ESLint 报告多个文件中存在未使用的导入和变量，共计 40+ 个错误。

## 修复文件列表

### 监控模块
| 文件 | 移除内容 |
|------|----------|
| `monitoring/alerts/pages/active-alerts.tsx` | `Plus` 图标 |
| `monitoring/alerts/pages/rules-list.tsx` | `RuleDetails` 组件 |
| `monitoring/grafana/pages/grafana-dashboard.tsx` | `CardHeader`, `CardTitle` |
| `monitoring/silences/components/silence-form.tsx` | `useSilence`, `Badge` |
| `monitoring/pages/monitoring-page.tsx` | `useTranslation`, `t` |

### RGW 模块
| 文件 | 移除内容 |
|------|----------|
| `rgw/bucket/components/rgw-bucket-detail.tsx` | `RgwBucketDetail` 类型 |
| `rgw/bucket/pages/bucket-list.tsx` | `useTranslation`, `t`, `Eye` 图标 |
| `rgw/daemon/pages/daemon-list.tsx` | `useTranslation`, `t` |
| `rgw/user/pages/user-list.tsx` | `useTranslation`, `t` |
| `rgw/user/components/rgw-user-form.tsx` | `Plus`, `Trash2` 图标, `CAPABILITY_TYPES` |
| `rgw/user/api/use-rgw-user.ts` | `idsLoading` 变量 |

### 其他模块
| 文件 | 移除内容 |
|------|----------|
| `dashboard/pages/overview.tsx` | `t`, `capacityAvail` |
| `filesystem/pages/cephfs-list.tsx` | `useTranslation`, `t` |
| `filesystem/components/cephfs-directory-tree.tsx` | `RefreshCw`, `Button` |
| `cluster/pools/pages/pool-list.tsx` | `useTranslation`, `t`, `Eye` |
| `settings/pages/settings-list.tsx` | Select 相关组件导入 |
| `user-management/roles/components/role-form.tsx` | `PermissionScope` 类型, Select 组件 |
| `user-management/roles/pages/role-list.tsx` | `useTranslation`, `t`, `cloneMutation`, `Input` |
| `user-management/users/pages/user-list.tsx` | `useTranslation`, `t` |
| `routes/index.tsx` | `PageWrapper` |

### 测试文件
| 文件 | 移除内容 |
|------|----------|
| `lib/auth.test.ts` | `defaultHeaders` 变量 |

## 解决的问题

1. 消除 40+ 个 ESLint 错误
2. 清理所有未使用的导入和变量
3. 减少打包体积
4. 提高代码质量

## 测试情况

- **ESLint**: 0 errors, 44 warnings (仅剩 React Compiler 和 Fast Refresh 相关警告)
- **TypeScript**: 通过
- **单元测试**: 223 passed (34 files)

## 其他问题

### 剩余 Warnings
1. **React Fast Refresh 警告**: shadcn/ui 组件导出常量/函数时触发，不影响功能
2. **React Compiler 兼容性警告**: React Hook Form 的 `watch()` 与 React Compiler 不完全兼容

### 建议
- 多数页面移除了 `useTranslation`，未来如需支持 i18n 需要重新添加
- 部分组件缺少单元测试，建议后续添加
- React Hook Form 相关警告可以通过重构代码或使用 `eslint-disable` 解决
