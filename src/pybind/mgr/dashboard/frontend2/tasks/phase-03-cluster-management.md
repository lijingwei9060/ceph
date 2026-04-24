# Phase 3: 集群管理模块 — 完成总结

## 完成时间
2026-04-24

## 工作内容

### 3.1 可复用 DataTable 组件
- `src/components/ui/data-table.tsx` — 基于 TanStack Table 的通用数据表格：
  - 支持列排序（click header）、全局搜索（column filter）、分页
  - 列可见性下拉菜单（DropdownMenuCheckboxItem）
  - 加载状态骨架屏
  - 空数据提示
  - 支持自定义 `searchKey` 和 `searchPlaceholder`

### 3.2 主机管理
- `src/features/cluster/hosts/pages/host-list.tsx` — 主机列表页：
  - DataTable 展示主机名、地址、状态、标签、CPU、内存、OSD 数
  - 搜索过滤（按主机名）
  - 操作菜单：编辑标签、删除主机
  - 添加主机 Dialog + 编辑主机 Dialog
  - 使用 `useHosts()` API hook（Phase 1 已实现）
- `src/features/cluster/hosts/components/host-form.tsx` — 主机表单：
  - react-hook-form + zod 验证
  - 字段：主机名、地址、标签（逗号分隔）
  - 使用 `useCreateHost()` mutation

### 3.3 OSD 管理
- `src/features/cluster/osd/api/use-osd.ts` — 完整 OSD API hooks：
  - `useOsds()` — 列表查询
  - `useOsd(svcId)` — 详情查询
  - `useOsdHistogram(svcId)` — 性能直方图
  - `useOsdSettings()` — nearfull/full ratio 设置
  - `useOsdSafeToDestroy(ids)` — 安全删除检查
  - `useOsdMarkOut/In/Down()` — 状态标记 mutations
  - `useOsdScrub()` — 轻量/深度 scrub
  - `useOsdReweight()` — 临时权重调整
  - `useOsdDelete()` / `useOsdPurge()` — 删除操作
- `src/features/cluster/osd/pages/osd-list.tsx` — OSD 列表页：
  - DataTable 展示 OSD ID、状态徽章（Up & In/Down/Out/Nearfull/Full）、主机、类型、CRUSH 权重、已用/可用空间、使用率进度条
  - 操作菜单：Mark In/Out、Mark Down、Scrub、Deep Scrub、Delete
  - 确认 Dialog（删除、Scrub）
  - OSD 状态徽章颜色编码（绿色=健康、黄色=近满、红色=满/异常）

### 3.4 Monitor 页面
- `src/features/cluster/monitor/api/use-monitor.ts` — `useMonitors()` hook
- `src/features/cluster/monitor/pages/monitor-list.tsx` — Monitor 列表：
  - Quorum 状态卡片（in/out 数量）
  - 表格：rank、name、address、quorum 状态
  - CheckCircle/XCircle 图标区分是否在 quorum 中

### 3.5 集群配置
- `src/features/cluster/config/api/use-config.ts` — 配置 API hooks：
  - `useClusterConfig()` — 全部配置项列表
  - `useClusterConfigByName(name)` — 单项配置详情
  - `useSetConfig()` — 批量设置配置
  - `useDeleteConfig()` — 删除配置
- `src/features/cluster/config/pages/config-list.tsx` — 配置列表页：
  - 搜索过滤（按名称/描述）
  - 表格：名称（monospace）、类型、级别、描述、默认值、当前值
  - Edit 按钮打开 Dialog 表单编辑
  - 使用 react-hook-form + zod 编辑配置值

### 3.6 CRUSH Map
- `src/features/cluster/crush/api/use-crush-rule.ts` — CRUSH 规则 API：
  - `useCrushRules()` / `useCrushRule(name)` / `useDeleteCrushRule()`
