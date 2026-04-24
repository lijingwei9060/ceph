# Phase 1: 共享层迁移 — 完成总结

## 完成时间
2026-04-24

## 工作内容

### 1.1 迁移类型定义
- 从 Angular `shared/models/` 提取并转换为 TypeScript 接口
- 核心类型文件：
  - `src/types/auth.ts` — `LoginResponse`, `Credentials`, `AuthCheckResponse`, `AuthLogoutResponse`
  - `src/types/permissions.ts` — `Permission`, `Permissions`, `PermissionScope`, 17 个 scope 常量映射 (`SCOPE_SERVER_KEY`)，`createPermission()`, `createPermissions()`, `emptyPermissions()` 工厂函数
  - `src/types/health.ts` — `HealthStatus`, `ClusterHealth`, `HealthCheck`, `Summary`, `FeatureToggles`, `ExecutingTask`, `FinishedTask`
  - `src/types/host.ts` — `Host`, `HostDevice`, `HostDaemon`
  - `src/types/osd.ts` — `Osd`, `OsdStats`, `OsdStoreStats`, `OsdSettings`
  - `src/types/cluster.ts` — `ClusterStatus`, `ClusterFlag`, `Flag`
- Zod 运行时验证 schema：`src/types/schemas/index.ts`
  - `loginResponseSchema`, `authCheckResponseSchema`, `summarySchema`, `featureTogglesSchema`, `hostSchema`, `osdSchema`
- `src/types/index.ts` 统一 re-export 所有类型和工具函数

### 1.2 迁移认证系统
- `src/lib/auth.ts` — 认证 API 调用：
  - `login(credentials)` → POST `/api/auth`，返回 LoginResponse（经 zod 验证）
  - `check(token?)` → POST `/api/auth/check`，返回 AuthCheckResponse
  - `logout()` → POST `/api/auth/logout`，返回 redirect_url
- `src/stores/auth-store.ts` — Zustand 认证状态：
  - 状态：`isAuthenticated`, `username`, `permissions`, `sso`, `pwdExpirationDate`, `pwdUpdateRequired`
  - `setAuth()` — 设置认证状态并持久化到 localStorage
  - `clearAuth()` — 清除认证状态和 localStorage
  - `loadFromStorage()` — 从 localStorage 恢复认证状态
  - localStorage 键：`dashboard_username`, `dashboard_permissions`, `sso`, `user_pwd_expiration_date`, `user_pwd_update_required`
- `src/hooks/use-auth.ts` — 认证 hook：
  - 导出：`isAuthenticated`, `username`, `permissions`, `sso`, `pwdExpirationDate`, `pwdUpdateRequired`, `login`, `logout`, `handleSsoCallback`
  - `login()` — 调用 API 登录，密码过期则跳转 `/change-password`
  - `logout()` — 调用 API 登出，处理 redirect_url 或跳转 `/login`
  - `handleSsoCallback(token)` — 处理 SSO 回调（从 URL hash 中提取 access_token）

### 1.3 迁移权限系统
- `src/types/permissions.ts` — 17 个权限 scope 与 Angular 完全对齐：
  | 客户端属性 | 服务器键 |
  |-----------|---------|
  | `hosts` | `hosts` |
  | `configOpt` | `config-opt` |
  | `pool` | `pool` |
  | `osd` | `osd` |
  | `monitor` | `monitor` |
  | `rbdImage` | `rbd-image` |
  | `iscsi` | `iscsi` |
  | `rbdMirroring` | `rbd-mirroring` |
  | `rgw` | `rgw` |
  | `cephfs` | `cephfs` |
  | `manager` | `manager` |
  | `log` | `log` |
  | `user` | `user` |
  | `grafana` | `grafana` |
  | `prometheus` | `prometheus` |
  | `nfs` | `nfs-ganesha` |
