# 02 - API 映射关系

## API 前缀约定

| 前缀 | 类型 | 用途 |
|---|---|---|
| `/api/` | APIRouter | REST API，需要认证，有权限范围 |
| `/ui-api/` | UIRouter | UI 辅助端点，状态检查、配置获取等 |
| `/docs/` | Router | API 文档 (Swagger UI) |
| `/auth/saml2` | Router | SAML2 认证 |

## 认证 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| POST | `/api/auth` | AuthService.login() | 用户名/密码登录 |
| POST | `/api/auth/check` | AuthService.check() | SSO 登录检查 |
| POST | `/api/auth/logout` | AuthService.logout() | 登出 |
| GET | `/auth/saml2/metadata` | - | SAML2 元数据 |
| GET | `/auth/saml2/login` | - | SAML2 登录重定向 |
| POST | `/auth/saml2/acs` | - | SAML2 Assertion Consumer |
| GET | `/auth/saml2/slo` | - | SAML2 单点登出 |

## 集群概览 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/summary` | SummaryService | 集群摘要 (轮询 5s) |
| GET | `/api/health` | HealthService | 健康状态 |
| GET | `/api/health/minimal` | HealthService | 最小健康状态 |
| GET | `/api/cluster` | ClusterService | 集群信息 |
| GET | `/api/cluster/upgrade` | UpgradeService | 升级状态 |
| GET | `/api/feature_toggles` | FeatureTogglesService | 功能开关 (轮询 30s) |

## 主机 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/host` | HostService | 主机列表 |
| GET | `/api/host/{hostname}` | HostService | 主机详情 |
| POST | `/api/host` | HostService | 创建主机 |
| PUT | `/api/host/{hostname}` | HostService | 更新主机 |
| DELETE | `/api/host/{hostname}` | HostService | 删除主机 |
| GET | `/ui-api/host/status` | HostService | 主机模块状态 |
| GET | `/ui-api/host/zap/available` | HostService | Zap 可用性 |
| POST | `/api/host/{hostname}/identify` | HostService | 主机识别 |

## OSD API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/osd` | OsdService | OSD 列表 |
| GET | `/api/osd/{svc_id}` | OsdService | OSD 详情 |
| PUT | `/api/osd/{svc_id}` | OsdService | 更新 OSD |
| DELETE | `/api/osd/{svc_id}` | OsdService | 删除 OSD |
| POST | `/api/osd` | OsdService | 创建 OSD |
| GET | `/ui-api/osd/creation/workflow` | OsdService | OSD 创建工作流 |
| GET | `/ui-api/osd/status` | OsdService | OSD 模块状态 |
| POST | `/api/osd/{svc_id}/mark` | OsdService | 标记 OSD (up/down/in/out/lost) |
| POST | `/api/osd/{svc_id}/scrub` | OsdService | 触发 scrub |
| POST | `/api/osd/{svc_id}/deep_scrub` | OsdService | 触发深度 scrub |
| GET | `/api/osd/{svc_id}/histogram` | OsdService | OSD 直方图 |

## Monitor API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/monitor` | MonitorService | Monitor 列表 |

## 存储池 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/pool` | PoolService | 存储池列表 |
| GET | `/api/pool/{pool_name}` | PoolService | 存储池详情 |
| POST | `/api/pool` | PoolService | 创建存储池 |
| PUT | `/api/pool/{pool_name}` | PoolService | 更新存储池 |
| DELETE | `/api/pool/{pool_name}` | PoolService | 删除存储池 |
| GET | `/api/pool?attrs=pool_name` | PoolService | 简要池名列表 |

