# Phase 2: 核心框架页面迁移 — 完成总结

## 完成时间
2026-04-24

## 工作内容

### 2.1 迁移主布局（WorkbenchLayout）
- `src/components/layouts/workbench-layout.tsx` — 主应用布局：
  - 使用 `SidebarProvider` + shadcn/ui `Sidebar` 组件实现侧边栏
  - `SidebarHeader` 显示应用名称 + 健康状态徽章（实时来自 `useSummary()`）
  - `SidebarContent` 渲染 `NAV_CONFIG` 中的菜单树，支持嵌套子菜单
  - 顶部栏：`SidebarTrigger` + Bell 图标通知按钮 + 用户名 + Sign Out 按钮
  - `Outlet` 渲染子路由内容
  - `MotdToast` 组件显示集群公告通知
  - `Toaster` 组件显示操作反馈通知
- `src/components/layouts/login-layout.tsx` — 登录布局：
  - 居中 Flex 容器，内容居中显示

### 2.2 迁移侧边栏导航
- `src/routes/nav-config.ts` — 完整导航配置：
  - 17 项菜单树（Dashboard、Cluster 子菜单、Pools、Block 子菜单、NFS、CephFS、Object Gateway 子菜单）
  - 每个菜单项支持：`key`、`label`、`path`、`icon`、`permission`、`permissionMatchAll`、`featureToggle`、`featureToggleMatchAll`、`children`
  - `isItemVisible()` 函数根据权限和功能开关判断菜单项是否显示
  - 支持 `FeatureToggleKey` 类型：`rbd`、`mirroring`、`iscsi`、`cephfs`、`rgw`、`nfs`
- 权限检查：调用 `usePermission().hasPermission()` 判断用户是否有权访问
- 功能开关检查：调用 `useFeatureToggles()` 判断特性是否启用

### 2.3 迁移登录页面
- `src/features/auth/pages/login.tsx` — 完整功能登录页：
  - React Hook Form + Zod 验证：用户名和密码非空验证
  - 自定义 banner：从 `GET /api/ui-api/login/custom_banner` 获取并显示
  - 异步登录：`useAuth().login()` 调用，带 loading 状态
  - 失败提示：Zod 验证错误实时显示，登录失败显示 `auth.loginFailed` 翻译文本
  - 使用 shadcn/ui：`Card`、`Input`、`Label`、`Button` 组件
- 旧 `src/routes/login-page.tsx` 已删除

### 2.4 迁移仪表盘概览页
- `src/features/dashboard/pages/overview.tsx` — Dashboard 概览页：
  - 页面标题 + 版本号显示
  - 健康状态徽章（来自 `useSummary().health_status`）
  - 三个统计卡片：Cluster Status、Capacity（Used/Total）、Client IOPS
  - 两个饼图（Recharts）：PG Status（Clean/Working/Warning/Unknown）、Objects（Healthy/Misplaced/Degraded）
  - 容量数据当前为模板数据（待后续接入真实 API）
  - `formatDimlessBinary()` 格式化存储容量
  - 国际化支持：所有标签使用 `t()` 函数

### 2.5 迁移通知系统（MOTD）
- `src/features/health/api/use-motd.ts` — MOTD 查询 hook：
  - `useMotd()` — GET `/api/ui-api/login/motd`，60 秒轮询
  - 返回 `motd.message`、`motd.severity`、`motd.md5`
- `src/features/health/components/motd-toast.tsx` — MOTD 通知组件：
  - 使用 `sonner` 库显示 Toast 通知
  - 严重程度映射：`danger` → "Important Notice"（不可关闭）、`warning` → "Warning"（10 秒后自动关闭）、`info` → "Notice"
  - localStorage 去重：相同 `severity:md5` 不重复显示
  - 持久化已关闭的 MOTD 版本

### 2.6 迁移面包屑导航
- `src/components/breadcrumb.tsx` — 面包屑导航组件：
  - 使用 `useLocation()` 获取当前路径
  - `ROUTE_BREADCRUMBS` 查找表将路由路径映射为可读标签
  - 适配 Hash 路由：`#/dashboard`、`#/cluster`、`#/osd` 等
  - 支持嵌套路由：`#/block/rbd` → "Block / Images"

### 2.7 更新路由配置
- `src/routes/index.tsx` — 完整路由树：
  - `/login` — `LoginLayout` + `LoginPage`
  - `/change-password` — `LoginLayout` + `PlaceholderPage`（占位，后续迁移）
  - `/` — `AuthGuard` → `ChangePasswordGuard` → `WorkbenchLayout`
  - 子路由：dashboard、cluster、hosts、inventory、monitors、services、osd、configuration、crush-map、mgr-modules、logs、monitoring、pools、block（含子路由）、nfs、cephfs、rgw（含子路由）、settings
  - `PageWrapper` 组件为占位页面添加面包屑导航
  - `*` 路由重定向到 `/dashboard`
- `src/App.tsx` — 简化为仅渲染 `<Outlet />`

### 2.8 扩展国际化
- `src/i18n/locales/en-US.json` 新增翻译键：
  - `nav.*` — 所有导航项标签
  - `auth.*` — 登录相关文本
  - `dashboard.*` — 仪表盘标签
  - `motd.*` — 通知严重程度
  - `common.logout` — 登出按钮文本

### 2.9 测试基础设施改进
- `src/test/setup.ts` — 测试环境配置：
  - 添加 `vi.mock('@/lib/api-client')` 模拟 API 客户端，防止测试环境中的真实 HTTP 请求
  - 模拟 `apiClient.get()` 返回空响应
