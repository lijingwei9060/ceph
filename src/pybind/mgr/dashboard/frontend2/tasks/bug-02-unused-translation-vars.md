# Bug 02: Mirroring/NFS 页面未使用变量

**Date**: 2026-04-26
**Status**: Fixed

## Bug 描述

ESLint 报告多个页面中存在未使用的 `t` 变量（来自 `useTranslation`）：

```
src/features/block/mirroring/pages/mirroring-overview.tsx
  29:11  error  't' is assigned a value but never used  @typescript-eslint/no-unused-vars

src/features/block/nfs/pages/nfs-list.tsx
  29:11  error  't' is assigned a value but never used  @typescript-eslint/no-unused-vars
```

## 修复内容

### 修改文件
- `src/features/block/mirroring/pages/mirroring-overview.tsx`
- `src/features/block/nfs/pages/nfs-list.tsx`

### 具体修改

#### mirroring-overview.tsx
1. 移除 `useTranslation` 导入
2. 移除 `const { t } = useTranslation();` 声明

#### nfs-list.tsx
1. 移除 `useTranslation` 导入
2. 移除 `const { t } = useTranslation();` 声明

### 代码变更

**mirroring-overview.tsx:**
```diff
-import { Button } from '@/components/ui/button';
-import { useTranslation } from 'react-i18next';
+import { Button } from '@/components/ui/button';

 export function MirroringOverviewPage() {
-  const { t } = useTranslation();
   const { data: summary, isLoading, refetch } = useMirroringSummary();
```

**nfs-list.tsx:**
```diff
-import { useState } from 'react';
-import { useTranslation } from 'react-i18next';
+import { useState } from 'react';
...
 export function NfsListPage() {
-  const { t } = useTranslation();
   const { data: status } = useNfsStatus();
```

## 影响页面

- Mirroring 页面 (`/block/mirroring`)
- NFS 页面 (`/nfs`)

## 解决的问题

1. 消除 ESLint 错误
2. 清理无用代码
3. 减少不必要的 hook 调用

## 测试情况

- **ESLint**: 通过，无错误
- **TypeScript**: 通过
- **单元测试**: 未涉及（页面无单元测试）

## 其他问题

- 这两个页面文本硬编码为英文，未来如需支持 i18n 需要重新添加 `useTranslation` 并使用 `t()` 函数
- 建议后续添加单元测试