- `src/features/cluster/crush/pages/crush-map.tsx` — CRUSH Map 树视图：
  - 从 `useHealthFull()` 的 `osd_map.crush.trees` 获取数据
  - 可折叠的树形结构（ChevronRight/ChevronDown）
  - 每个节点显示：类型徽章、名称、CRUSH 权重
  - 默认展开前 2 层

### 3.7 服务管理
- `src/features/cluster/services/api/use-service.ts` — 服务 API hooks：
  - `useServices(serviceName?)` — 服务列表
  - `useServiceTypes()` — 已知服务类型
  - `useDeleteService()` — 删除服务
- `src/features/cluster/services/pages/service-list.tsx` — 服务列表页：
  - DataTable 展示服务类型、ID、主机、状态（CheckCircle/XCircle）、版本

### 3.8 MGR 模块
- `src/features/cluster/mgr-modules/api/use-mgr-modules.ts` — MGR 模块 API hooks：
  - `useMgrModules()` — 模块列表
  - `useMgrModuleOptions(name)` / `useMgrModuleConfig(name)` — 模块选项/配置
  - `useEnableModule()` / `useDisableModule()` — 启用/禁用模块
  - `useSetModuleConfig()` — 设置模块配置
- `src/features/cluster/mgr-modules/pages/module-list.tsx` — 模块列表页：
  - DataTable 展示模块名、启用状态、Always On、描述
  - Enable/Disable 按钮（不可对 always_on 模块操作）
  - 操作后 toast 反馈

### 3.9 日志
- `src/features/cluster/logs/pages/logs.tsx` — 日志查看器：
  - 使用 `apiClient.get('logs')` 获取日志条目
  - 搜索过滤（关键词）
  - 优先级过滤（All/Debug/Info/Warning/Error）
  - 自动刷新开关（5 秒轮询）
  - 彩色徽章显示优先级（destructive=error, secondary=warning）
  - ScrollArea 滚动查看
  - monospace 字体显示

### 3.10 路由更新
- `src/routes/index.tsx` — 所有 Phase 3 页面已接入：
  - `/hosts` → `<HostListPage />`
  - `/osd` → `<OsdListPage />`
  - `/monitors` → `<MonitorListPage />`
  - `/configuration` → `<ConfigListPage />`
  - `/crush-map` → `<CrushMapPage />`
  - `/services` → `<ServiceListPage />`
  - `/mgr-modules` → `<ModuleListPage />`
  - `/logs` → `<LogsPage />`

### 3.11 类型扩展
- `src/types/health.ts` — 扩展 `ClusterHealth` 接口：
  - 新增 `osd_map` 字段（含 `crush.trees`）
  - 新增 `CrushNode` 接口
- `src/types/index.ts` — 导出新增类型

### 3.12 新依赖
- `@tanstack/react-table` ^8.21.3 — 数据表格
- `@tanstack/react-virtual` ^3.13.24 — 虚拟滚动（备用）

### 3.13 新增 shadcn 组件
- `checkbox.tsx` — 复选框
- `popover.tsx` — 弹出菜单
- `command.tsx` — 命令面板
- `scroll-area.tsx` — 滚动区域

## 新增/修改的文件

### 可复用组件
| 文件 | 说明 |
|------|------|
| `src/components/ui/data-table.tsx` | TanStack Table 封装 DataTable 组件 |
| `src/components/ui/checkbox.tsx` | 复选框组件 |
| `src/components/ui/popover.tsx` | 弹出菜单组件 |
| `src/components/ui/command.tsx` | 命令面板组件 |
| `src/components/ui/scroll-area.tsx` | 滚动区域组件 |

### 主机管理
| 文件 | 说明 |
|------|------|
| `src/features/cluster/hosts/pages/host-list.tsx` | 主机列表页 |
| `src/features/cluster/hosts/components/host-form.tsx` | 主机添加/编辑表单 |

### OSD 管理
| 文件 | 说明 |
|------|------|
| `src/features/cluster/osd/api/use-osd.ts` | OSD API hooks（12 个 hook） |
| `src/features/cluster/osd/pages/osd-list.tsx` | OSD 列表页（带操作菜单） |