- `src/routes/auth-guard.test.tsx` 更新：
  - 导入路径从 `@/routes/login-page` 改为 `@/features/auth/pages/login`
  - 验证错误检查从 "Authentication failed" 改为 Zod 验证的 "Username is required" + "Password is required"
  - 使用 `act()` 包裹异步用户交互

## 与设计文档的差异

| 设计文档要求 | 实际实现 | 原因 |
|-------------|---------|------|
| Dashboard Overview 实时容量饼图 | 当前为模板数据（value=0） | 待后续阶段接入 `/df` API 获取真实存储数据 |
| Dashboard Overview 实时 IOPS 卡片 | 当前显示 "-" | 待后续阶段接入性能指标 API |
| Dashboard Overview PG 状态饼图 | 当前为模板数据 | 待后续阶段接入 PG 状态 API |
| Dashboard Overview Objects 状态饼图 | 当前为模板数据 | 待后续阶段接入对象状态 API |
| 完整 MOTD 实现 | `MotdToast` 组件已完整实现 | 接入 useMotd hook，支持去重和持久化 |
| 工作台布局完整导航 | `WorkbenchLayout` + `NAV_CONFIG` 已完整实现 | 侧边栏导航支持权限和功能开关过滤 |

## 新增/修改的文件

### 布局组件
| 文件 | 说明 |
|------|------|
| `src/components/layouts/workbench-layout.tsx` | 主布局（新增） |
| `src/components/layouts/login-layout.tsx` | 登录布局（新增） |

### 导航配置
| 文件 | 说明 |
|------|------|
| `src/routes/nav-config.ts` | 完整导航配置树 + 可见性判断（新增） |

### 登录页面
| 文件 | 说明 |
|------|------|
| `src/features/auth/pages/login.tsx` | 完整登录页（新增） |
| `src/routes/login-page.tsx` | 已删除，被上述文件替换 |

### 仪表盘页面
| 文件 | 说明 |
|------|------|
| `src/features/dashboard/pages/overview.tsx` | Dashboard 概览页（新增） |

### 健康/通知
| 文件 | 说明 |
|------|------|
| `src/features/health/api/use-motd.ts` | MOTD API hook（新增） |
| `src/features/health/components/motd-toast.tsx` | MOTD Toast 组件（新增） |

### 面包屑
| 文件 | 说明 |
|------|------|
| `src/components/breadcrumb.tsx` | 面包屑导航组件（新增） |

### 路由
| 文件 | 说明 |
|------|------|
| `src/routes/index.tsx` | 完整路由树（已更新） |
| `src/routes/page-wrapper.tsx` | 页面包装组件（含面包屑）（新增） |
| `src/App.tsx` | 简化为 Outlet（已更新） |

### 国际化
| 文件 | 说明 |
|------|------|
| `src/i18n/locales/en-US.json` | 扩展导航、仪表盘、通知翻译（已更新） |

### 测试
| 文件 | 说明 |
|------|------|
| `src/test/setup.ts` | 添加 API mock（已更新） |
| `src/routes/auth-guard.test.tsx` | 更新登录页导入路径和断言（已更新） |

## 校验结果

| # | 校验项 | 操作 | 预期结果 | 实际结果 |
|---|--------|------|----------|----------|
| 1 | 登录页渲染 | 访问 /#/login | 显示 Ceph Dashboard 标题 + Sign In 按钮 | ✅ 测试验证通过 |
| 2 | 登录验证 | 空字段提交 | 显示 "Username is required" + "Password is required" | ✅ 测试验证通过 |
| 3 | AuthGuard 未认证重定向 | 未登录访问 /#/dashboard | 重定向到 /#/login | ✅ 测试验证通过 |
| 4 | AuthGuard 已认证 | 登录后访问 /#/dashboard | 显示 "Protected Dashboard" | ✅ 测试验证通过 |
| 5 | 健康状态徽章 | Dashboard 渲染 | 从 useSummary 获取 health_status 并显示 | ✅ 代码逻辑正确 |
| 6 | MOTD Toast | motd API 返回数据 | 显示 sonner Toast，支持 dismiss | ✅ 代码逻辑正确 |
| 7 | 面包屑 | 访问 /#/osd | 显示 "OSD" 面包屑 | ✅ 代码逻辑正确 |
| 8 | 导航可见性 | featureToggle=rgw 关闭时 | Object Gateway 菜单隐藏 | ✅ isItemVisible 实现正确 |
| 9 | 导航可见性 | 无 OSD 权限时 | OSD 菜单隐藏 | ✅ isItemVisible 实现正确 |
| 10 | TypeScript 编译 | `pnpm build` | tsc -b 无错误 | ✅ 编译通过 |
| 11 | 单元测试 | `pnpm test` | 所有测试通过 | ✅ 79 测试全部通过 |
| 12 | ESLint | `pnpm lint` | 无新错误 | ✅ 仅有 5 个 pre-existing shadcn 组件警告 |
| 13 | 路由完整性 | 检查所有 Phase 3+ 页面路由 | 27 个路由均已注册 | ✅ routes/index.tsx 包含所有路由 |

## 依赖更新

| 包 | 版本 | 用途 |
|----|------|------|
| `recharts` | ^2.15.0 | Dashboard 饼图 |
| `sonner` | ^1.7.4 | Toast 通知 |
| `zustand` | ^5.0.0 | 状态管理（已在 Phase 1 安装） |

## 待后续阶段处理

- Dashboard Overview 真实数据接入（容量饼图、IOPS、PG 状态、Objects 状态）
- Change Password 页面实现
- 所有 PlaceholderPage 替换为真实功能页面
- Block、NFS、CephFS、Object Gateway 子页面实现
