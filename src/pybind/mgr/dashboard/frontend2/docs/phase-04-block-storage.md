# Phase 4: 块存储模块

## 工作目标

迁移 RBD 镜像管理、RBD 命名空间、RBD 回收站、RBD 性能、RBD 镜像 (Mirroring)、iSCSI、NVMe-oF 等块存储相关页面。完成后，用户可以在 React 应用中完成块存储的日常运维操作。

完成标志：块存储模块下的所有页面可正常访问和操作，与 Angular 版本功能对等。所有表单验证规则与 Angular 版本一致。

## 工作内容

### 4.1 迁移 RBD 镜像管理

- RBD 列表 → `src/features/block/rbd/pages/rbd-list.tsx`
  - 支持按存储池筛选
  - 列：名称、存储池、大小、特性、快照数、Parent
  - 操作：创建、编辑、克隆、复制、删除、移动到回收站
- RBD 创建/编辑表单 → `src/features/block/rbd/components/rbd-form.tsx`
  - 复杂表单：存储池选择、大小、特性 (features)、镜像启用、对象大小
  - 使用 `react-hook-form` + `zod` 验证
- RBD 命名空间 → `src/features/block/rbd/pages/rbd-namespaces.tsx`
  - 命名空间列表、创建、删除
- RBD 回收站 → `src/features/block/rbd/pages/rbd-trash.tsx`
  - 回收站列表：显示原名称、删除时间、过期时间
  - 操作：恢复、清除
- RBD 性能 → `src/features/block/rbd/pages/rbd-performance.tsx`
  - IOPS/吞吐量图表（shadcn Chart）
  - 按存储池或 RBD 镜像筛选

### 4.2 迁移 RBD 镜像 (Mirroring)

- 镜像概览 → `src/features/block/mirroring/pages/mirroring-overview.tsx`
  - 健康状态、统计摘要
- 镜像池列表 → `src/features/block/mirroring/pages/mirroring-pools.tsx`
  - 池级别镜像配置
- Bootstrap/Peer 管理
  - 创建 Bootstrap、添加/删除 Peer

### 4.3 迁移 iSCSI 管理

- iSCSI 概览 → `src/features/block/iscsi/pages/iscsi-overview.tsx`
  - Target 数量、门户数量等统计
- Target 列表 → `src/features/block/iscsi/pages/target-list.tsx`
  - 显示：Target 名称 (IQN)、状态
- Target 创建/编辑 → `src/features/block/iscsi/components/target-form.tsx`
  - 复杂表单：IQN、Portal、LUN 映射、CHAP 认证、Mutual 认证
  - 多步骤或分区表单

### 4.4 迁移 NVMe-oF 管理

- 网关组 → `src/features/block/nvmeof/pages/gateway-groups.tsx`
- 子系统列表 → `src/features/block/nvmeof/pages/subsystems.tsx`
- 子系统详情 → `src/features/block/nvmeof/pages/subsystem-detail.tsx`
  - 标签页：Listener、Namespace、Host
- 命名空间列表 → `src/features/block/nvmeof/pages/namespaces.tsx`
  - 创建/编辑命名空间

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | RBD 列表 | 导航到 RBD 页面 | 表格正确显示所有 RBD 镜像 |
| 2 | RBD 按池筛选 | 切换存储池下拉 | 列表按池过滤 |
| 3 | RBD 创建 | 点击创建，填写表单，提交 | 创建成功，列表刷新 |
| 4 | RBD 编辑 | 点击编辑某个 RBD | 表单预填当前值，修改后保存成功 |
| 5 | RBD 克隆 | 点击克隆 | 克隆流程完成 |
| 6 | RBD 移入回收站 | 删除一个 RBD | RBD 从列表消失，出现在回收站 |
| 7 | 回收站恢复 | 在回收站点击恢复 | RBD 恢复到列表中 |
| 8 | 回收站清除 | 在回收站点击清除 | RBD 被永久删除 |
| 9 | RBD 性能 | 导航到性能页 | 图表正确渲染 |
| 10 | 镜像概览 | 导航到 Mirroring 页面 | 健康状态和统计正确显示 |
| 11 | iSCSI Target CRUD | 创建 → 编辑 → 删除 Target | 全流程正常 |
| 12 | iSCSI 表单验证 | 提交空 IQN | 显示验证错误 |
| 13 | NVMe-oF 子系统 | 查看子系统详情 | 各标签页数据正确 |
| 14 | 表单验证一致性 | 用相同边界值测试 Angular 和 React 表单 | 验证规则完全一致 |
| 15 | 功能对比 | 逐一对比 Angular 版本每个页面 | 功能无遗漏 |