## RBD (块存储) API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/block/image` | RbdService | RBD 镜像列表 |
| GET | `/api/block/image/{image_spec}` | RbdService | RBD 镜像详情 |
| POST | `/api/block/image` | RbdService | 创建 RBD 镜像 |
| PUT | `/api/block/image/{image_spec}` | RbdService | 更新 RBD 镜像 |
| DELETE | `/api/block/image/{image_spec}` | RbdService | 删除 RBD 镜像 |
| POST | `/api/block/image/{image_spec}/clone` | RbdService | 克隆 RBD |
| POST | `/api/block/image/{image_spec}/copy` | RbdService | 复制 RBD |
| POST | `/api/block/image/{image_spec}/flatten` | RbdService | 合并 RBD |
| GET | `/api/block/image/trash` | RbdService | 回收站列表 |
| DELETE | `/api/block/image/trash/{image_id}` | RbdService | 清除回收站 |
| POST | `/api/block/image/trash/{image_id}/restore` | RbdService | 恢复回收站 |
| GET | `/api/block/image/{image_spec}/snap` | RbdService | 快照列表 |
| POST | `/api/block/image/{image_spec}/snap` | RbdService | 创建快照 |
| DELETE | `/api/block/image/{image_spec}/snap/{snap_name}` | RbdService | 删除快照 |
| GET | `/api/block/pool/{pool_name}/namespace` | RbdService | 命名空间列表 |
| GET | `/api/block/image/default_features` | RbdService | 默认特性 |
| GET | `/ui-api/block/rbd/status` | RbdService | RBD 模块状态 |

## RBD 镜像 (Mirroring) API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/block/mirroring/summary` | RbdMirroringService | 镜像摘要 |
| GET | `/api/block/mirroring/pool` | RbdMirroringService | 镜像池列表 |
| GET | `/api/block/mirroring/site_name` | RbdMirroringService | 站点名 |
| GET | `/api/block/mirroring/pool/{pool_name}/bootstrap` | RbdMirroringService | Bootstrap 信息 |
| POST | `/api/block/mirroring/pool/{pool_name}/bootstrap/token` | RbdMirroringService | 生成 bootstrap token |
| POST | `/api/block/mirroring/pool/{pool_name}/peer` | RbdMirroringService | 添加 peer |
| DELETE | `/api/block/mirroring/pool/{pool_name}/peer` | RbdMirroringService | 删除 peer |

## iSCSI API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/iscsi/target` | IscsiService | Target 列表 |
| GET | `/api/iscsi/target/{target_iqn}` | IscsiService | Target 详情 |
| POST | `/api/iscsi/target` | IscsiService | 创建 Target |
| PUT | `/api/iscsi/target/{target_iqn}` | IscsiService | 更新 Target |
| DELETE | `/api/iscsi/target/{target_iqn}` | IscsiService | 删除 Target |
| GET | `/ui-api/iscsi/status` | IscsiService | iSCSI 模块状态 |
| GET | `/ui-api/iscsi/settings` | IscsiService | iSCSI 设置 |
| GET | `/ui-api/iscsi/version` | IscsiService | iSCSI 版本 |
| GET | `/ui-api/iscsi/portals` | IscsiService | Portal 列表 |
| GET | `/ui-api/iscsi/overview` | IscsiService | iSCSI 概览 |

## NVMe-oF API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/nvmeof/gateway` | NvmeofService | 网关组列表 |
| GET | `/api/nvmeof/spdk` | NvmeofService | SPDK 信息 |
| GET | `/api/nvmeof/subsystem` | NvmeofService | 子系统列表 |
| GET | `/api/nvmeof/subsystem/{nqn}` | NvmeofService | 子系统详情 |
| POST | `/api/nvmeof/subsystem` | NvmeofService | 创建子系统 |
| DELETE | `/api/nvmeof/subsystem/{nqn}` | NvmeofService | 删除子系统 |
| GET | `/api/nvmeof/subsystem/{nqn}/listener` | NvmeofService | Listener 列表 |
| POST | `/api/nvmeof/subsystem/{nqn}/listener` | NvmeofService | 创建 Listener |
| DELETE | `/api/nvmeof/subsystem/{nqn}/listener` | NvmeofService | 删除 Listener |
| GET | `/api/nvmeof/subsystem/{nqn}/namespace` | NvmeofService | 命名空间列表 |
| POST | `/api/nvmeof/subsystem/{nqn}/namespace` | NvmeofService | 创建命名空间 |
| DELETE | `/api/nvmeof/subsystem/{nqn}/namespace` | NvmeofService | 删除命名空间 |
| GET | `/api/nvmeof/subsystem/{nqn}/host` | NvmeofService | Host 列表 |
| POST | `/api/nvmeof/subsystem/{nqn}/host` | NvmeofService | 添加 Host |
| DELETE | `/api/nvmeof/subsystem/{nqn}/host` | NvmeofService | 删除 Host |
| GET | `/api/nvmeof/subsystem/{nqn}/connection` | NvmeofService | 连接列表 |
| GET | `/ui-api/nvmeof/status` | NvmeofService | NVMe-oF 模块状态 |

