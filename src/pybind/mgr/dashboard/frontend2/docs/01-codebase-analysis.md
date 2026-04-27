# 01 - 代码库分析

## 1. 后端结构

### 1.1 控制器 (controllers/)

后端使用 CherryPy 框架，控制器分为三种路由类型：

| 路由类型 | 前缀 | 用途 | 示例 |
|---|---|---|---|
| `@Router` | `/` | 静态文件/特殊路由 | home.py (前端文件), docs.py, saml2.py, prometheus_receiver |
| `@APIRouter` | `/api` | REST API 端点 | `/api/health`, `/api/host`, `/api/osd` |
| `@UIRouter` | `/ui-api` | UI 辅助端点 (状态检查、配置) | `/ui-api/host/status`, `/ui-api/orchestrator/*` |

完整控制器列表 (55 个):

| 控制器 | API 路由 | UI 路由 | 权限范围 |
|---|---|---|---|
| `auth.py` | `/api/auth` | - | 无 (公开) |
| `ceph_users.py` | `/api/cluster/user` | - | CEPHFS |
| `cephfs.py` | `/api/cephfs`, `/api/cephfs/subvolume`, `/api/cephfs/subvolume/group`, `/api/cephfs/subvolume/snapshot`, `/api/cephfs/subvolume/snapshot/clone`, `/api/cephfs/snapshot/schedule`, `/api/cephfs/mirror` | `/ui-api/cephfs`, `/ui-api/cephfs/mirror` | CEPHFS |
| `certificate.py` | `/api/service/certificate` | - | HOSTS |
| `cluster.py` | `/api/cluster` | - | - |
| `cluster_configuration.py` | `/api/cluster_conf` | - | CONFIG_OPT |
| `crush_rule.py` | `/api/crush_rule` | `/ui-api/crush_rule` | POOL |
| `daemon.py` | `/api/daemon` | - | HOSTS |
| `docs.py` | `/docs` (静态) | - | 无 |
| `erasure_code_profile.py` | `/api/erasure_code_profile` | `/ui-api/erasure_code_profile` | POOL |
| `feedback.py` | `/api/feedback`, `/api/feedback/api_key` | `/ui-api/feedback/api_key` | CONFIG_OPT |
| `frontend_logging.py` | - | `/ui-api/logging` | 无 |
| `grafana.py` | `/api/grafana` | - | GRAFANA |
| `hardware.py` | `/api/hardware` | - | - |
| `health.py` | `/api/health` | - | - |
| `home.py` | `/` (静态文件) | `/ui-api/langs`, `/ui-api/login` | 无 |
| `host.py` | `/api/host` | `/ui-api/host` | HOSTS |
| `iscsi.py` | `/api/iscsi`, `/api/iscsi/target` | `/ui-api/iscsi` | ISCSI |
| `logs.py` | `/api/logs` | - | LOG |
| `mgr_modules.py` | `/api/mgr/module` | - | CONFIG_OPT |
| `monitor.py` | `/api/monitor` | - | MONITOR |
| `multi_cluster.py` | `/api/multi-cluster` | `/ui-api/multi-cluster` | CONFIG_OPT |
| `nfs.py` | `/api/nfs-ganesha` | `/ui-api/nfs-ganesha` | NFS |
| `nvmeof.py` | `/api/nvmeof/gateway`, `/api/nvmeof/spdk`, `/api/nvmeof/subsystem`, `/api/nvmeof/subsystem/{nqn}/listener`, `/api/nvmeof/subsystem/{nqn}/namespace`, `/api/nvmeof/subsystem/{nqn}/host`, `/api/nvmeof/subsystem/{nqn}/connection` | `/ui-api/nvmeof` | NVME_OF |
| `oauth2.py` | (OAuth2 回调) | - | 无 |
| `orchestrator.py` | - | `/ui-api/orchestrator` | - |
| `osd.py` | `/api/osd` | `/ui-api/osd` | OSD |
| `perf_counters.py` | `/api/perf_counters/mds`, `/api/perf_counters/mon`, `/api/perf_counters/osd` | - | CEPHFS/MONITOR/OSD |
| `pool.py` | `/api/pool` | - | POOL |
| `prometheus.py` | `/api/prometheus`, `/api/prometheus/notifications` | `/ui-api/prometheus` | PROMETHEUS |
| `rbd.py` | `/api/block/image`, `/api/block/image/{image_spec}/snap`, `/api/block/image/trash`, `/api/block/pool/{pool_name}/namespace`, `/api/block/pool/{pool_name}/group`, `/api/block/pool/{pool_name}/group/{group_name}/snap` | `/ui-api/block/rbd` | RBD_IMAGE |
| `rbd_mirroring.py` | `/api/block/mirroring`, `/api/block/mirroring/summary`, `/api/block/mirroring/pool`, `/api/block/mirroring/pool/{pool_name}/bootstrap`, `/api/block/mirroring/pool/{pool_name}/peer` | `/ui-api/block/mirroring` | RBD_MIRRORING |
| `rgw.py` | `/api/rgw/*` | `/ui-api/rgw/*` | RGW |
| `rgw_iam.py` | `/api/rgw/accounts` | - | RGW |
| `role.py` | `/api/role` | `/ui-api/scope` | USER |
| `saml2.py` | `/auth/saml2` | - | 无 |
| `service.py` | `/api/service` | - | HOSTS |
| `settings.py` | `/api/settings` | `/ui-api/standard_settings` | CONFIG_OPT |
| `smb.py` | `/api/smb/*` | - | SMB |
| `summary.py` | `/api/summary` | - | - |
| `task.py` | `/api/task` | - | - |
| `telemetry.py` | `/api/telemetry` | - | CONFIG_OPT |
| `user.py` | `/api/user`, `/api/user/{username}` | - | USER |

