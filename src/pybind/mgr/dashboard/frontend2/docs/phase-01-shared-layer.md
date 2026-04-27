# Phase 1: 共享层迁移

## 工作目标

迁移认证、权限、类型定义、API 服务层和工具函数，为所有页面模块提供可复用的基础设施。完成后，任何页面模块都可以直接调用 `useAuth()`、`usePermission()`、`useHealth()` 等 hooks 和 `formatDimless()` 等工具函数，无需再依赖 Angular 代码。

完成标志：在 React 应用中可以完成完整的登录→获取权限→调用 API→登出流程，且工具函数输出与 Angular 版本一致。

## 工作内容

### 1.1 迁移类型定义

- 将 Angular `shared/models/` 下的模型文件转换为 TypeScript 接口
- 重点类型：
  - `HealthInterface` → `src/types/health.ts`
  - `HostInterface` → `src/types/host.ts`
  - `OsdModel` → `src/types/osd.ts`
  - `ClusterModel` → `src/types/cluster.ts`
  - `Permissions` → `src/types/permissions.ts`
  - `LoginResponse` → `src/types/auth.ts`
- 使用 `zod` 为关键 API 响应创建运行时验证 schema（`src/types/schemas/`）
- 命名规范：接口以 `I` 前缀（如 `IHost`）或无前缀（如 `HealthStatus`），与 zod schema 导出名区分

### 1.2 迁移认证系统

- 创建 `src/lib/auth.ts`：
  - `login(username, password)` → POST `/api/auth`
  - `check(token?)` → POST `/api/auth/check`
  - `logout()` → POST `/api/auth/logout`
- 创建 `src/stores/auth-store.ts`（Zustand）：
  - 状态：`username`、`permissions`、`sso`、`passwordExpiresAt`、`isAuthenticated`
  - 登录成功后持久化到 `localStorage`（`dashboard_username`、`dashboard_permissions`、`sso`）
- 创建 `src/hooks/use-auth.ts`：
  - 导出：`isAuthenticated`、`user`、`permissions`、`login`、`logout`
- SAML2/OAuth2 重定向处理：
  - 监听 URL 中的 SSO 回调参数
  - 自动调用 `/api/auth/check` 验证 SSO session
- 密码过期强制重定向逻辑

### 1.3 迁移权限系统

- 将 `Permissions` 类迁移为 TypeScript 接口 + 常量
- 创建 `src/hooks/use-permission.ts`：
  - `hasPermission(scope)` → 检查当前用户是否拥有指定权限
  - 替代 Angular 的 `AuthStorageDirective` 权限判断
- 创建 `src/types/permissions.ts`：
  - 权限范围常量：`Scope.HOSTS`、`Scope.OSD`、`Scope.RGW` 等
  - 所有 scope 值从 `GET /ui-api/scope` 获取或硬编码（需确认）

### 1.4 迁移 API 服务层

- 为每个后端 API 服务创建 TanStack Query hooks，统一放在各 feature 目录的 `api/` 下：
  - `src/features/health/api/use-health.ts` → `useHealth()`
  - `src/features/host/api/use-hosts.ts` → `useHosts()`、`useHost(hostname)`、`useCreateHost()` 等
- 每个 API 一个 hook 文件，使用 `useQuery`（读）和 `useMutation`（写）
- 迁移轮询逻辑：
  - `SummaryService` (5s) → `useQuery({ refetchInterval: 5000 })`
  - `FeatureTogglesService` (30s) → `useQuery({ refetchInterval: 30000 })`
- 迁移 DataGatewayService 的通用 CRUD 模式，创建 `src/lib/crud.ts`：
  - `useCrudList(resource)` → 通用列表查询
  - `useCrudDetail(resource, id)` → 通用详情查询
  - `useCrudCreate(resource)` → 通用创建
  - `useCrudUpdate(resource)` → 通用更新
  - `useCrudDelete(resource)` → 通用删除

### 1.5 迁移工具函数

- `src/lib/format.ts`：
  - `formatDimless(value)` → 替代 DimlessPipe
  - `formatDimlessBinary(value)` → 替代 DimlessBinaryPipe
  - `formatIops(value)` → 替代 IopsPipe
  - `formatDuration(ms)` → 替代 DurationPipe/MillisecondsPipe（使用 `date-fns`）
  - `formatDate(date)` → 替代 CdDatePipe（使用 `date-fns`）
  - `formatRelativeDate(date)` → 替代 RelativeDatePipe
  - `formatBoolean(value)` → 替代 BooleanPipe
  - `pluralize(count, singular, plural)` → 替代 PluralizePipe
  - `truncate(text, length)` → 替代 TruncatePipe
  - `cephReleaseName(version)` → 替代 CephReleaseNamePipe
  - `cephVersion(version)` → 替代 CephVersionPipe
- `src/lib/health.ts`：
  - `getHealthIcon(status)` → 替代 HealthIconPipe（返回图标名或 SVG）
  - `getHealthColor(status)` → 替代 HealthColorPipe（返回 Tailwind 类名）
  - `getHealthLabel(status)` → 替代 HealthLabelPipe

### 1.6 迁移路由守卫

- 创建 `src/routes/guards.tsx`：
  - `AuthGuard` → 检查认证状态，未登录重定向 `/#/login`
  - `ChangePasswordGuard` → 检查密码修改要求，强制跳转修改密码页
  - `FeatureToggleGuard` → 检查功能开关，未启用则显示 404
  - `ModuleStatusGuard` → 检查模块可用性
  - `NoSsoGuard` → SSO 用户限制访问

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 用户名密码登录 | 调用 `login('admin', 'password')` | 返回权限列表，`isAuthenticated` 为 true |
| 2 | 登出 | 调用 `logout()` | 清除 localStorage，重定向到登录页 |
| 3 | 401 拦截 | Token 过期后请求 API | 自动重定向到 `/#/login` |
| 4 | SSO 登录 | 配置 SAML2 后访问 SSO 入口 | 重定向到 IdP → 回调 → 自动登录 |
| 5 | 权限判断 | 对只读用户调用 `hasPermission(Scope.HOSTS)` | 返回预期值，UI 隐藏写操作按钮 |
| 6 | API 版本头 | 用浏览器 DevTools 检查请求 | 请求头包含 `Accept: application/vnd.ceph.api.v1.0+json` |
| 7 | CRUD 列表 | 调用 `useCrudList('host')` | 返回主机列表数据 |
| 8 | CRUD 创建 | 调用 `useCrudCreate('host').mutate(...)` | 创建成功，列表自动刷新 |
| 9 | 轮询 | 观察 `useSummary()` 的网络请求 | 每 5 秒自动发一次请求 |
| 10 | 工具函数对比 | 用相同输入分别调用 Angular Pipe 和 React 函数 | 输出完全一致（至少精确到小数点后 2 位） |
| 11 | AuthGuard | 未登录时访问 `/#/dashboard` | 自动重定向到 `/#/login` |
| 12 | ChangePasswordGuard | 密码过期时访问任意页面 | 强制跳转修改密码页 |
| 13 | 类型安全 | 对 `useHosts()` 返回值进行类型操作 | TypeScript 编译通过，类型推断正确 |
| 14 | Zod 验证 | 向 `useHealth()` 注入非法响应格式 | zod 解析失败，不会静默返回错误数据 |
