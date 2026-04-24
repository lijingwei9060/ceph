# 03 - 迁移阶段详细计划

## Phase 0: 项目基础设施 (2-3 天)

### 目标
初始化 React 项目，配置完整工具链，确保开发环境和构建产物可与后端对接。

### 具体任务

#### 0.1 初始化 Vite + React + TypeScript 项目
- 使用 `pnpm create vite front2 --template react-ts`
- 配置 `tsconfig.json` 严格模式
- 配置路径别名 `@/` → `src/`

#### 0.2 安装和配置 Tailwind CSS + shadcn/ui
- 安装 Tailwind CSS 4.x 及其 Vite 插件
- 初始化 shadcn/ui (`pnpm dlx shadcn@latest init`)
- 配置 shadcn 主题，参考现有 Carbon Design 色彩方案：
  - 主色: 蓝色系 (与 Carbon 的 blue-60 一致)
  - 警告色: 黄色系
  - 错误色: 红色系
  - 成功色: 绿色系
- 安装常用 shadcn 组件: Button, Input, Table, Dialog, Card, Tabs, Select, Form, Toast, NavigationMenu, Sheet, Dropdown, Badge, etc.

#### 0.3 配置开发代理
- 创建 `vite.config.ts` 的 proxy 配置：
  ```ts
  proxy: {
    '/api': { target: 'https://localhost:8443', secure: false },
    '/ui-api': { target: 'https://localhost:8443', secure: false },
    '/docs': { target: 'https://localhost:8443', secure: false },
  }
  ```
- 开发服务器端口设为 4201 (避免与现有 Angular 4200 冲突)

#### 0.4 配置 i18n (react-i18next)
- 安装 `react-i18next`, `i18next`, `i18next-browser-languagedetector`
- 创建 i18n 配置，支持 `cd-lang` cookie 和 `Accept-Language` 头
- 初始只提供 en-US 翻译文件
- 后续逐步从 Angular XLF 文件迁移翻译

#### 0.5 配置路由 (React Router v7)
- 安装 `react-router` v7
- 配置 Hash 路由模式 (与现有 Angular `useHash: true` 一致)
- 创建基础路由结构 (暂为空页面占位)

#### 0.6 配置 API 客户端基础
- 安装 `ky` 或 `axios` 作为 HTTP 客户端
- 创建 `src/lib/api-client.ts`:
  - 自动添加 `Accept: application/vnd.ceph.api.v1.0+json` 头
  - 401 响应自动重定向到 `/login`
  - 支持多集群 Bearer token 代理
- 创建 API 版本管理工具函数

#### 0.7 配置状态管理
- 安装 `@tanstack/react-query` (服务端状态)
- 安装 `zustand` (客户端状态)
- 配置 React Query DevTools

#### 0.8 配置代码质量工具
- ESLint + Prettier 配置
- Husky + lint-staged (git hooks)
- 配置 Vitest 单元测试

### 涉及的后端 API
- 无 (纯前端基础设施)

### 测试方法
- [ ] `pnpm dev` 启动开发服务器，确认代理工作
- [ ] 访问 `/api/health` 能返回后端数据
- [ ] i18n 切换语言正常
- [ ] 路由导航正常 (Hash 模式)
- [ ] API 客户端版本头正确
- [ ] 单元测试框架可运行
- [ ] `pnpm build` 构建成功

