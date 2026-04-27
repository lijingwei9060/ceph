# Bug 01: iSCSI 页面未使用变量

**Date**: 2026-04-26
**Status**: Fixed

## Bug 描述

ESLint 报告 `src/features/block/iscsi/pages/iscsi-overview.tsx` 中存在未使用的变量：
- `t` 从 `useTranslation()` 解构但未使用
- `overview` 从 `useIscsiOverview()` 解构但未使用

```
src/features/block/iscsi/pages/iscsi-overview.tsx
  26:11  error  't' is assigned a value but never used         @typescript-eslint/no-unused-vars
  28:17  error  'overview' is assigned a value but never used  @typescript-eslint/no-unused-vars
```

## 修复内容

### 修改文件
- `src/features/block/iscsi/pages/iscsi-overview.tsx`

### 具体修改
1. 移除未使用的 `useTranslation` 导入
2. 移除未使用的 `useIscsiOverview` 导入
3. 移除 `const { t } = useTranslation();` 声明
4. 移除 `const { data: overview } = useIscsiOverview();` 声明

### 代码变更

```diff
-import { useIscsiStatus, useIscsiOverview, useIscsiTargets, useDeleteIscsiTarget } from '../api/use-iscsi';
+import { useIscsiStatus, useIscsiTargets, useDeleteIscsiTarget } from '../api/use-iscsi';
...
-import { toast } from 'sonner';
-import { useTranslation } from 'react-i18next';
+import { toast } from 'sonner';

 export function IscsiOverviewPage() {
-  const { t } = useTranslation();
   const { data: status } = useIscsiStatus();
-  const { data: overview } = useIscsiOverview();
   const { data: targets = [], isLoading: targetsLoading, refetch } = useIscsiTargets();
```

## 影响页面

- iSCSI Gateways 页面 (`/block/iscsi`)

## 解决的问题

1. 消除 ESLint 错误
2. 减少不必要的 API 调用（`useIscsiOverview`）
3. 清理无用代码

## 测试情况

- **ESLint**: 通过，无错误
- **TypeScript**: 通过
- **单元测试**: 未涉及（页面无单元测试）

## 其他问题

- 页面文本目前硬编码为英文，未来如需支持 i18n 需要重新添加 `useTranslation` 并使用 `t()` 函数
- 该页面缺少单元测试，建议后续添加