### 1.2 服务层 (services/)

| 服务文件 | 职责 |
|---|---|
| `ceph_service.py` | Ceph 集群服务管理 |
| `cephfs.py` | CephFS 操作 |
| `iscsi_cli.py` / `iscsi_client.py` / `iscsi_config.py` | iSCSI 网关 CLI 交互 |
| `nvmeof_cli.py` / `nvmeof_client.py` / `nvmeof_conf.py` / `nvmeof_top_cli.py` | NVMe-oF 网关管理 |
| `rbd.py` | RBD 镜像操作 |
| `rgw_client.py` / `rgw_iam.py` | RGW 客户端和 IAM |
| `sso.py` | SSO/OAuth2/SAML2 认证 |
| `orchestrator.py` | 编排器 (cephadm) |
| `osd.py` | OSD 管理 |
| `settings.py` | 设置管理 |
| `tcmu_service.py` | TCMU runner 服务 |
| `progress.py` | 任务进度跟踪 |
| `access_control.py` | 访问控制 |

### 1.3 认证机制

- **用户名/密码**: `POST /api/auth` → 返回 token + permissions
- **SSO (SAML2/OAuth2)**: `POST /api/auth/check` → 重定向到 IdP → 回调验证
- **Session**: 使用 localStorage 存储用户名、权限、SSO 标志
- **API 版本**: `Accept: application/vnd.ceph.api.v1.0+json`
- **多集群**: Bearer token 代理到远程集群
- **登出**: `POST /api/auth/logout` → 可能重定向到 IdP 登出

### 1.4 前端文件服务

`HomeController` + `LanguageMixin`:
- 扫描 `frontend/dist/` 下按语言分目录 (en-US/, de/, fr/ 等)
- 根据 `cd-lang` cookie 或 `Accept-Language` 头选择语言
- 返回对应语言目录下的静态文件
- 默认返回 `index.html`
- 设置 `Vary: Accept-Language` 和 `Cache-control: no-cache`

## 2. 前端结构 (Angular)

### 2.1 模块层次

```
AppModule
├── AppRoutingModule (Hash 路由, PreloadAllModules)
├── CoreModule
│   ├── NavigationModule
│   └── AuthModule (懒加载)
├── SharedModule
│   ├── ComponentsModule (50+ 组件)
│   ├── DataTableModule
│   ├── PipesModule (45 管道)
│   ├── DirectivesModule (21 指令)
│   └── HelpersModule (空)
└── CephModule
    ├── ClusterModule (主机、OSD、Monitor、配置)
    ├── DashboardModule + DashboardV3Module (概览页)
    ├── PerformanceCounterModule
    ├── CephfsModule
    ├── NfsModule
    ├── SmbModule
    ├── CephSharedModule
    ├── BlockModule (懒加载 - RBD, iSCSI, NVMe-oF, Mirroring)
    ├── PoolModule (懒加载)
    └── RgwModule (懒加载 - 用户、桶、守护进程、多站点)
```

### 2.2 页面路由映射

#### 主布局页面 (WorkbenchLayout + AuthGuard)