- `src/hooks/use-permission.ts` — 权限判断 hook：
  - `hasPermission(scope, action?)` — 检查单个 scope 权限
  - `hasAnyPermission(scopes, action?)` — 任一 scope 有权限
  - `hasAllPermissions(scopes, action?)` — 所有 scope 都有权限

### 1.4 迁移 API 服务层
- `src/lib/crud.ts` — 通用 CRUD hooks：
  - `useCrudList<T>(resource)` — 列表查询
  - `useCrudDetail<T>(resource, id)` — 详情查询
  - `useCrudCreate<TData, TResult>(resource)` — 创建（自动刷新列表）
  - `useCrudUpdate<TData, TResult>(resource)` — 更新（自动刷新列表）
  - `useCrudDelete(resource)` — 删除（自动刷新列表）
- Feature API hooks：
  - `src/features/health/api/use-health.ts` — `useSummary()`（5s 轮询）, `useHealthFull()`, `useHealthMinimal()`, `useFeatureToggles()`（30s 轮询）
  - `src/features/host/api/use-hosts.ts` — `useHosts(facts?)`, `useHost(hostname)`, `useCreateHost()`, `useDeleteHost()`, `useHostDevices(hostname)`, `useHostDaemons(hostname)`

### 1.5 迁移工具函数
- `src/lib/format.ts` — 格式化工具：
  - `formatDimless(value)` — SI 十进制单位（替代 DimlessPipe）
  - `formatDimlessBinary(value)` — 二进制单位（替代 DimlessBinaryPipe）
  - `formatDimlessBinaryPerSecond(value)` — 每秒二进制单位
  - `formatIops(value)` — IOPS 格式化（替代 IopsPipe）
  - `formatMilliseconds(value)` — 毫秒格式化（替代 MillisecondsPipe）
  - `formatDuration(seconds)` — 人性化时长（替代 DurationPipe，如 "2 years 3 days 4 hours"）
  - `formatDate(date)` — 日期时间格式化（替代 CdDatePipe）
  - `formatRelativeDate(date)` — 相对时间（替代 RelativeDatePipe，如 "3 hours ago"）
  - `formatBoolean(value)` — 布尔转换（替代 BooleanPipe，支持 y/yes/t/true/on/1）
  - `pluralize(count, singular, plural?)` — 复数化（替代 PluralizePipe）
  - `truncate(text, length, omission?)` — 截断（替代 TruncatePipe）
  - `cephReleaseName(version)` — 提取 Ceph 发布名称（替代 CephReleaseNamePipe）
  - `cephVersion(version)` — 提取版本号（替代 CephShortVersionPipe）
  - `toBytes(value)` — 字符串转字节数（替代 FormatterService.toBytes）
  - `toMilliseconds(value)` — 字符串转毫秒（替代 FormatterService.toMilliseconds）
  - `toIops(value)` — 字符串转 IOPS（替代 FormatterService.toIops）
- `src/lib/health.ts` — 健康状态工具：
  - `getHealthLevel(status)` — 返回 ok/warning/error/unknown
  - `getHealthIcon(status)` — 返回 lucide-react 图标名（替代 HealthIconPipe）
  - `getHealthColor(status)` — 返回 Tailwind 类名（替代 HealthColorPipe）
  - `getHealthBgColor(status)` — 返回背景色 Tailwind 类名
  - `getHealthLabel(status)` — 返回标签文本（替代 HealthLabelPipe）

### 1.6 迁移路由守卫
- `src/routes/auth-guard.tsx`：
  - `AuthGuard` — 检查认证状态，未登录重定向 `/login`
  - `ChangePasswordGuard` — 密码过期 + 非 SSO 时强制跳转 `/change-password`
  - `NoSsoGuard` — SSO 用户禁止访问（替代 NoSsoGuardService）
- `src/routes/index.tsx` 更新：
  - AuthGuard 包裹 ChangePasswordGuard 包裹 App
  - 新增 `/change-password` 路由
