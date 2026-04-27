# Phase 5: 对象存储模块

## 工作目标

迁移 RGW 守护进程、用户管理、桶管理、账户、多站点配置、Topic 等对象存储相关页面。完成后，用户可以在 React 应用中完成对象存储的日常运维操作。

完成标志：对象存储模块下的所有页面可正常访问和操作，与 Angular 版本功能对等。

## 工作内容

### 5.1 迁移 RGW 守护进程

- 守护进程列表 → `src/features/rgw/daemon/pages/daemon-list.tsx`
  - 显示：守护进程 ID、版本、地址、请求/错误统计
  - 详情展开或跳转：显示完整统计信息

### 5.2 迁移 RGW 用户管理

- 用户列表 → `src/features/rgw/user/pages/user-list.tsx`
  - 列：用户 ID、显示名、S3/Caps 权限、配额状态、子用户数
  - 操作：创建、编辑、删除
- 用户创建/编辑 → `src/features/rgw/user/components/user-form.tsx`
  - 基本信息区：用户 ID、显示名、邮箱、最大桶数
  - S3 访问密钥区：Access Key / Secret Key（自动生成或手动输入）
  - Caps 权限区：用户类型 (user/types)、桶权限等
  - 配额区：用户配额、桶配额（最大大小、最大对象数，启用/禁用）
  - 子用户区：添加/删除子用户、关联 Swift 密钥
  - 使用 `react-hook-form` + `zod` 验证

### 5.3 迁移 RGW 桶管理

- 桶列表 → `src/features/rgw/bucket/pages/bucket-list.tsx`
  - 列：桶名、拥有者、存储类、对象数、大小
  - 操作：创建、编辑、删除
- 桶创建/编辑 → `src/features/rgw/bucket/components/bucket-form.tsx`
  - 基本配置：桶名、拥有者、放置目标
  - 高级配置：版本控制、生命周期规则、存储类
  - 使用 `react-hook-form` + `zod` 验证

### 5.4 迁移 RGW 账户

- 账户列表 → `src/features/rgw/accounts/pages/account-list.tsx`
- 账户创建/编辑 → `src/features/rgw/accounts/components/account-form.tsx`

### 5.5 迁移 RGW 多站点

- 多站点配置 → `src/features/rgw/multisite/`
  - Realm 列表/详情
  - Zonegroup 列表/详情
  - Zone 列表/详情
  - 同步策略配置
- 复杂表单：Zonegroup 和 Zone 的创建/编辑涉及多个关联配置

### 5.6 迁移 RGW 其他

- Topic (通知) → `src/features/rgw/topic/`
  - Topic 列表、创建/编辑、删除
- 存储类 → `src/features/rgw/storage-class/`
- RGW 概览仪表盘 → `src/features/rgw/overview/pages/rgw-overview.tsx`
  - 统计摘要、健康状态

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 守护进程列表 | 导航到 RGW 守护进程页面 | 列表正确显示版本、地址、统计 |
| 2 | 用户列表 | 导航到用户页面 | 表格正确显示所有用户 |
| 3 | 用户创建 | 填写完整用户信息（含 Caps、配额） | 创建成功，列表刷新 |
| 4 | 用户编辑 | 修改用户配额 | 保存成功，配额更新 |
| 5 | 用户删除 | 删除一个用户 | 确认弹窗 → 删除成功 |
| 6 | S3 密钥 | 创建用户时自动生成密钥 | Access Key 和 Secret Key 正确显示 |
| 7 | 桶列表 | 导航到桶页面 | 表格正确显示 |
| 8 | 桶创建 | 填写桶名、配置版本控制 | 创建成功 |
| 9 | 桶编辑 | 修改桶的生命周期规则 | 保存成功 |
| 10 | 账户 CRUD | 创建 → 编辑 → 删除账户 | 全流程正常 |
| 11 | 多站点 Realm | 查看 Realm 列表 | 列表正确显示 |
| 12 | Topic CRUD | 创建 → 编辑 → 删除 Topic | 全流程正常 |
| 13 | RGW 未启用 | 未配置 RGW 时导航到对象菜单 | 菜单项隐藏或提示未启用 |
| 14 | 功能对比 | 逐一对比 Angular 版本每个页面 | 功能无遗漏 |
