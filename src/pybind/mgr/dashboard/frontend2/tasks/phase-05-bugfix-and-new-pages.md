# Phase 5: Bug修复、集成测试与新页面迁移 — 完成总结

## 完成时间
2026-04-25

## 1. 修改内容

### 1.1 Bug 修复（12+项）

Phase 4 完成后，前端存在多个与后端 API 对接的 bug，本次集中修复：

| # | Bug 描述 | 修复方案 |
|---|---------|---------|
| 1 | 登录 415 错误 | `apiClient` 默认 Accept 头从 `application/json` 恢复为 `application/vnd.ceph.api.v1.0+json`，Ceph RESTController 需解析版本号 |
| 2 | OSD 类型字段错误 | `up`/`in` 从 `boolean` 改为 `number` (0\|1)，`host` 改为 `OsdHost` 对象，`device_class` 从 `tree.device_class` 获取 |
| 3 | Config 字段名错误 | 后端返回 `default` 非 `default_value`，`value` 是 `Array<{section,value}>` 非简单字符串 |
| 4 | Crush Rule API 返回 415 | 所有 CRUD 操作需 `cephAcceptHeader(2, 0)`，`name`→`rule_name` |
| 5 | iSCSI 字段类型错误 | `disks`/`clients` 是数组用 `.length`，`status` 列改为 `acl_enabled` |
| 6 | Host 列表 API 400 | 需 `cephAcceptHeader(1, 2)` Accept 头 |
| 7 | Service 列表 API 415 | 需 `cephAcceptHeader(2, 0)` Accept 头 |
| 8 | RBD 列表返回分组格式 | 后端返回 `[{pool_name, value: [images]}]`，需展平处理 |
| 9 | RGW 用户列表返回 ID 数组 | 后端返回 `string[]`，需逐个获取详情 |
| 10 | RGW Bucket 列表 API 版本 | 需 `cephAcceptHeader(1, 1)` Accept 头 |
| 11 | Logs 接口格式错误 | 端点为 `/api/logs/all`，返回 `{clog:[], audit_log:[]}` |
| 12 | 登录 JSON 传参问题 | `apiClient.post('auth', { json: credentials })` 使用 JSON body，配合 v1.0 Accept 头 |

### 1.2 新增 `cephAcceptHeader()` 工具函数

`src/lib/api-client.ts` 新增 `cephAcceptHeader(major, minor)` 函数，生成 `application/vnd.ceph.api.vX.Y+json` 格式头。发现并记录了 Ceph 双路由架构：
- **APIRouter** (`/api/`): RESTController 端点，必须使用版本化 Accept 头
- **UIRouter** (`/ui-api/`): 使用 `uiApiClient`，普通 `application/json` 即可

### 1.3 新页面实现

| 页面 | 路由 | 文件 |
|------|------|------|
| NFS 导出列表 | `/block/nfs` | `features/block/nfs/pages/nfs-list.tsx` |
| NFS 导出创建表单 | (Dialog) | `features/block/nfs/components/nfs-export-form.tsx` |
| CephFS 列表 | `/cephfs` | `features/filesystem/pages/cephfs-list.tsx` |
| CephFS 详情 | (Dialog) | `features/filesystem/components/cephfs-detail.tsx` |
| 存储池列表 | `/cluster/pools` | `features/cluster/pools/pages/pool-list.tsx` |
| 存储池创建 | (Dialog) | `features/cluster/pools/components/pool-create-form.tsx` |
| 物理磁盘列表 | `/cluster/inventory` | `features/cluster/inventory/pages/inventory-list.tsx` |
| 配置管理 | `/cluster/config` | 修复 `features/cluster/config/pages/config-list.tsx` |
| 系统设置 | `/settings` | `features/settings/pages/settings-list.tsx` |
| 监控页面 | `/monitoring` | `features/monitoring/pages/monitoring-page.tsx` |
| RGW 用户创建 | (Dialog) | 增强 `features/rgw/user/pages/user-list.tsx` |
| RGW 桶创建 | (Dialog) | 增强 `features/rgw/bucket/pages/bucket-list.tsx` |

### 1.4 集成测试

新增 21 个测试文件，覆盖所有 API hooks 和核心服务：