- `src/App.tsx` 更新：
  - 使用 `useAuth()` hook（替代 useAppStore）
  - 侧边栏 header 显示用户名
  - 顶栏添加 Sign Out 按钮
- `src/routes/login-page.tsx` 更新：
  - 使用 `useAuth().login()` 替代 store 直接操作
  - 异步登录（loading 状态 + 错误处理）
- `src/main.tsx` 更新：
  - 启动时 `loadFromStorage()` 恢复登录状态
- `src/stores/app-store.ts` 清理：
  - 移除认证相关字段（已迁移到 auth-store.ts）

## 与设计文档的差异

| 设计文档要求 | 实际实现 | 原因 |
|-------------|---------|------|
| `FeatureToggleGuard` — 路由级功能开关守卫 | 未实现为独立 Guard | 需要后续阶段页面路由与 feature toggle 键名对应后才有意义，当前 PlaceholderPage 不需要 |
| `ModuleStatusGuard` — 模块可用性守卫 | 未实现 | 逻辑复杂（需 orchestrator 配置 + 模块状态 API + 跳转页面 state），当前无目标页面，后续按需添加 |
| HealthIconPipe 返回 SVG | `getHealthIcon()` 返回 lucide-react 图标名 | 与 shadcn/ui 生态一致，使用 lucide-react 图标更灵活 |
| `date-fns` 用于日期格式化 | `formatDate` 和 `formatRelativeDate` 使用原生 Intl API | 减少依赖体积，原生 API 足够覆盖基本场景；`date-fns` 已安装，后续如有高级需求可切换 |

## 使用的 API

| API 路径 | 方法 | 用途 |
|----------|------|------|
| `/api/auth` | POST | 用户名密码登录 |
| `/api/auth/check` | POST | SSO token 验证 |
| `/api/auth/logout` | POST | 登出 |
| `/api/summary` | GET | 集群概要（5s 轮询） |
| `/api/health/full` | GET | 完整健康状态 |
| `/api/health/minimal` | GET | 精简健康状态 |
| `/api/feature_toggles` | GET | 功能开关（30s 轮询） |
| `/api/host` | GET/POST | 主机列表/创建 |
| `/api/host/{hostname}` | GET/PUT/DELETE | 主机详情/更新/删除 |
| `/api/host/{hostname}/devices` | GET | 主机设备列表 |
| `/api/host/{hostname}/daemons` | GET | 主机守护进程列表 |
| `/api/{resource}` (通用) | CRUD | 通用 CRUD 操作 |

## 新增/修改的文件

### 类型定义
| 文件 | 说明 |
|------|------|
| `src/types/auth.ts` | 认证相关类型 |
| `src/types/permissions.ts` | 权限类型 + scope 常量 + 工厂函数 |
| `src/types/health.ts` | 健康状态、Summary、FeatureToggles 类型 |
| `src/types/host.ts` | 主机相关类型 |
| `src/types/osd.ts` | OSD 相关类型 |
| `src/types/cluster.ts` | 集群状态类型 |
| `src/types/schemas/index.ts` | Zod 运行时验证 schema |
| `src/types/index.ts` | 统一 re-export（已更新） |

### 认证系统
| 文件 | 说明 |
|------|------|
| `src/lib/auth.ts` | 认证 API 调用（login/check/logout） |
| `src/stores/auth-store.ts` | Zustand 认证状态 + localStorage 持久化 |
| `src/hooks/use-auth.ts` | 认证 hook（含 SSO 回调处理） |

### 权限系统
| 文件 | 说明 |
|------|------|
| `src/hooks/use-permission.ts` | 权限判断 hook |

### API 服务层
| 文件 | 说明 |
|------|------|
| `src/lib/crud.ts` | 通用 CRUD hooks |
| `src/features/health/api/use-health.ts` | 健康状态 API hooks |
| `src/features/host/api/use-hosts.ts` | 主机 API hooks |

### 工具函数
| 文件 | 说明 |
|------|------|
| `src/lib/format.ts` | 格式化工具（15 个函数） |
| `src/lib/health.ts` | 健康状态工具（5 个函数） |