## CephFS API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/cephfs` | CephfsService | FS 列表 |
| GET | `/api/cephfs/{fs_id}` | CephfsService | FS 详情 |
| GET | `/api/cephfs/{fs_id}/clients` | CephfsService | 客户端列表 |
| GET | `/api/cephfs/{fs_id}/mds_counters` | CephfsService | MDS 计数器 |
| DELETE | `/api/cephfs/{fs_id}` | CephfsService | 删除 FS |
| PUT | `/api/cephfs/{fs_id}` | CephfsService | 更新 FS |
| GET | `/api/cephfs/subvolume` | CephfsSubvolumeService | 子卷列表 |
| POST | `/api/cephfs/subvolume` | CephfsSubvolumeService | 创建子卷 |
| DELETE | `/api/cephfs/subvolume` | CephfsSubvolumeService | 删除子卷 |
| GET | `/api/cephfs/subvolume/group` | CephfsSubvolumeGroupService | 子卷组列表 |
| POST | `/api/cephfs/subvolume/group` | CephfsSubvolumeGroupService | 创建子卷组 |
| DELETE | `/api/cephfs/subvolume/group` | CephfsSubvolumeGroupService | 删除子卷组 |
| GET | `/api/cephfs/snapshot/schedule` | CephfsSnapshotScheduleService | 快照计划 |
| GET | `/api/cephfs/mirror` | CephfsService | CephFS 镜像 |
| GET | `/ui-api/cephfs/{fs_id}/tabs` | CephfsService | CephFS 标签页 |
| GET | `/ui-api/cephfs/mirror/status` | CephfsService | 镜像模块状态 |

## NFS API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/nfs-ganesha/export` | NfsService | NFS 导出列表 |
| GET | `/api/nfs-ganesha/export/{cluster_id}/{export_id}` | NfsService | NFS 导出详情 |
| POST | `/api/nfs-ganesha/export` | NfsService | 创建 NFS 导出 |
| PUT | `/api/nfs-ganesha/export/{cluster_id}/{export_id}` | NfsService | 更新 NFS 导出 |
| DELETE | `/api/nfs-ganesha/export/{cluster_id}/{export_id}` | NfsService | 删除 NFS 导出 |
| GET | `/api/nfs-ganesha/cluster` | NfsService | NFS 集群列表 |
| GET | `/ui-api/nfs-ganesha/cluster/{cluster_id}/status` | NfsService | NFS 集群状态 |

## SMB API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/smb/cluster` | SmbService | SMB 集群列表 |
| GET | `/api/smb/cluster/{cluster_id}` | SmbService | 集群详情 |
| POST | `/api/smb/cluster` | SmbService | 创建集群 |
| DELETE | `/api/smb/cluster/{cluster_id}` | SmbService | 删除集群 |
| GET | `/api/smb/share` | SmbService | 共享列表 |
| POST | `/api/smb/share` | SmbService | 创建共享 |
| DELETE | `/api/smb/share/{share_id}` | SmbService | 删除共享 |
| GET | `/api/smb/joinauth` | SmbService | AD 认证列表 |
| POST | `/api/smb/joinauth` | SmbService | 创建 AD 认证 |
| DELETE | `/api/smb/joinauth/{auth_id}` | SmbService | 删除 AD 认证 |
| GET | `/api/smb/usersgroups` | SmbService | 用户组列表 |
| POST | `/api/smb/usersgroups` | SmbService | 创建用户组 |
| DELETE | `/api/smb/usersgroups/{id}` | SmbService | 删除用户组 |