| 测试文件 | 测试数 |
|----------|--------|
| `lib/auth.test.ts` | 4 |
| `lib/api-client.test.ts` | 4 |
| `types/osd.test.ts` | 3 |
| `features/cluster/config/api/config-display.test.ts` | 3 |
| `features/cluster/config/api/use-config.test.tsx` | 2 |
| `features/cluster/osd/api/use-osd.test.tsx` | 4 |
| `features/cluster/pools/api/use-pool.test.tsx` | 4 |
| `features/cluster/inventory/api/use-inventory.test.tsx` | 2 |
| `features/cluster/crush/api/use-crush-rule.test.tsx` | 3 |
| `features/cluster/services/api/use-service.test.tsx` | 4 |
| `features/cluster/monitor/api/use-monitor.test.tsx` | 1 |
| `features/cluster/log-viewer/api/use-logs.test.tsx` | 2 |
| `features/host/api/use-hosts.test.tsx` | 3 |
| `features/block/rbd/api/use-rbd.test.tsx` | 5 |
| `features/block/iscsi/api/use-iscsi.test.tsx` | 3 |
| `features/block/nfs/api/use-nfs.test.tsx` | 4 |
| `features/rgw/user/api/use-rgw-user.test.tsx` | 4 |
| `features/rgw/bucket/api/use-rgw-bucket.test.tsx` | 3 |
| `features/filesystem/api/use-cephfs.test.tsx` | 5 |
| `features/settings/api/use-settings.test.tsx` | 4 |
| `features/monitoring/api/use-monitoring.test.tsx` | 3 |

## 2. 对比设计文档的差异

### Phase 5 设计文档 (对象存储) vs 实际实现

| 设计文档要求 | 实际实现 | 差异原因 |
|-------------|---------|---------|
| RGW 守护进程列表 | ✅ 已实现 | — |
| RGW 用户管理 (完整表单：Caps/配额/子用户/S3密钥) | ⚠️ 部分实现 | 用户列表+创建 Dialog（uid/display_name/email），缺少 Caps/配额/子用户/S3密钥区域 |
| RGW 桶管理 (完整表单：版本控制/生命周期/存储类) | ⚠️ 部分实现 | 桶列表+创建 Dialog（bucket/owner），缺少版本控制/生命周期/存储类 |
| RGW 账户管理 | ❌ 未实现 | 优先级低，延后 |
| RGW 多站点 (Realm/Zonegroup/Zone) | ❌ 未实现 | 复杂度高，延后 |
| RGW Topic/存储类/概览 | ❌ 未实现 | 优先级低，延后 |

### Phase 6 设计文档 (文件系统) vs 实际实现

| 设计文档要求 | 实际实现 | 差异原因 |
|-------------|---------|---------|
| CephFS 列表+详情 (MDS/客户端/目录/子卷) | ⚠️ 部分实现 | 列表+详情 Dialog（MDS Ranks/Standbys/Pools/Clients 标签页），缺少子卷/快照计划/镜像 |
| NFS 集群+导出列表+创建/编辑 | ⚠️ 部分实现 | 导出列表+创建表单，缺少集群管理、编辑/删除表单 |
| SMB 管理 | ❌ 未实现 | 优先级低，延后 |

### Phase 7 设计文档 (存储池) vs 实际实现

| 设计文档要求 | 实际实现 | 差异原因 |
|-------------|---------|---------|
| 存储池列表 (类型/PG/使用率) | ✅ 已实现 | — |
| 存储池创建 (完整表单：EC配置/PG计算器/设备类/CRUSH规则) | ⚠️ 部分实现 | 基础创建表单（名称/类型/pg_num/size/application），缺少 PG 计算器、EC 配置文件选择、设备类选择、压缩模式 |
| 存储池编辑 | ❌ 未实现 | 延后 |
| PG 计算器 | ❌ 未实现 | 复杂度高，延后 |

### Phase 9 设计文档 (监控告警) vs 实际实现

| 设计文档要求 | 实际实现 | 差异原因 |
|-------------|---------|---------|
| Grafana 嵌入面板 | ✅ 已实现 | iframe 嵌入 + 未配置友好提示 |
| 活跃告警列表 (严重性颜色/筛选) | ⚠️ 部分实现 | 告警列表展示，缺少严重性颜色样式和筛选 |
| 告警规则管理 | ❌ 未实现 | 延后 |
| Silences 管理 (创建/编辑/删除) | ⚠️ 部分实现 | Silences 列表展示，缺少创建/编辑表单 |

### 设计文档外的新增内容

