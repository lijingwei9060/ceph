# Phase 8: 用户管理模块

## 工作目标

迁移 Dashboard 用户管理（登录 Dashboard 的用户）和角色管理页面。完成后，管理员可以在 React 应用中管理 Dashboard 的用户和角色权限。

完成标志：用户管理模块下所有页面可正常访问和操作，与 Angular 版本功能对等。

## 工作内容

### 8.1 迁移 Dashboard 用户管理

- 用户列表 → `src/features/user-management/users/pages/user-list.tsx`
  - 列：用户名、角色、权限、启用状态、最后登录
  - 操作：创建、编辑、删除、启用/禁用
- 用户创建/编辑 → `src/features/user-management/users/components/user-form.tsx`
  - 基本字段：用户名、密码/确认密码（创建时必填，编辑时可选）
  - 角色分配：选择已有角色（下拉列表）
  - 权限分配：基于 Scope 的权限选择（当未使用角色时）
  - SSO 关联：是否允许 SSO 登录
  - 密码策略展示（最小长度、复杂度要求，从 `GET /ui-api/standard_settings` 获取）
  - 使用 `react-hook-form` + `zod` 验证

### 8.2 迁移角色管理

- 角色列表 → `src/features/user-management/roles/pages/role-list.tsx`
  - 列：角色名、描述、权限范围数
  - 操作：创建、编辑、删除
- 角色创建/编辑 → `src/features/user-management/roles/components/role-form.tsx`
  - 基本字段：角色名、描述
  - 权限范围选择：多选所有可用的 Scope（从 `GET /ui-api/scope` 获取列表）
  - 使用 `react-hook-form` + `zod` 验证

### 8.3 迁移 Ceph 用户 (通用 CRUD)

- Ceph 集群用户列表 → 复用 Phase 1 创建的 `useCrudList('cluster/user')` 通用 CRUD hooks
- 如需自定义页面可单独创建，否则使用通用列表 + 详情模板

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 用户列表 | 导航到用户管理页面 | 表格正确显示所有 Dashboard 用户 |
| 2 | 用户创建 | 填写用户名、密码、分配角色 | 创建成功，列表刷新 |
| 3 | 用户编辑 | 修改用户角色 | 保存成功，角色更新 |
| 4 | 用户删除 | 删除一个用户 | 确认弹窗 → 删除成功 |
| 5 | 密码验证 | 输入不符合策略的密码 | 显示验证错误 |
| 6 | 角色列表 | 导航到角色管理页面 | 表格正确显示所有角色 |
| 7 | 角色创建 | 填写角色名、选择权限范围 | 创建成功 |
| 8 | 角色编辑 | 修改权限范围 | 保存成功 |
| 9 | 权限生效 | 创建只读角色用户并用该用户登录 | 无写操作按钮 |
| 10 | Ceph 用户 | 查看 Ceph 集群用户列表 | 列表正确显示 |
| 11 | 功能对比 | 对比 Angular 版本 | 功能无遗漏 |