### 目录结构
```
front2/
├── docs/                    # 迁移文档
├── public/
├── src/
│   ├── components/          # 共享 UI 组件
│   │   └── ui/              # shadcn/ui 组件
│   ├── features/            # 功能模块 (按业务域组织)
│   ├── hooks/               # 自定义 Hooks
│   ├── i18n/                # 国际化
│   │   ├── locales/
│   │   │   └── en-US.json
│   │   └── index.ts
│   ├── lib/                 # 工具库
│   │   ├── api-client.ts    # API 客户端
│   │   ├── auth.ts          # 认证工具
│   │   └── utils.ts         # 通用工具
│   ├── routes/              # 路由定义
│   │   ├── index.tsx
│   │   └── guards.tsx       # 路由守卫
│   ├── stores/              # Zustand 状态
│   ├── types/               # TypeScript 类型定义
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css            # Tailwind 入口
├── tests/                   # E2E 测试 (Playwright)
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Phase 1: 共享层迁移 (3-5 天)

### 目标
迁移认证、权限、类型定义、API 服务层，为所有页面模块提供基础。

### 具体任务

#### 1.1 迁移类型定义 (从 shared/models/)
- 将 ~80 个 Angular 模型文件转换为 TypeScript 接口
- 重点类型: HealthInterface, HostInterface, OsdModel, ClusterModel, Permissions, LoginResponse 等
- 使用 `zod` 为关键 API 响应创建运行时验证 schema
- 位置: `src/types/`

#### 1.2 迁移认证系统
- 创建 `src/lib/auth.ts`:
  - `login(username, password)` → POST `/api/auth`
  - `check(token?)` → POST `/api/auth/check`
  - `logout()` → POST `/api/auth/logout`
  - Session 存储: localStorage (dashboard_username, dashboard_permissions, sso 等)
- 创建 `src/stores/auth-store.ts` (Zustand):
  - 用户名、权限、SSO 状态、密码过期等
- 创建 `src/hooks/use-auth.ts`:
  - isAuthenticated, user, permissions, login, logout
- SSO 流程: SAML2/OAuth2 重定向处理
- 密码修改强制重定向逻辑

#### 1.3 迁移权限系统
- 将 `Permissions` 类迁移为 TypeScript
- 创建 `src/hooks/use-permission.ts`:
  - `hasPermission(scope)` 检查当前用户权限
  - 替代 Angular 的 `AuthStorageDirective` 权限判断
- 创建权限范围常量: Scope.HOSTS, Scope.OSD, Scope.RGW 等

#### 1.4 迁移 API 服务层 (从 shared/api/)
- 为每个 API 服务创建 React Query hooks:
  - `src/features/health/api/use-health.ts` → `useHealth()`
  - `src/features/host/api/use-hosts.ts` → `useHosts()`, `useHost(hostname)`, `useCreateHost()`, etc.
  - 模式: 每个 API 一个 hook 文件，使用 TanStack Query 的 `useQuery` 和 `useMutation`
- 迁移轮询逻辑:
  - SummaryService (5s) → `useQuery({ refetchInterval: 5000 })`
  - FeatureTogglesService (30s) → `useQuery({ refetchInterval: 30000 })`
- 迁移 DataGatewayService 的通用 CRUD 模式:
  - 创建 `src/lib/crud.ts`:
    - `useCrudList(resource)` → 通用列表查询
    - `useCrudDetail(resource, id)` → 通用详情查询
    - `useCrudCreate(resource)` → 通用创建
    - `useCrudUpdate(resource)` → 通用更新
    - `useCrudDelete(resource)` → 通用删除

#### 1.5 迁移工具函数 (替代 Pipes)
- `src/lib/format.ts`:
  - `formatDimless(value)` → 替代 DimlessPipe
  - `formatDimlessBinary(value)` → 替代 DimlessBinaryPipe
  - `formatIops(value)` → 替代 IopsPipe
  - `formatDuration(ms)` → 替代 DurationPipe/MillisecondsPipe (使用 date-fns)
  - `formatDate(date)` → 替代 CdDatePipe (使用 date-fns)
  - `formatRelativeDate(date)` → 替代 RelativeDatePipe
  - `formatBoolean(value)` → 替代 BooleanPipe
  - `pluralize(count, singular, plural)` → 替代 PluralizePipe
  - `truncate(text, length)` → 替代 TruncatePipe
  - `cephReleaseName(version)` → 替代 CephReleaseNamePipe
  - `cephVersion(version)` → 替代 CephVersionPipe
- `src/lib/health.ts`:
  - `getHealthIcon(status)` → 替代 HealthIconPipe
  - `getHealthColor(status)` → 替代 HealthColorPipe
  - `getHealthLabel(status)` → 替代 HealthLabelPipe

#### 1.6 迁移路由守卫
- 创建 `src/routes/guards.tsx`:
  - `AuthGuard` → 检查认证状态，未登录重定向 /login
  - `ChangePasswordGuard` → 检查密码修改要求
  - `FeatureToggleGuard` → 检查功能开关
  - `ModuleStatusGuard` → 检查模块可用性
  - `NoSsoGuard` → SSO 用户限制

### 涉及的后端 API
- `POST /api/auth`, `POST /api/auth/check`, `POST /api/auth/logout`
- `GET /api/feature_toggles`
- `GET /ui-api/scope`
- 所有 API 的版本头和 401 处理

### 测试方法
- [ ] 认证: 用户名/密码登录 → 获取权限 → 登出
- [ ] SSO: 模拟 SAML2 重定向流程
- [ ] 权限: 不同权限用户看到不同 UI
- [ ] API 客户端: 所有请求带版本头，401 自动跳转
- [ ] CRUD hooks: 列表查询、详情查询、创建、更新、删除
- [ ] 路由守卫: 未认证访问受保护路由 → 重定向登录
- [ ] 工具函数: 与 Angular 管道输出对比，确保一致性
- [ ] 单元测试覆盖所有工具函数和 hooks

---

## Phase 2: 核心框架页面 (5-7 天)

### 目标
迁移布局、侧边栏导航、登录页、集群概览仪表盘——这些是用户看到的第一批页面。

### 具体任务

#### 2.1 迁移布局组件
- `WorkbenchLayout` → `src/components/layouts/workbench-layout.tsx`
  - 侧边栏 (可折叠) + 主内容区 + 顶部栏
  - 侧边栏: 基于用户权限动态显示菜单项
  - 顶部栏: 集群健康状态指示器、通知铃铛、用户菜单
- `LoginLayout` → `src/components/layouts/login-layout.tsx`
- `BlankLayout` → 404 页面

#### 2.2 迁移侧边栏导航
- 基于 `VerticalNavigationComponent` 创建侧边栏
- 菜单结构:
  ```
  概览 (Overview)
  ├── 集群 (Cluster)
  │   ├── 主机 (Hosts)
  │   ├── 监视器 (Monitors)
  │   ├── 服务 (Services)
  │   ├── OSD
  │   ├── 配置 (Configuration)
  │   ├── CRUSH Map
  │   ├── Manager Modules
  │   ├── 集群升级 (Upgrade)
  │   └── 日志 (Logs)
  ├── 块 (Block)
  │   ├── RBD 镜像
  │   ├── RBD 命名空间
  │   ├── RBD 回收站
  │   ├── RBD 性能
  │   ├── RBD 镜像
  │   ├── iSCSI
  │   └── NVMe-oF
  ├── 对象 (Object)
  │   ├── 守护进程
  │   ├── 用户
  │   ├── 桶
  │   └── 多站点
  ├── 文件系统 (Filesystem)
  │   ├── CephFS
  │   ├── NFS
  │   └── SMB
  └── 存储池 (Pools)
  ```
- 菜单项根据 Feature Toggles 和权限动态显示/隐藏
- 使用 shadcn/ui 的 NavigationMenu 或 Sidebar 组件

#### 2.3 迁移登录页
- `LoginComponent` → `src/features/auth/pages/login.tsx`
- 登录表单 (用户名 + 密码)
- SSO 按钮 (如果有 SSO 配置)
- 自定义登录横幅 (`/ui-api/login/custom_banner`)
- 密码修改页 → `src/features/auth/pages/change-password.tsx`
- 密码策略展示

#### 2.4 迁移集群概览仪表盘
- `DashboardComponent` (overview) → `src/features/dashboard/pages/overview.tsx`
- 健康状态卡片 (HEALTH_OK/WARN/ERR)
- 性能摘要 (IOPS, 吞吐量, 容量使用)
- 存储容量使用条
- PG 状态分布
- 最近告警列表
- 使用 Recharts 或 shadcn Chart 绘制图表
- `SummaryService` 数据 → `useSummary()` hook (5s 轮询)

#### 2.5 迁移通知系统
- Toast 通知 → shadcn/ui Sonner/Toast
- 通知侧边栏
- 每日消息 (MOTD) 提示
- 密码过期提示

#### 2.6 迁移面包屑导航
- `BreadCrumbService` → React Router breadcrumb
- 创建 `src/components/breadcrumb.tsx`

### 涉及的后端 API
- `GET /api/summary` (5s 轮询)
- `GET /api/health`
- `GET /api/cluster`
- `GET /api/feature_toggles` (30s 轮询)
- `POST /api/auth`, `POST /api/auth/check`, `POST /api/auth/logout`
- `GET /ui-api/login/custom_banner`
- `GET /ui-api/motd`
- `GET /ui-api/standard_settings`

### 测试方法
- [ ] 登录: 用户名/密码 → 登录成功 → 显示概览页
- [ ] 登录: SSO 流程 → 重定向 → 回调 → 显示概览页
- [ ] 登录: 密码过期 → 强制修改密码
- [ ] 布局: 侧边栏展开/折叠、菜单导航
- [ ] 布局: 不同权限用户看到不同菜单项
- [ ] 概览: 健康状态正确显示
- [ ] 概览: 数据自动刷新 (5s)
- [ ] 通知: Toast 出现和消失
- [ ] 登出: 清除状态 → 重定向登录页
- [ ] 对比 Angular 版本和 React 版本的视觉一致性

---

## Phase 3: 集群管理模块 (5-7 天)

### 目标
迁移主机管理、OSD 管理、Monitor、集群配置、CRUSH Map 等集群核心页面。

### 具体任务

#### 3.1 迁移主机管理
- 主机列表 → `src/features/cluster/hosts/pages/host-list.tsx`
  - DataTable + 分页 + 排序 + 筛选
  - 列: 主机名、地址、角色、状态、标签、CPU/内存使用
- 主机详情 → `src/features/cluster/hosts/pages/host-detail.tsx`
  - 设备列表、SMART 信息、网络接口
- 添加主机 → `src/features/cluster/hosts/components/host-form.tsx`
  - react-hook-form + zod 验证
- 标签管理、维护模式切换

#### 3.2 迁移 OSD 管理
- OSD 列表 → `src/features/cluster/osd/pages/osd-list.tsx`
  - 复杂表格: 多状态列、PG 分布、性能图表
  - 批量操作: 标记 in/out/up/down、scrub、删除
- OSD 详情 → `src/features/cluster/osd/pages/osd-detail.tsx`
  - 性能计数器直方图
  - OSD 配置覆盖
  - 等待回填 (backfill) 状态
- 创建 OSD 向导 → `src/features/cluster/osd/components/osd-create-wizard.tsx`
  - 多步骤: 设备选择 → 确认 → 执行

#### 3.3 迁移 Monitor 页面
- Monitor 列表 → `src/features/cluster/monitor/pages/monitor-list.tsx`
  - 显示 rank、地址、法定人数状态

#### 3.4 迁移集群配置
- 配置列表 → `src/features/cluster/config/pages/config-list.tsx`
  - 搜索 + 分组 (mon, osd, mds, rgw 等)
- 配置编辑 → `src/features/cluster/config/components/config-edit-form.tsx`

#### 3.5 迁移 CRUSH Map
- CRUSH Map 可视化 → `src/features/cluster/crush/pages/crush-map.tsx`
  - 树形视图展示 CRUSH 层级

#### 3.6 迁移服务管理
- 服务列表 → `src/features/cluster/services/pages/service-list.tsx`
  - 服务状态、运行位置
- 服务创建/编辑 → `src/features/cluster/services/components/service-form.tsx`

#### 3.7 迁移 MGR 模块
- 模块列表 → `src/features/cluster/mgr-modules/pages/module-list.tsx`
- 模块配置编辑 → `src/features/cluster/mgr-modules/components/module-form.tsx`

#### 3.8 迁移其他集群页面
- 日志 → `src/features/cluster/logs/pages/logs.tsx`
- 遥测 → `src/features/cluster/telemetry/pages/telemetry.tsx`
- 升级 → `src/features/cluster/upgrade/pages/upgrade.tsx`
- 硬件清单 → `src/features/cluster/inventory/pages/inventory.tsx`
- 多集群管理 → `src/features/cluster/multi-cluster/`

### 涉及的后端 API
- `/api/host/*`, `/ui-api/host/*`
- `/api/osd/*`, `/ui-api/osd/*`
- `/api/monitor`
- `/api/cluster_conf/*`
- `/api/crush_rule/*`, `/ui-api/crush_rule/*`
- `/api/service/*`
- `/api/mgr/module/*`
- `/api/logs/*`
- `/api/telemetry/*`
- `/api/cluster/upgrade/*`
- `/api/hardware/*`
- `/api/multi-cluster/*`, `/ui-api/multi-cluster/*`
- `/api/daemon/*`
- `/ui-api/orchestrator/*`

### 测试方法
- [ ] 主机: 列表显示、搜索筛选、添加/删除主机
- [ ] OSD: 列表显示、标记操作、创建向导
- [ ] Monitor: 法定人数状态正确
- [ ] 配置: 搜索、编辑配置项
- [ ] CRUSH Map: 树形结构正确
- [ ] 服务: 列表、创建、编辑
- [ ] MGR 模块: 启用/禁用、配置编辑
- [ ] 对比 Angular 版本功能完整性

---

## Phase 4: 块存储模块 (5-7 天)

### 目标
迁移 RBD、iSCSI、NVMe-oF、RBD 镜像等块存储相关页面。

### 具体任务

#### 4.1 迁移 RBD 镜像管理
- RBD 列表 → `src/features/block/rbd/pages/rbd-list.tsx`
  - 支持按存储池筛选
  - 列: 名称、存储池、大小、特性、快照数
  - 操作: 创建、编辑、克隆、复制、删除
- RBD 表单 → `src/features/block/rbd/components/rbd-form.tsx`
  - 复杂表单: 存储池选择、大小、特性、镜像启用等
- RBD 命名空间 → `src/features/block/rbd/pages/rbd-namespaces.tsx`
- RBD 回收站 → `src/features/block/rbd/pages/rbd-trash.tsx`
  - 恢复/清除操作
- RBD 性能 → `src/features/block/rbd/pages/rbd-performance.tsx`
  - IOPS/吞吐量图表

#### 4.2 迁移 RBD 镜像 (Mirroring)
- 镜像概览 → `src/features/block/mirroring/pages/mirroring-overview.tsx`
  - 健康状态、统计摘要
- 镜像池列表 → `src/features/block/mirroring/pages/mirroring-pools.tsx`
- Bootstrap/Peer 管理

#### 4.3 迁移 iSCSI 管理
- iSCSI 概览 → `src/features/block/iscsi/pages/iscsi-overview.tsx`
- Target 列表 → `src/features/block/iscsi/pages/target-list.tsx`
- Target 创建/编辑 → `src/features/block/iscsi/components/target-form.tsx`
  - 复杂表单: IQN、Portal、LUN 映射、认证

#### 4.4 迁移 NVMe-oF 管理
- 网关组 → `src/features/block/nvmeof/pages/gateway-groups.tsx`
- 子系统列表 → `src/features/block/nvmeof/pages/subsystems.tsx`
- 子系统详情 → `src/features/block/nvmeof/pages/subsystem-detail.tsx`
  - Listener、Namespace、Host 子标签页
- 命名空间列表 → `src/features/block/nvmeof/pages/namespaces.tsx`

### 涉及的后端 API
- `/api/block/image/*`, `/ui-api/block/rbd/*`
- `/api/block/mirroring/*`, `/ui-api/block/mirroring/*`
- `/api/iscsi/*`, `/ui-api/iscsi/*`
- `/api/nvmeof/*`, `/ui-api/nvmeof/*`

### 测试方法
- [ ] RBD: 列表、创建、编辑、删除、克隆、复制
- [ ] RBD: 回收站恢复/清除
- [ ] 镜像: 概览数据正确
- [ ] iSCSI: Target CRUD
- [ ] NVMe-oF: 子系统、命名空间、Host 管理
- [ ] 所有表单验证规则与 Angular 版本一致

---

## Phase 5: 对象存储模块 (3-5 天)

### 目标
迁移 RGW 用户、桶、守护进程、多站点配置等对象存储页面。

### 具体任务

#### 5.1 迁移 RGW 守护进程
- 守护进程列表 → `src/features/rgw/daemon/pages/daemon-list.tsx`
  - 显示版本、地址、统计信息

#### 5.2 迁移 RGW 用户管理
- 用户列表 → `src/features/rgw/user/pages/user-list.tsx`
- 用户创建/编辑 → `src/features/rgw/user/components/user-form.tsx`
  - S3/Caps 权限、配额设置、子用户

#### 5.3 迁移 RGW 桶管理
- 桶列表 → `src/features/rgw/bucket/pages/bucket-list.tsx`
- 桶创建/编辑 → `src/features/rgw/bucket/components/bucket-form.tsx`
  - 存储类、版本控制、生命周期

#### 5.4 迁移 RGW 账户
- 账户列表/创建/编辑 → `src/features/rgw/accounts/`

#### 5.5 迁移 RGW 多站点
- 多站点配置 → `src/features/rgw/multisite/`
- Zone/Zonegroup/Realm 管理
- 同步策略

#### 5.6 迁移 RGW 其他
- Topic (通知) → `src/features/rgw/topic/`
- 存储类 → `src/features/rgw/storage-class/`
- RGW NFS → 复用 NFS 组件
- RGW 概览仪表盘

### 涉及的后端 API
- `/api/rgw/daemon/*`
- `/api/rgw/user/*`
- `/api/rgw/bucket/*`
- `/api/rgw/accounts/*`
- `/api/rgw/multisite/*`, `/ui-api/rgw/multisite/*`
- `/api/rgw/realm/*`, `/api/rgw/zone/*`, `/api/rgw/zonegroup/*`
- `/api/rgw/site/*`
- `/api/rgw/topic/*`

### 测试方法
- [ ] 用户: 列表、创建 (含权限/配额)、编辑、删除
- [ ] 桶: 列表、创建、编辑、删除
- [ ] 守护进程: 列表正确显示
- [ ] 多站点: 配置展示正确
- [ ] 账户/Topic CRUD 正常

---

## Phase 6: 文件系统模块 (3-5 天)

### 目标
迁移 CephFS、NFS、SMB 文件系统相关页面。

### 具体任务

#### 6.1 迁移 CephFS 管理
- FS 列表 → `src/features/cephfs/fs/pages/fs-list.tsx`
- FS 详情 → `src/features/cephfs/fs/pages/fs-detail.tsx`
  - 标签页: MDS、客户端、目录、子卷、子卷组
- 子卷管理 → `src/features/cephfs/subvolume/`
- 快照计划 → `src/features/cephfs/snapshot-schedule/`
- CephFS 镜像 → `src/features/cephfs/mirroring/`

#### 6.2 迁移 NFS 管理
- NFS 集群列表 → `src/features/nfs/pages/nfs-cluster-list.tsx`
- NFS 导出列表 → `src/features/nfs/pages/nfs-export-list.tsx`
- NFS 导出创建/编辑 → `src/features/nfs/components/nfs-form.tsx`

#### 6.3 迁移 SMB 管理
- SMB 集群列表/创建/编辑 → `src/features/smb/cluster/`
- SMB 共享管理 → `src/features/smb/share/`
- AD 认证管理 → `src/features/smb/join-auth/`
- 独立用户组 → `src/features/smb/users-groups/`
- SMB 概览 → `src/features/smb/overview/`

### 涉及的后端 API
- `/api/cephfs/*`, `/ui-api/cephfs/*`
- `/api/cephfs/subvolume/*`, `/api/cephfs/subvolume/group/*`
- `/api/cephfs/snapshot/schedule/*`
- `/api/cephfs/mirror/*`, `/ui-api/cephfs/mirror/*`
- `/api/nfs-ganesha/*`, `/ui-api/nfs-ganesha/*`
- `/api/smb/*`

### 测试方法
- [ ] CephFS: FS 列表、详情各标签页、子卷 CRUD
- [ ] NFS: 导出 CRUD、集群状态
- [ ] SMB: 集群 CRUD、共享管理、AD 认证
- [ ] 功能开关控制: CephFS/NFS/SMB 未启用时隐藏菜单

---

## Phase 7: 存储池模块 (2-3 天)

### 目标
迁移存储池列表、创建、编辑页面。

### 具体任务

#### 7.1 迁移存储池管理
- 存储池列表 → `src/features/pool/pages/pool-list.tsx`
  - 列: 名称、类型、副本数、PG 数、使用率、已用/可用
- 存储池创建 → `src/features/pool/components/pool-form.tsx`
  - 复杂表单: 类型 (副本/纠删码)、PG 计算、设备类、CRUSH 规则
  - 纠删码配置文件选择/创建
- 存储池编辑 → 复用创建表单

### 涉及的后端 API
- `/api/pool/*`
- `/api/erasure_code_profile/*`
- `/api/crush_rule/*`

### 测试方法
- [ ] 列表: 数据显示、排序、筛选
- [ ] 创建: 副本池、纠删码池
- [ ] 编辑: 修改 PG 数、设备类等
- [ ] PG 计算器正确

---

## Phase 8: 用户管理模块 (2-3 天)

### 目标
迁移用户和角色的 CRUD 管理。

### 具体任务

#### 8.1 迁移用户管理
- 用户列表 → `src/features/user-management/users/pages/user-list.tsx`
- 用户创建/编辑 → `src/features/user-management/users/components/user-form.tsx`
  - 权限分配 (基于 Scope)
  - 密码设置/修改
  - SSO 关联

#### 8.2 迁移角色管理
- 角色列表 → `src/features/user-management/roles/pages/role-list.tsx`
- 角色创建/编辑 → `src/features/user-management/roles/components/role-form.tsx`
  - 权限范围选择

#### 8.3 迁移 Ceph 用户 (通用 CRUD)
- 使用 Phase 1 创建的通用 CRUD 组件

### 涉及的后端 API
- `/api/user/*`
- `/api/role/*`
- `/ui-api/scope`
- `/api/cluster/user/*`

### 测试方法
- [ ] 用户: 列表、创建 (含权限)、编辑、删除
- [ ] 角色: 列表、创建 (含权限范围)、编辑、删除
- [ ] 密码修改、验证

---

## Phase 9: 监控告警模块 (2-3 天)

### 目标
迁移 Prometheus 告警、Grafana 集成、Silences 等监控页面。

### 具体任务

#### 9.1 迁移活跃告警
- 告警列表 → `src/features/monitoring/alerts/pages/active-alerts.tsx`
  - 告警严重性、标签、注解

#### 9.2 迁移告警规则
- 规则列表 → `src/features/monitoring/alerts/pages/rules-list.tsx`
- 规则组 CRUD

#### 9.3 迁移 Silences
- Silence 列表 → `src/features/monitoring/silences/pages/silence-list.tsx`
- Silence 创建/编辑 → `src/features/monitoring/silences/components/silence-form.tsx`
  - 日期时间选择器、匹配器配置

#### 9.4 迁移 Grafana 集成
- Grafana 嵌入面板 (iframe)

### 涉及的后端 API
- `/api/prometheus/*`
- `/ui-api/prometheus/*`
- `/api/grafana/*`

### 测试方法
- [ ] 告警列表正确显示
- [ ] 告警规则 CRUD
- [ ] Silence 创建、编辑、删除、过期
- [ ] Grafana 面板嵌入正常

---

## Phase 10: 收尾与切换 (3-5 天)

### 目标
完成迁移的最后步骤: 移除 Angular 依赖、统一构建、全面测试、后端集成。

### 具体任务

#### 10.1 修改后端静态文件服务
- 修改 `controllers/home.py` 的 `LanguageMixin`:
  - 支持新的构建输出结构 (Vite 输出不同于 Angular)
  - Vite 构建输出: `dist/index.html` (单入口)，i18n 通过运行时切换而非构建时
  - 保留 `cd-lang` cookie 支持
- 修改 `module.py` 的 `get_frontend_path()`:
  - 支持从 `front2/dist/` 路径读取

#### 10.2 统一构建流程
- 创建 `front2/CMakeLists.txt`:
  - Node.js 环境准备 (与现有类似)
  - pnpm install --frozen-lockfile
  - Vite 构建
  - 安装到目标路径
- 更新顶层 `CMakeLists.txt`:
  - 添加 `front2` 为可选子目录
  - 添加 feature flag 切换 frontend/front2

#### 10.3 性能优化
- 代码分割 (Vite 自动)
- 懒加载 (React.lazy + Suspense)
- API 响应缓存优化 (TanStack Query staleTime)
- 图表库按需加载

#### 10.4 可访问性测试
- 所有页面键盘导航
- ARIA 标签
- 色彩对比度
- 屏幕阅读器兼容

#### 10.5 i18n 完整迁移
- 从 Angular XLF 文件提取翻译
- 转换为 react-i18next JSON 格式
- 验证所有 13 种语言

#### 10.6 E2E 测试
- 配置 Playwright (替代 Cypress)
- 为关键流程编写 E2E 测试
- 登录/登出、主机管理、OSD 操作、RBD CRUD 等

#### 10.7 文档更新
- 更新 README
- 开发者指南 (如何运行、构建、测试)
- 贡献指南

### 测试方法
- [ ] 完整功能回归: 逐一验证每个页面
- [ ] 对比 Angular 和 React 版本: 所有 CRUD 操作、表单验证、数据展示
- [ ] 多集群场景: 代理请求正常
- [ ] SSO/SAML2: 完整认证流程
- [ ] i18n: 切换 13 种语言，所有文本正确
- [ ] 性能: 首屏加载时间、页面切换速度
- [ ] 构建: CMake 构建流程完整
- [ ] 部署: 构建产物通过后端正确提供