## RGW API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/rgw/daemon` | RgwDaemonService | 守护进程列表 |
| GET | `/api/rgw/user` | RgwUserService | 用户列表 |
| GET | `/api/rgw/user/{uid}` | RgwUserService | 用户详情 |
| POST | `/api/rgw/user` | RgwUserService | 创建用户 |
| PUT | `/api/rgw/user/{uid}` | RgwUserService | 更新用户 |
| DELETE | `/api/rgw/user/{uid}` | RgwUserService | 删除用户 |
| GET | `/api/rgw/bucket` | RgwBucketService | 桶列表 |
| GET | `/api/rgw/bucket/{bid}` | RgwBucketService | 桶详情 |
| POST | `/api/rgw/bucket` | RgwBucketService | 创建桶 |
| PUT | `/api/rgw/bucket/{bid}` | RgwBucketService | 更新桶 |
| DELETE | `/api/rgw/bucket/{bid}` | RgwBucketService | 删除桶 |
| GET | `/api/rgw/accounts` | RgwUserAccountsService | 账户列表 |
| POST | `/api/rgw/accounts` | RgwUserAccountsService | 创建账户 |
| GET | `/api/rgw/multisite/*` | RgwMultisiteService | 多站点配置 |
| GET | `/api/rgw/realm/*` | RgwRealmService | Realm 管理 |
| GET | `/api/rgw/zone/*` | RgwZoneService | Zone 管理 |
| GET | `/api/rgw/zonegroup/*` | RgwZonegroupService | Zonegroup 管理 |
| GET | `/api/rgw/site` | RgwSiteService | Site 信息 |
| GET | `/api/rgw/topic` | RgwTopicService | Topic 列表 |
| GET | `/api/rgw/topic/{topic}` | RgwTopicService | Topic 详情 |
| POST | `/api/rgw/topic` | RgwTopicService | 创建 Topic |
| DELETE | `/api/rgw/topic/{topic}` | RgwTopicService | 删除 Topic |

## 用户与角色 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/user` | UserService | 用户列表 |
| GET | `/api/user/{username}` | UserService | 用户详情 |
| POST | `/api/user` | UserService | 创建用户 |
| PUT | `/api/user/{username}` | UserService | 更新用户 |
| DELETE | `/api/user/{username}` | UserService | 删除用户 |
| POST | `/api/user/{username}/change_password` | UserService | 修改密码 |
| POST | `/api/user/validate_password` | UserService | 验证密码 |
| GET | `/api/role` | RoleService | 角色列表 |
| GET | `/api/role/{name}` | RoleService | 角色详情 |
| POST | `/api/role` | RoleService | 创建角色 |
| PUT | `/api/role/{name}` | RoleService | 更新角色 |
| DELETE | `/api/role/{name}` | RoleService | 删除角色 |
| GET | `/ui-api/scope` | ScopeService | 权限范围列表 |

## 配置 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/cluster_conf` | ConfigurationService | 配置列表 |
| GET | `/api/cluster_conf/{name}` | ConfigurationService | 配置详情 |
| PUT | `/api/cluster_conf/{name}` | ConfigurationService | 更新配置 |
| DELETE | `/api/cluster_conf/{name}` | ConfigurationService | 删除配置 |
| GET | `/api/settings` | SettingsService | 设置列表 |
| PUT | `/api/settings` | SettingsService | 更新设置 |
| GET | `/ui-api/standard_settings` | SettingsService | 标准设置 |
| GET | `/api/erasure_code_profile` | ErasureCodeProfileService | 纠删码配置文件 |
| GET | `/api/crush_rule` | CrushRuleService | CRUSH 规则 |

