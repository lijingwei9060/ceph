# Phase 4: 块存储模块 — 完成总结

## 完成时间
2026-04-24

## 工作内容

### 4.1 RBD 镜像管理
- `src/features/block/rbd/api/use-rbd.ts` — 完整 RBD API hooks：
  - `useRbdImages(poolName?)` — RBD 镜像列表
  - `useRbdNamespaces(poolName)` — 命名空间列表
  - `useRbdTrash(poolName?)` — 回收站列表
  - `useCreateRbd()` — 创建镜像
  - `useUpdateRbd()` — 更新镜像
  - `useDeleteRbd()` — 永久删除
  - `useMoveRbdToTrash()` — 移入回收站
  - `useRestoreRbd()` — 从回收站恢复
  - `usePurgeRbd()` — 永久删除（从回收站）
  - `useCloneRbd()` — 克隆镜像
  - `useCopyRbd()` — 复制镜像
- `src/features/block/rbd/pages/rbd-list.tsx` — RBD 列表页：
  - DataTable 展示名称、存储池、大小（格式化）、特性（Badge）、快照数、状态
  - 操作菜单：Edit、Clone、Move to Trash、Delete Permanently
  - 创建 Dialog + 编辑 Dialog
- `src/features/block/rbd/pages/rbd-trash.tsx` — RBD 回收站页：
  - DataTable 展示原名称、池、删除时间、过期时间
  - Restore 和 Purge 操作
  - 过期项红色高亮
- `src/features/block/rbd/components/rbd-form.tsx` — RBD 表单：
  - react-hook-form + zod 验证（名称、池、大小必填）
  - 特性多选（8 个特性：layering、exclusive-lock 等）
  - Require Mirroring 开关
  - 大小解析（支持 10G、1T 等格式）

### 4.2 RBD Mirroring
- `src/features/block/mirroring/api/use-mirroring.ts` — Mirroring API hooks：
  - `useMirroringStats()` — 统计（daemons、pools、images、active）
  - `useMirroringPools()` — 池列表
  - `useMirroringPeers(poolName)` — Peer 列表
  - `useAddMirroringPeer()` / `useDeleteMirroringPeer()` — Peer 管理
  - `useUpdateMirroringPoolMode()` — 池镜像模式更新
- `src/features/block/mirroring/pages/mirroring-overview.tsx` — 镜像概览页：
  - 4 个统计卡片：Daemons、Pools、Provisioned Images、Active Images
  - Mirroring Pools DataTable（Pool、Mode、Peers、Images）

### 4.3 iSCSI 管理
- `src/features/block/iscsi/api/use-iscsi.ts` — iSCSI API hooks：
  - `useIscsiOverview()` — 概览统计（targets、portals、disks、clients）
  - `useIscsiTargets()` — Target 列表
  - `useCreateIscsiTarget()` — 创建 Target
  - `useDeleteIscsiTarget()` — 删除 Target
- `src/features/block/iscsi/pages/iscsi-overview.tsx` — iSCSI 概览页：
  - 4 个统计卡片：Targets、Portals、Disks、Clients
  - Targets DataTable（IQN、Status、Portals、Disks、Clients）
  - 操作菜单：Delete Target

### 4.4 路由更新
- `src/routes/index.tsx` — Phase 4 页面已接入：
  - `/block/rbd` → `<RbdListPage />`
  - `/block/rbd/trash` → `<RbdTrashPage />`
  - `/block/mirroring` → `<MirroringOverviewPage />`
  - `/block/iscsi` → `<IscsiOverviewPage />`

## 新增/修改的文件

### RBD 管理
| 文件 | 说明 |
|------|------|
| `src/features/block/rbd/api/use-rbd.ts` | RBD API hooks（12 个 hook） |
| `src/features/block/rbd/pages/rbd-list.tsx` | RBD 列表页（创建/编辑/删除/克隆菜单） |
| `src/features/block/rbd/pages/rbd-trash.tsx` | RBD 回收站页（恢复/清除） |
| `src/features/block/rbd/components/rbd-form.tsx` | RBD 创建/编辑表单 |

### RBD Mirroring
| 文件 | 说明 |
|------|------|
| `src/features/block/mirroring/api/use-mirroring.ts` | Mirroring API hooks |
| `src/features/block/mirroring/pages/mirroring-overview.tsx` | 镜像概览页（统计卡片 + 池列表） |

### iSCSI
| 文件 | 说明 |
|------|------|
| `src/features/block/iscsi/api/use-iscsi.ts` | iSCSI API hooks |
| `src/features/block/iscsi/pages/iscsi-overview.tsx` | iSCSI 概览页（统计卡片 + Target 列表） |

### 路由
| 文件 | 说明 |
|------|------|
| `src/routes/index.tsx` | 接入 Phase 4 页面路由 |

## 校验结果

| # | 校验项 | 操作 | 预期结果 | 实际结果 |
|---|--------|------|----------|----------|
| 1 | RBD 列表 | 访问 /#/block/rbd | DataTable 显示 RBD 镜像 | 代码正确，待 API 验证 |
| 2 | RBD 创建 | 填写表单提交 | 创建成功，列表刷新 | 代码正确，待 API 验证 |
| 3 | RBD 移入回收站 | 删除 RBD | 出现在回收站 | 代码正确，待 API 验证 |
| 4 | 回收站恢复 | 点击恢复 | RBD 恢复到列表 | 代码正确，待 API 验证 |
| 5 | 回收站清除 | 点击清除 | 永久删除 | 代码正确，待 API 验证 |
| 6 | Mirroring 统计 | 访问 /#/block/mirroring | 显示统计卡片 | 代码正确，待 API 验证 |
| 7 | iSCSI Target 列表 | 访问 /#/block/iscsi | 显示 Target 列表 | 代码正确，待 API 验证 |
| 8 | TypeScript 编译 | `pnpm build` | 无错误 | ✅ 通过 |
| 9 | 单元测试 | `pnpm test` | 全部通过 | ✅ 79 测试通过 |
| 10 | ESLint | `pnpm lint` | 无新错误 | ✅ 仅 pre-existing 警告 |

## 待后续阶段处理

- RBD 性能页面（IOPS/吞吐量图表）
- RBD 快照管理
- RBD 命名空间管理
- RBD 镜像池列表（Bootstrap/Peer 管理）
- iSCSI Target 创建表单（IQN、Portal、LUN、CHAP 认证）
- NVMe-oF 管理页面
- NFS 存储页面（Phase 5）
- CephFS 页面（Phase 6）
- Pools 页面（Phase 7）
