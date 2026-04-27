# Bug 03: Inventory 页面未使用导入

**Date**: 2026-04-26
**Status**: Fixed

## Bug 描述

ESLint 报告 `src/features/cluster/inventory/pages/inventory-list.tsx` 中存在多个未使用的导入和变量：

```
src/features/cluster/inventory/pages/inventory-list.tsx
   4:32  error  'ChevronDown' is defined but never used    @typescript-eslint/no-unused-vars
   4:45  error  'ChevronRight' is defined but never used   @typescript-eslint/no-unused-vars
   5:35  error  'HostInventory' is defined but never used  @typescript-eslint/no-unused-vars
  32:11  error  't' is assigned a value but never used     @typescript-eslint/no-unused-vars
```

## 修复内容

### 修改文件
- `src/features/cluster/inventory/pages/inventory-list.tsx`

### 具体修改
1. 移除未使用的 `useTranslation` 导入
2. 移除未使用的 `ChevronDown` 图标导入
3. 移除未使用的 `ChevronRight` 图标导入
4. 移除未使用的 `HostInventory` 类型导入
5. 移除 `const { t } = useTranslation();` 声明

### 代码变更

```diff
 import { useState } from 'react';
-import { useTranslation } from 'react-i18next';
 import { type ColumnDef } from '@tanstack/react-table';
-import { HardDrive, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
-import { useHostInventories, type HostInventory, type InventoryDevice } from '../api/use-inventory';
+import { HardDrive, RefreshCw } from 'lucide-react';
+import { useHostInventories, type InventoryDevice } from '../api/use-inventory';
 ...
 export function InventoryListPage() {
-  const { t } = useTranslation();
   const { data: inventories = [], isLoading, refetch } = useHostInventories();
```

## 影响页面

- 物理磁盘页面 (`/inventory`)

## 解决的问题

1. 消除 4 个 ESLint 错误
2. 清理无用导入
3. 减少打包体积

## 测试情况

- **ESLint**: 通过，无错误
- **TypeScript**: 通过
- **单元测试**: 未涉及（页面无单元测试）

## 其他问题

- 页面文本硬编码为英文，未来如需支持 i18n 需要重新添加 `useTranslation`
- `ChevronDown` 和 `ChevronRight` 可能是为展开/折叠功能预留的，如需实现需要重新添加