### Monitor
| 文件 | 说明 |
|------|------|
| `src/features/cluster/monitor/api/use-monitor.ts` | Monitor API hook |
| `src/features/cluster/monitor/pages/monitor-list.tsx` | Monitor 列表页 |

### 配置
| 文件 | 说明 |
|------|------|
| `src/features/cluster/config/api/use-config.ts` | 配置 API hooks |
| `src/features/cluster/config/pages/config-list.tsx` | 配置列表页（支持编辑） |

### CRUSH Map
| 文件 | 说明 |
|------|------|
| `src/features/cluster/crush/api/use-crush-rule.ts` | CRUSH 规则 API hooks |
| `src/features/cluster/crush/pages/crush-map.tsx` | CRUSH Map 树视图页 |

### 服务
| 文件 | 说明 |
|------|------|
| `src/features/cluster/services/api/use-service.ts` | 服务 API hooks |
| `src/features/cluster/services/pages/service-list.tsx` | 服务列表页 |

### MGR 模块
| 文件 | 说明 |
|------|------|
| `src/features/cluster/mgr-modules/api/use-mgr-modules.ts` | MGR 模块 API hooks |
| `src/features/cluster/mgr-modules/pages/module-list.tsx` | 模块列表页 |

### 日志
| 文件 | 说明 |
|------|------|
| `src/features/cluster/logs/pages/logs.tsx` | 日志查看器页 |

### 路由和类型
| 文件 | 说明 |
|------|------|
| `src/routes/index.tsx` | 接入所有 Phase 3 页面路由 |
| `src/types/health.ts` | 扩展 ClusterHealth + CrushNode |
| `src/types/index.ts` | 导出 CrushNode |

## 校验结果

| # | 校验项 | 操作 | 预期结果 | 实际结果 |
|---|--------|------|----------|----------|
| 1 | 主机列表 | 访问 /#/hosts | DataTable 显示主机列表 | 代码正确，待 API 验证 |
| 2 | 添加主机 | 填写表单提交 | 主机创建成功，列表刷新 | 代码正确，待 API 验证 |
| 3 | OSD 列表 | 访问 /#/osd | DataTable 显示 OSD 及状态 | 代码正确，待 API 验证 |
| 4 | OSD 操作 | Mark Out/In/Down/Scrub | 操作成功，状态更新 | 代码正确，待 API 验证 |
| 5 | Monitor 列表 | 访问 /#/monitors | 显示 quorum 成员 | 代码正确，待 API 验证 |
| 6 | 配置列表 | 访问 /#/configuration | 搜索 + 分页显示 | 代码正确，待 API 验证 |
| 7 | 配置编辑 | 修改配置值保存 | 保存成功 | 代码正确，待 API 验证 |
| 8 | CRUSH Map | 访问 /#/crush-map | 树形结构展示 | 代码正确，待 API 验证 |
| 9 | 服务列表 | 访问 /#/services | 显示所有服务 | 代码正确，待 API 验证 |
| 10 | MGR 模块 | 启用/禁用模块 | 操作成功 | 代码正确，待 API 验证 |
| 11 | 日志页面 | 访问 /#/logs | 日志流式显示 | 代码正确，待 API 验证 |
| 12 | TypeScript 编译 | `pnpm build` | 无错误 | ✅ 通过 |
| 13 | 单元测试 | `pnpm test` | 全部通过 | ✅ 79 测试通过 |
| 14 | ESLint | `pnpm lint` | 无新错误 | ✅ 仅 pre-existing 警告 |

## 待后续阶段处理

- OSD 创建向导（多步骤）
- OSD 详情页（性能直方图、历史）
- 主机详情页（设备列表、SMART 信息、网络接口标签页）
- 配置编辑 Dialog 支持更多类型（int、bool、address 等）
- 日志 API `/api/logs` 确认响应格式
- Inventory（硬件清单）页面
- Telemetry 页面
- Upgrade 页面
- 多集群管理