| 路由 | 组件 | 功能 |
|---|---|---|
| `/overview` | DashboardComponent | 集群概览仪表盘 |
| `/hosts` | HostsComponent | 主机列表 |
| `/hosts/add` | HostFormComponent | 添加主机 |
| `/ceph-users` | CRUDTableComponent | Ceph 用户 (通用 CRUD) |
| `/monitor` | MonitorComponent | Monitor 列表 |
| `/services` | ServicesComponent | 服务列表 |
| `/osd` | OsdListComponent | OSD 列表 |
| `/osd/create` | OsdFormComponent | 创建 OSD |
| `/configuration` | ConfigurationComponent | 集群配置 |
| `/crush-map` | CrushmapComponent | CRUSH Map |
| `/logs` | LogsComponent | 审计日志 |
| `/telemetry` | TelemetryComponent | 遥测设置 |
| `/monitoring/active-alerts` | ActiveAlertListComponent | 活跃告警 |
| `/monitoring/alerts` | RulesListComponent | 告警规则 |
| `/monitoring/silences` | SilenceListComponent | 静默规则 |
| `/upgrade` | UpgradeComponent | 升级管理 |
| `/mgr-modules` | MgrModuleListComponent | MGR 模块 |
| `/multi-cluster/overview` | MultiClusterComponent | 多集群概览 |
| `/inventory` | InventoryComponent | 硬件清单 |
| `/notifications` | NotificationsPageComponent | 通知页 |
| `/add-storage` | CreateClusterComponent | 引导式创建集群 |
| `/perf_counters/:type/:id` | PerformanceCounterComponent | 性能计数器 |
| `/api-docs` | ApiDocsComponent | API 文档 |
| `/user-profile/edit` | UserPasswordFormComponent | 修改密码 |

#### 块存储 (懒加载 - /block)

| 路由 | 组件 | 功能 |
|---|---|---|
| `/block/rbd` | RbdListComponent | RBD 镜像列表 |
| `/block/rbd/namespaces` | RbdNamespaceListComponent | RBD 命名空间 |
| `/block/rbd/trash` | RbdTrashListComponent | RBD 回收站 |
| `/block/rbd/performance` | RbdPerformanceComponent | RBD 性能 |
| `/block/rbd/create` | RbdFormComponent | 创建 RBD |
| `/block/rbd/edit/:image_spec` | RbdFormComponent | 编辑 RBD |
| `/block/mirroring` | RbdMirroringComponent | RBD 镜像 |
| `/block/iscsi/overview` | IscsiComponent | iSCSI 概览 |
| `/block/iscsi/targets` | IscsiTargetListComponent | iSCSI Target 列表 |
| `/block/iscsi/targets/create` | IscsiTargetFormComponent | 创建 iSCSI Target |
| `/block/nvmeof/gateways` | NvmeofGatewayGroupComponent | NVMe-oF 网关 |
| `/block/nvmeof/subsystems` | NvmeofSubsystemsComponent | NVMe-oF 子系统 |

#### 存储池 (懒加载 - /pool)

| 路由 | 组件 | 功能 |
|---|---|---|
| `/pool` | PoolListComponent | 存储池列表 |
| `/pool/create` | PoolFormComponent | 创建存储池 |
| `/pool/edit/:name` | PoolFormComponent | 编辑存储池 |

#### 对象网关 (懒加载 - /rgw)

| 路由 | 组件 | 功能 |
|---|---|---|
| `/rgw/daemon` | RgwDaemonListComponent | RGW 守护进程 |
| `/rgw/user` | RgwUserListComponent | RGW 用户 |
| `/rgw/bucket` | RgwBucketListComponent | RGW 桶 |
| `/rgw/overview` | RgwOverviewDashboardComponent | RGW 概览 |
| `/rgw/multisite/configuration` | RgwMultisiteDetailsComponent | 多站点配置 |
| `/rgw/accounts` | RgwUserAccountsComponent | RGW 账户 |
| `/rgw/roles` | CRUDTableComponent | RGW 角色 (通用 CRUD) |

#### 文件系统 (CephFS/NFS/SMB)

| 路由 | 组件 | 功能 |
|---|---|---|
| `/cephfs/fs` | CephfsListComponent | CephFS 文件系统列表 |
| `/cephfs/mirroring` | CephfsMirroringListComponent | CephFS 镜像 |
| `/cephfs/nfs` | NfsClusterComponent | NFS 网关 |
| `/cephfs/smb` | SmbClusterListComponent | SMB 集群 |
| `/cephfs/smb/active-directory` | SmbJoinAuthListComponent | SMB AD 认证 |
| `/cephfs/smb/standalone` | SmbUsersgroupsListComponent | SMB 独立用户组 |
| `/cephfs/smb/overview` | SmbOverviewComponent | SMB 概览 |

#### 用户管理 (懒加载 - /user-management)

| 路由 | 组件 | 功能 |
|---|---|---|
| `/user-management/users` | UserListComponent | 用户列表 |
| `/user-management/users/create` | UserFormComponent | 创建用户 |
| `/user-management/roles` | RoleListComponent | 角色列表 |

### 2.3 API 服务 → 端点映射