## MGR 模块 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/mgr/module` | MgrModuleService | 模块列表 |
| GET | `/api/mgr/module/{name}` | MgrModuleService | 模块详情 |
| PUT | `/api/mgr/module/{name}` | MgrModuleService | 更新模块配置 |
| POST | `/api/mgr/module/{name}/enable` | MgrModuleService | 启用模块 |
| POST | `/api/mgr/module/{name}/disable` | MgrModuleService | 禁用模块 |

## 监控 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/prometheus` | PrometheusService | Prometheus 数据查询 |
| GET | `/api/prometheus/rules` | PrometheusService | 告警规则 |
| GET | `/api/prometheus/rules_group` | PrometheusService | 规则组 |
| POST | `/api/prometheus/rules_group` | PrometheusService | 创建规则组 |
| DELETE | `/api/prometheus/rules_group` | PrometheusService | 删除规则组 |
| GET | `/api/prometheus/notifications` | PrometheusService | 通知配置 |
| GET | `/api/prometheus/silences` | PrometheusService | 静默列表 |
| POST | `/api/prometheus/silences` | PrometheusService | 创建静默 |
| DELETE | `/api/prometheus/silences/{silence_id}` | PrometheusService | 删除静默 |
| GET | `/api/grafana/validation/{uid}` | GrafanaService | Grafana 验证 |
| GET | `/ui-api/prometheus/alertmanager-api-host` | PrometheusService | Alertmanager 地址 |
| GET | `/ui-api/prometheus/prometheus-api-host` | PrometheusService | Prometheus 地址 |

## 多集群 API

| 方法 | 路径 | 前端Service | 说明 |
|---|---|---|---|
| POST | `/api/multi-cluster/set_config` | MultiClusterService | 设置集群配置 |
| GET | `/api/multi-cluster/get_config` | MultiClusterService | 获取集群配置 |
| DELETE | `/api/multi-cluster/delete_cluster/{name}` | MultiClusterService | 删除集群 |
| POST | `/api/multi-cluster/edit_cluster` | MultiClusterService | 编辑集群 |
| POST | `/api/multi-cluster/auth` | MultiClusterService | 认证 |
| POST | `/api/multi-cluster/reconnect_cluster` | MultiClusterService | 重连集群 |
| POST | `/api/multi-cluster/check_token_status` | MultiClusterService | 检查 token |

## 其他 API

| 方法 | 路径 | 前端服务 | 说明 |
|---|---|---|---|
| GET | `/api/logs/all` | LogsService | 审计日志 |
| GET | `/api/telemetry` | TelemetryService | 遥测信息 |
| POST | `/api/telemetry/off` | TelemetryService | 关闭遥测 |
| POST | `/api/telemetry/on` | TelemetryService | 开启遥测 |
| GET | `/api/perf_counters/{type}/{id}` | PerformanceCounterService | 性能计数器 |
| POST | `/api/feedback` | FeedbackService | 提交反馈 |
| GET | `/ui-api/feedback/api_key/exist` | FeedbackService | API Key 是否存在 |
| GET | `/api/service` | CephServiceService | 服务列表 |
| GET | `/api/daemon` | DaemonService | 守护进程列表 |
| GET | `/ui-api/orchestrator/*` | OrchestratorService | 编排器操作 |
| POST | `/ui-api/logging/js-error` | LoggingService | 前端日志上报 |
| GET | `/ui-api/login/custom_banner` | CustomLoginBannerService | 自定义登录横幅 |
| GET | `/ui-api/motd` | MotdService | 每日消息 |
| GET | `/ui-api/scope` | ScopeService | 权限范围 |
| GET | `/api/service/certificate` | CertificateService | 证书列表 |
| POST | `/api/service/certificate` | CertificateService | 上传证书 |