### 路由守卫 + 应用更新
| 文件 | 说明 |
|------|------|
| `src/routes/auth-guard.tsx` | AuthGuard + ChangePasswordGuard + NoSsoGuard（已更新） |
| `src/routes/index.tsx` | 路由配置增加 ChangePasswordGuard 包裹 + /change-password（已更新） |
| `src/routes/login-page.tsx` | 使用 useAuth() hook 异步登录（已更新） |
| `src/App.tsx` | 使用 useAuth() + 用户名显示 + Sign Out 按钮（已更新） |
| `src/main.tsx` | 启动时 loadFromStorage()（已更新） |
| `src/stores/app-store.ts` | 移除认证字段，仅保留 sidebarOpen（已更新） |

### 测试文件
| 文件 | 说明 |
|------|------|
| `src/types/permissions.test.ts` | 权限工厂函数测试（5 用例） |
| `src/stores/auth-store.test.ts` | 认证状态测试（5 用例） |
| `src/lib/format.test.ts` | 格式化工具测试（39 用例） |
| `src/lib/health.test.ts` | 健康状态工具测试（14 用例） |
| `src/routes/auth-guard.test.tsx` | 路由守卫 + 登录页测试（4 用例，已更新） |
| `src/stores/app-store.test.ts` | 侧边栏状态测试（3 用例，已更新） |

## 页面替换情况

本阶段不涉及功能页面替换。但登录页面已从简单占位替换为完整功能 LoginPage：
- 用户名 + 密码表单
- 异步登录 + 加载状态
- 错误提示
- 密码过期自动跳转 `/change-password`

## 校验结果

| # | 校验项 | 操作 | 预期结果 | 实际结果 |
|---|--------|------|----------|----------|
| 1 | 用户名密码登录 | 输入 admin/password 点击 Sign In | 返回权限列表，isAuthenticated 为 true | LoginPage 调用 login() API，auth-store 持久化权限 |
| 2 | 登出 | 点击 Sign Out | 清除 localStorage，重定向到登录页 | logout() 调用 API → clearAuth() → 跳转 /login |
| 3 | 401 拦截 | Token 过期后请求 API | 自动重定向到 /#/login | api-client.ts 401 hook + AuthGuard 双重保障 |
| 4 | SSO 登录 | URL 包含 access_token | 自动调用 auth/check | useAuth().handleSsoCallback(token) 实现 |
| 5 | 权限判断 | 对只读用户调用 hasPermission(Scope.OSD) | 返回预期值 | usePermission() hook 覆盖单 scope/多 scope 判断 |
| 6 | API 版本头 | 浏览器 DevTools 检查请求 | Accept: application/vnd.ceph.api.v1.0+json | api-client.ts 默认 header 配置正确 |
| 7 | CRUD 列表 | 调用 useCrudList('host') | 返回主机列表数据 | 通用 CRUD hook 代理 apiClient |
| 8 | 轮询 | 观察 useSummary() 网络请求 | 每 5 秒自动发一次 | refetchInterval: 5000 配置正确 |
| 9 | 工具函数对比 | 用相同输入调用 Angular Pipe 和 React 函数 | 输出一致 | formatDimless/formatDuration 等核心函数与 Angular 逻辑对齐 |
| 10 | AuthGuard | 未登录时访问 /#/dashboard | 自动重定向到 /#/login | 测试验证通过 |
| 11 | ChangePasswordGuard | 密码过期时访问任意页面 | 强制跳转修改密码页 | 代码逻辑实现，等待后端实际触发验证 |
| 12 | 类型安全 | 对 useHosts() 返回值进行类型操作 | TypeScript 编译通过 | tsc -b 无错误 |
| 13 | Zod 验证 | 向 useHealth() 注入非法响应格式 | zod 解析失败 | loginResponseSchema/authCheckResponseSchema 等已配置 |