见 [02-api-mapping.md](./02-api-mapping.md) 完整列表。

### 2.4 通用 CRUD 模式

这是一个关键抽象，需要在新架构中复刻：

- **DataGatewayService**: 将资源标识符如 `api.cluster.user@1.0` 映射到 URL `api/cluster/user`
- **CRUDTableComponent**: 基于 DataGateway 元数据自动生成数据表格
- **CrudFormComponent**: 基于 @ngx-formly 自动生成表单

目前使用通用 CRUD 的页面:
- `/ceph-users` → 资源 `api.cluster.user@1.0`
- `/rgw/roles` → 资源 `api.rgw.role@1.0`

### 2.5 共享组件 (50+)

按功能分组:

**布局/导航:**
- VerticalNavigationComponent, SidebarLayoutComponent, PageHeaderComponent
- SidePanelComponent, TearsheetComponent, TearsheetStepComponent

**表单/输入:**
- SubmitButtonComponent, FormButtonPanelComponent, FormModalComponent
- SelectComponent, DateTimePickerComponent, NumberWithUnitComponent
- FormAdvancedFieldsetComponent, ConfigOptionComponent

**数据展示:**
- DataTableModule (表格、分页、CRUD 表格)
- SparklineComponent, UsageBarComponent, ProgressComponent
- DetailsCardComponent, CardComponent, CardGroupComponent, CardRowComponent
- CdLabelComponent, IconComponent, CodeBlockComponent

**反馈/通知:**
- ModalComponent, DeleteConfirmationModalComponent, ConfirmationModalComponent
- AlertPanelComponent, InlineMessageComponent, ToastComponent
- NotificationsSidebarComponent, MotdComponent, PwdExpirationNotificationComponent
- TelemetryNotificationComponent, CustomLoginBannerComponent

**工具:**
- Copy2ClipboardButtonComponent, DownloadButtonComponent, BackButtonComponent
- DocComponent, HelpTextComponent, HelperComponent
- LanguageSelectorComponent, GrafanaComponent, LoadingPanelComponent

### 2.6 管道 (Pipes) → React 等价物

Angular 管道对应 React 中的工具函数或格式化库:

| Angular 管道 | React 方案 | 说明 |
|---|---|---|
| DimlessPipe, DimlessBinaryPipe | 工具函数 + Intl.NumberFormat | 磁盘容量格式化 |
| IopsPipe, MbpersecondPipe | 工具函数 | IOPS/带宽格式化 |
| DurationPipe, MillisecondsPipe | date-fns formatDuration | 时间格式化 |
| CdDatePipe, RelativeDatePipe | date-fns format + formatDistance | 日期格式化 |
| BooleanPipe, BooleanTextPipe | 简单函数 | 布尔值显示 |
| PluralizePipe | 工具函数 | 复数化 |
| TruncatePipe | CSS text-overflow 或工具函数 | 文本截断 |
| HealthIconPipe, HealthColorPipe, HealthLabelPipe | 工具函数 + 常量映射 | 健康状态颜色/图标 |
| CephReleaseNamePipe, CephVersionPipe | 工具函数 | Ceph 版本映射 |
| SanitizeHtmlPipe | DOMPurify | HTML 消毒 |
| XmlPipe | 工具函数 | XML 格式化 |

### 2.7 路由守卫 → React 等价物

| Angular 守卫 | React 方案 | 说明 |
|---|---|---|
| AuthGuardService | 路由 loader + 认证上下文 | 未登录重定向 /login |
| ChangePasswordGuardService | 路由 loader | 需修改密码时重定向 |
| FeatureTogglesGuardService | 路由 loader + Feature 上下文 | 功能未启用返回 404 |
| ModuleStatusGuardService | 路由 loader + 异步检查 | 模块未启用返回 404 |
| NoSsoGuardService | 路由 loader | SSO 用户不可访问 |

## 3. 构建与部署

### 当前构建流程

```
CMake → Node.js 环境准备 → npm ci → 环境变量替换 → i18n 准备 → Nx build → 输出到 dist/
```

### 前端文件服务

```
CherryPy HomeController → 按语言目录提供 dist/{locale}/ 下的静态文件
```

### 开发代理

```
Angular dev server (port 4200, SSL) → proxy /api/, /ui-api/, /docs/ → CherryPy (port 8443)
```

### 关键约束

1. 后端 `HomeController` 假设 `dist/{locale}/index.html` 结构，新前端必须保持或修改后端
2. `cd-lang` cookie 和 `Accept-Language` 头用于语言选择
3. API 版本头 `Accept: application/vnd.ceph.api.v1.0+json` 必须保持
4. 多集群场景的 Bearer token 代理机制必须保持
