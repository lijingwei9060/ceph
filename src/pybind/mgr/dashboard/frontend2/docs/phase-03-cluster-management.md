# Phase 3: 集群管理模块

## 工作目标

迁移主机管理、OSD 管理、Monitor、集群配置、CRUSH Map 等集群核心页面。完成后，用户可以在 React 应用中完成集群日常运维操作：管理主机、操作 OSD、查看 Monitor 状态、修改配置、查看 CRUSH Map。

完成标志：集群管理模块下的所有页面可正常访问和操作，与 Angular 版本功能对等。

## 工作内容

### 3.1 迁移主机管理

- 主机列表 → `src/features/cluster/hosts/pages/host-list.tsx`
  - 使用 shadcn DataTable：分页 + 排序 + 筛选
  - 列：主机名、地址、角色、状态、标签、CPU/内存使用
  - 操作：添加主机、编辑标签、维护模式切换、删除
- 主机详情 → `src/features/cluster/hosts/pages/host-detail.tsx`
  - 标签页：设备列表、SMART 信息、网络接口
- 添加主机 → `src/features/cluster/hosts/components/host-form.tsx`
  - 使用 `react-hook-form` + `zod` 验证
  - 字段：主机名、地址、端口

### 3.2 迁移 OSD 管理

- OSD 列表 → `src/features/cluster/osd/pages/osd-list.tsx`
  - 复杂表格：多状态列、PG 分布、使用率
  - 批量操作：标记 in/out/up/down、scrub、deep-scrub、删除
  - 操作确认弹窗（破坏性操作需二次确认）
- OSD 详情 → `src/features/cluster/osd/pages/osd-detail.tsx`
  - 标签页：概览、性能计数器、配置覆盖、历史
  - 性能计数器直方图（shadcn Chart）
  - 等待回填 (backfill) 状态展示
- 创建 OSD 向导 → `src/features/cluster/osd/components/osd-create-wizard.tsx`
  - 多步骤：设备选择 → 确认 → 执行
  - 使用 shadcn Stepper 或自定义步骤指示器

### 3.3 迁移 Monitor 页面

- Monitor 列表 → `src/features/cluster/monitor/pages/monitor-list.tsx`
  - 显示：rank、地址、法定人数 (quorum) 状态
  - quorum 内的 Monitor 高亮显示

### 3.4 迁移集群配置

- 配置列表 → `src/features/cluster/config/pages/config-list.tsx`
  - 搜索 + 分组过滤（mon、osd、mds、rgw 等）
  - 使用 shadcn DataTable
- 配置编辑 → `src/features/cluster/config/components/config-edit-form.tsx`
  - 支持修改配置值，显示默认值和当前值

### 3.5 迁移 CRUSH Map

- CRUSH Map 可视化 → `src/features/cluster/crush/pages/crush-map.tsx`
  - 树形视图展示 CRUSH 层级（使用 shadcn Tree 或自定义树组件）
  - 节点展开/折叠，显示类型、名称、权重

### 3.6 迁移服务管理

- 服务列表 → `src/features/cluster/services/pages/service-list.tsx`
  - 显示：服务名、运行位置 (daemon)、状态
- 服务创建/编辑 → `src/features/cluster/services/components/service-form.tsx`
  - 选择服务类型、spec 配置

### 3.7 迁移 MGR 模块

- 模块列表 → `src/features/cluster/mgr-modules/pages/module-list.tsx`
  - 显示：模块名、是否启用、可操作（启用/禁用）
- 模块配置编辑 → `src/features/cluster/mgr-modules/components/module-form.tsx`
  - 动态表单：根据模块配置 schema 生成表单字段

### 3.8 迁移其他集群页面

- 日志 → `src/features/cluster/logs/pages/logs.tsx`
  - 日志级别筛选、关键词搜索、自动滚动
- 遥测 → `src/features/cluster/telemetry/pages/telemetry.tsx`
  - 遥测启用/禁用、状态展示
- 升级 → `src/features/cluster/upgrade/pages/upgrade.tsx`
  - 升级状态、进度展示
- 硬件清单 → `src/features/cluster/inventory/pages/inventory.tsx`
- 多集群管理 → `src/features/cluster/multi-cluster/`
  - 集群列表、添加/删除集群、切换活跃集群

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 主机列表 | 导航到主机页面 | 表格显示所有主机，分页、排序正常 |
| 2 | 主机筛选 | 在搜索框输入主机名 | 表格按条件筛选 |
| 3 | 添加主机 | 点击添加，填写表单，提交 | 主机创建成功，列表刷新 |
| 4 | 主机详情 | 点击某个主机名 | 跳转详情页，标签页切换正常 |
| 5 | OSD 列表 | 导航到 OSD 页面 | 表格显示所有 OSD 及状态 |
| 6 | OSD 批量操作 | 选中多个 OSD，点击 Mark Out | 操作成功，OSD 状态变更 |
| 7 | OSD 创建向导 | 点击创建 OSD | 向导步骤流程正确，可完成创建 |
| 8 | OSD 详情 | 点击某个 OSD | 详情页各标签页数据正确 |
| 9 | Monitor 列表 | 导航到 Monitor 页面 | 正确显示 quorum 成员和非成员 |
| 10 | 配置搜索 | 在配置页搜索 "osd_max" | 过滤出相关配置项 |
| 11 | 配置编辑 | 修改某个配置值并保存 | 保存成功，值更新 |
| 12 | CRUSH Map | 导航到 CRUSH Map 页面 | 树形结构正确展示 |
| 13 | 服务列表 | 导航到服务页面 | 服务列表正确显示 |
| 14 | MGR 模块 | 启用/禁用某个模块 | 操作成功，状态更新 |
| 15 | 日志页面 | 导航到日志页面 | 日志滚动显示，筛选正常 |
| 16 | 多集群切换 | 在多集群环境切换活跃集群 | 请求代理到目标集群 |
| 17 | 功能对比 | 逐一对比 Angular 版本每个页面 | 功能无遗漏，交互一致 |