| 功能 | 说明 |
|------|------|
| 物理磁盘列表页 | 设计文档中无此页面，但 Angular 版本存在，本次补齐 |
| `cephAcceptHeader()` 工具函数 | 设计文档未提及，实际开发中发现 Ceph API 版本化需求后新增 |
| `uiApiClient` 分离 | 设计文档未区分 APIRouter/UIRouter，实际发现双路由架构后新增 |
| RGW 用户编辑 hook | `useUpdateRgwUser()` 新增 |

## 3. 迁移页面

| 页面 | Angular 路径 | React 路径 | 迁移状态 |
|------|-------------|-----------|---------|
| NFS 导出列表 | `/nfs-ganesha` | `/#/block/nfs` | 列表+创建 |
| CephFS 列表 | `/cephfs` | `/#/cephfs` | 列表+详情 |
| CephFS 详情 | `/cephfs/{id}` | Dialog 内标签页 | 部分（缺子卷/快照） |
| 存储池列表 | `/pool` | `/#/cluster/pools` | 列表+创建 |
| 物理磁盘 | `/inventory` | `/#/cluster/inventory` | 完整 |
| 配置管理 | `/configuration` | `/#/cluster/config` | 完整（修复后） |
| 系统设置 | `/settings` | `/#/settings` | 完整 |
| 监控告警 | `/monitoring` | `/#/monitoring` | Grafana+Alerts+Silences |
| RGW 用户 | `/rgw/user` | `/#/rgw/user` | 列表+创建 |
| RGW 桶 | `/rgw/bucket` | `/#/rgw/bucket` | 列表+创建 |

## 4. 调用接口 API

### `/api/` 端点 (apiClient, 版本化 Accept 头)

| 端点 | 方法 | Accept 版本 | 用途 |
|------|------|------------|------|
| `/api/auth` | POST | v1.0 (默认) | 登录 |
| `/api/auth/check` | POST | v1.0 (默认) | Token 校验 |
| `/api/auth/logout` | POST | v1.0 (默认) | 登出 |
| `/api/nfs-ganesha/export` | GET | v1.0 (默认) | NFS 导出列表 |
| `/api/nfs-ganesha/export` | POST | v2.0 | 创建 NFS 导出 |
| `/api/nfs-ganesha/export/{id}` | DELETE | v2.0 | 删除 NFS 导出 |
| `/api/cephfs` | GET | v1.0 (默认) | CephFS 列表 |
| `/api/cephfs/{fsId}` | GET | v1.0 (默认) | CephFS 详情 |
| `/api/cephfs/{fsId}/clients` | GET | v1.0 (默认) | CephFS 客户端 |
| `/api/cephfs/{fsId}/client/{id}` | DELETE | v1.0 (默认) | 驱逐客户端 |
| `/api/pool` | GET | v1.0 (默认) | 存储池列表 |
| `/api/pool` | POST | v1.0 (默认) | 创建存储池 |
| `/api/pool/{name}` | DELETE | v1.0 (默认) | 删除存储池 |
| `/api/host/{name}/inventory` | GET | v1.0 (默认) | 主机磁盘清单 |
| `/api/config` | GET | v1.0 (默认) | 配置列表 |
| `/api/config/{name}` | PUT | v1.0 (默认) | 更新配置 |
| `/api/settings` | GET | v1.0 (默认) | 系统设置列表 |
| `/api/settings/{name}` | PUT | v1.0 (默认) | 更新设置 |
| `/api/settings/{name}` | DELETE | v1.0 (默认) | 重置设置 |
| `/api/grafana/url` | GET | v1.0 (默认) | Grafana URL |
| `/api/prometheus` | GET | v1.0 (默认) | Prometheus 告警 |
| `/api/prometheus/silences` | GET | v1.0 (默认) | Prometheus Silences |
| `/api/rgw/user` | PUT | v1.0 (默认) | 创建 RGW 用户 |
| `/api/rgw/user/{uid}` | POST | v1.0 (默认) | 编辑 RGW 用户 |
| `/api/rgw/bucket` | PUT | v1.0 (默认) | 创建 RGW 桶 |

### `/ui-api/` 端点 (uiApiClient, application/json)

| 端点 | 方法 | 用途 |
|------|------|------|
| `/ui-api/nfs-ganesha/status` | GET | NFS 状态检查 |
| `/ui-api/cephfs/{fsId}/tabs` | GET | CephFS 标签页数据 |
| `/ui-api/host/inventory` | GET | 主机磁盘清单汇总 |

## 5. 测试情况

