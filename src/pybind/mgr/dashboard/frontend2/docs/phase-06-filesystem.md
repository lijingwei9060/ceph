# Phase 6: 文件系统模块

## 工作目标

迁移 CephFS、NFS、SMB 文件系统相关页面。完成后，用户可以在 React 应用中完成文件系统的日常运维操作。

完成标志：文件系统模块下的所有页面可正常访问和操作，与 Angular 版本功能对等。CephFS/NFS/SMB 未启用时对应菜单项隐藏。

## 工作内容

### 6.1 迁移 CephFS 管理

- FS 列表 → `src/features/cephfs/fs/pages/fs-list.tsx`
  - 列：文件系统名、MDS rank、可用性
- FS 详情 → `src/features/cephfs/fs/pages/fs-detail.tsx`
  - 标签页：MDS（元数据服务器列表、rank、状态）、客户端（连接数、实例列表）、目录、子卷、子卷组
- 子卷管理 → `src/features/cephfs/subvolume/`
  - 子卷列表、创建、删除
  - 子卷详情（快照列表）
- 快照计划 → `src/features/cephfs/snapshot-schedule/`
  - 计划列表、创建、编辑、删除
  - Cron 表达式配置
- CephFS 镜像 → `src/features/cephfs/mirroring/`
  - 镜像状态、Peer 管理

### 6.2 迁移 NFS 管理

- NFS 集群列表 → `src/features/nfs/pages/nfs-cluster-list.tsx`
  - 显示集群名、状态
- NFS 导出列表 → `src/features/nfs/pages/nfs-export-list.tsx`
  - 显示导出路径、协议、访问权限
- NFS 导出创建/编辑 → `src/features/nfs/components/nfs-form.tsx`
  - 字段：集群选择、导出路径、协议 (NFSv3/v4)、伪根路径、访问类型 (RW/RO)、Squash、客户端列表
  - 使用 `react-hook-form` + `zod` 验证

### 6.3 迁移 SMB 管理

- SMB 集群 → `src/features/smb/cluster/`
  - 集群列表、创建、编辑、删除
- SMB 共享 → `src/features/smb/share/`
  - 共享列表、创建、编辑、删除
- AD 认证 → `src/features/smb/join-auth/`
  - Join Auth 列表、创建、编辑、删除
- 独立用户组 → `src/features/smb/users-groups/`
  - 用户组列表、创建、编辑、删除
- SMB 概览 → `src/features/smb/overview/`
  - 统计摘要、健康状态

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | CephFS 列表 | 导航到 CephFS 页面 | 列表正确显示文件系统 |
| 2 | CephFS 详情 | 点击某个文件系统 | 详情页各标签页数据正确 |
| 3 | 子卷 CRUD | 创建 → 删除子卷 | 全流程正常 |
| 4 | 快照计划 | 创建快照计划 | 计划保存成功，列表显示 |
| 5 | CephFS 镜像 | 查看镜像状态 | 状态正确显示 |
| 6 | NFS 集群 | 查看集群列表 | 列表正确显示 |
| 7 | NFS 导出 CRUD | 创建 → 编辑 → 删除导出 | 全流程正常 |
| 8 | NFS 表单验证 | 提交空导出路径 | 显示验证错误 |
| 9 | SMB 集群 CRUD | 创建 → 编辑 → 删除集群 | 全流程正常 |
| 10 | SMB 共享管理 | 创建/编辑共享 | 操作成功 |
| 11 | AD 认证 | 创建 Join Auth | 保存成功 |
| 12 | 功能开关隐藏 | 未启用 CephFS 时 | 菜单项隐藏 |
| 13 | 功能开关隐藏 | 未启用 NFS 时 | 菜单项隐藏 |
| 14 | 功能开关隐藏 | 未启用 SMB 时 | 菜单项隐藏 |
| 15 | 功能对比 | 逐一对比 Angular 版本每个页面 | 功能无遗漏 |