### 测试统计

| 指标 | 数值 |
|------|------|
| 测试文件总数 | 29 |
| 测试用例总数 | 155 |
| 全部通过 | ✅ |
| TypeScript 编译 | ✅ 无错误 |
| Vite 构建 | ✅ 成功 |

### 测试覆盖范围

- **核心服务**: auth (4), api-client (4), format (39), health (14), api-version (7), app-store (3), auth-store (5), permissions (5), osd types (3), config-display (3)
- **Cluster 模块**: osd (4), config (2), pool (4), inventory (2), crush-rule (3), service (4), monitor (1), logs (2), hosts (3)
- **Block 模块**: rbd (5), iscsi (3), nfs (4)
- **RGW 模块**: user (4), bucket (3)
- **Filesystem 模块**: cephfs (5)
- **Settings 模块**: settings (4)
- **Monitoring 模块**: monitoring (3)
- **路由**: auth-guard (5), placeholder (2)

### 测试模式

所有 API hook 测试采用统一模式：
1. Mock `apiClient`/`uiApiClient` 的 HTTP 方法 (`get`/`post`/`put`/`delete`)
2. 使用 `@testing-library/react` 的 `renderHook` + `waitFor`
3. 验证：调用了正确的 API 端点、传入了正确的参数、返回数据解析正确
4. Mutation 测试验证：调用了正确的 HTTP 方法和请求体

## 6. 存在问题

1. **RGW 表单不完整**: 用户创建表单仅含 uid/display_name/email，缺少 Caps 权限区、配额区、子用户区、S3 密钥区。桶创建表单仅含 bucket/owner，缺少版本控制/生命周期/存储类。
2. **存储池创建表单简化**: 缺少 PG 计算器、EC 配置文件选择、设备类选择、CRUSH 规则选择、压缩模式等高级配置。
3. **CephFS 子功能缺失**: 缺少子卷管理、快照计划、CephFS 镜像管理。
4. **NFS 管理不完整**: 缺少 NFS 集群管理、导出编辑/删除表单。
5. **监控告警功能不完整**: 缺少告警规则管理、Silences 创建/编辑表单、告警严重性颜色样式。
6. **未覆盖的 RGW 功能**: 账户管理、多站点 (Realm/Zonegroup/Zone)、Topic、存储类、概览仪表盘均未实现。
7. **SMB 管理未开始**: 所有 SMB 相关页面（集群/共享/AD认证/用户组）均未实现。
8. **设置页面分组**: 当前按前缀简单分组，可能需要更精确的分类映射。

## 7. 后续计划

1. **Phase 6 补全**: 完善 CephFS 子卷管理、快照计划；完善 NFS 集群管理、导出编辑表单
2. **Phase 7 补全**: 存储池编辑表单、PG 计算器、EC 配置文件管理
3. **Phase 8 用户管理**: Dashboard 用户/角色管理、权限体系
4. **Phase 9 监控完善**: 告警规则管理、Silences 创建/编辑表单
5. **RGW 表单完善**: 用户 Caps/配额/子用户/S3 密钥、桶版本控制/生命周期
6. **RGW 高级功能**: 多站点、账户、Topic、概览仪表盘
7. **SMB 管理**: 全部 SMB 页面
8. **E2E 测试**: 启动 Playwright 端到端测试覆盖

## 8. 遗留 Bug

| # | Bug | 严重程度 | 状态 |
|---|-----|---------|------|
| 1 | 设置页面 Boolean 类型使用 Checkbox 而非 Switch 组件（shadcn 无 Switch） | 低 | 已用 Checkbox 替代，功能正确 |
| 2 | RGW 用户/桶删除操作未确认权限 | 中 | 删除前有确认弹窗，但未检查 RGW 服务状态 |
| 3 | NFS 导出创建表单未处理 FSAL 类型选择联动 | 中 | FSAL 选择后应联动显示不同配置字段 |
| 4 | 监控页面 Grafana iframe 可能被 X-Frame-Options 阻止 | 中 | 已处理加载错误提示，但无法解决服务端限制 |
| 5 | CephFS 详情 Dialog 客户端驱逐无二次确认 | 中 | 需添加确认弹窗 |
| 6 | 存储池创建未校验 PG 数与 OSD 数的关系 | 低 | 缺少 PG 计算器辅助 |
| 7 | 物理磁盘列表主机筛选为前端过滤 | 低 | 数据量小时可接受，大集群需后端分页 |
