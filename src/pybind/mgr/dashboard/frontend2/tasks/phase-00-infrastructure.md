# Phase 0: 项目基础设施 — 完成总结

## 完成时间
2026-04-24

## 工作内容

### 0.0 环境准备
- Node.js 22 LTS（v22.22.2）、pnpm 10.33.2 已就绪
- `package.json` 声明 `"packageManager": "pnpm@10.33.2"`
- 创建 `.npmrc`：`shamefully-hoist=true`、`strict-peer-dependencies=false`

### 0.1 Vite + React + TypeScript 项目初始化
- 基于 `pnpm create vite frontend2 --template react-ts` 脚手架创建
- `tsconfig.app.json`：启用 `strict`、`noUnusedLocals`、`noUnusedParameters`、`ignoreDeprecations: "6.0"`（TS 6.x 下 baseUrl 兼容）
- 路径别名：`@/` → `src/`，在 `vite.config.ts`（resolve.alias）和 `tsconfig.app.json`（paths）同步配置
- 目录结构：
  ```
  src/
  ├── components/ui/     # shadcn/ui 组件 (19个)
  ├── features/          # 功能模块（空）
  ├── hooks/             # 自定义 Hooks
  ├── i18n/locales/      # 国际化翻译文件
  ├── lib/               # api-client, api-version, utils
  ├── routes/            # 路由定义 + 守卫 + 占位页面 + 登录页
  ├── stores/            # Zustand 状态
  ├── test/              # 测试 setup
  ├── types/             # TypeScript 类型
  ├── App.tsx
  ├── main.tsx
  └── index.css
  ```

### 0.2 Tailwind CSS + shadcn/ui
- Tailwind CSS 4.x + `@tailwindcss/vite` 插件
- `index.css` 中 `@import "tailwindcss"` + `@custom-variant dark` + `@theme inline` 注册所有 CSS 变量颜色
- 主题色映射 Carbon Design 色彩方案：
  - 主色 → 蓝色系 `--primary: 217 91% 60%`
  - 警告色 → 黄色系 `--warning: 43 96% 56%`
  - 错误色 → 红色系 `--destructive: 0 84.2% 60.2%`
  - 成功色 → 绿色系 `--success: 142 71% 45%`
- shadcn/ui 组件（19个）：
  - 设计文档要求的 15 个：Button, Input, Table, Dialog, Card, Tabs, Select, Form, NavigationMenu, Sheet, DropdownMenu, Badge, Sidebar, Breadcrumb, Sonner
  - shadcn 自动安装的依赖组件 4 个：Label, Separator, Skeleton, Tooltip
  - 注意：设计文档中的 Toast 已废弃，使用 Sonner 替代

### 0.3 开发代理
- `vite.config.ts` 配置 proxy，默认目标 `https://192.168.122.72:30275`（通过 `CEPH_DASHBOARD_URL` 环境变量可覆盖）
- 代理路径：`/api`、`/ui-api`、`/auth`、`/docs`
- 端口 4201，`host: '0.0.0.0'`（允许局域网访问）
- 验证：访问 `/api/summary` 成功返回后端 JSON 数据

### 0.4 i18n
- 安装 `react-i18next`、`i18next`、`i18next-browser-languagedetector`
- `src/i18n/index.ts`：语言检测顺序 `cd-lang` cookie → `navigator` → 默认 `en-US`
- `src/i18n/locales/en-US.json`：框架级翻译（common 按钮/错误消息、nav 导航项、auth 登录文本）

### 0.5 路由 + 鉴权守卫
- 安装 `react-router` v7
- 使用 `createHashRouter`（与 Angular `useHash: true` 一致）
- 路由守卫 `AuthGuard`：未登录用户访问任何页面自动重定向到 `/login`
- `/login` 页面独立于侧边栏布局，使用 `LoginPage` 组件（含表单验证）
- 登录成功后写入 Zustand store 认证状态，跳转到 `/dashboard`
- 路由结构：
  - `/login` → LoginPage（无侧边栏）
  - `/` → AuthGuard 包裹 → App（侧边栏布局）
    - `/` → 重定向到 `/dashboard`
    - `/dashboard`、`/cluster`、`/hosts`、`/monitors`、`/services`、`/osd`、`/pools`、`/block`、`/rbd`、`/iscsi`、`/nfs`、`/object`、`/rgw`、`/filesystem`、`/cephfs`、`/settings` → PlaceholderPage
  - `*` → 重定向到 `/dashboard`

### 0.6 API 客户端
- 安装 `ky`
- `src/lib/api-client.ts`：
  - 基础 URL：`/api`
  - 默认请求头：`Accept: application/vnd.ceph.api.v1.0+json`
  - 401 响应拦截 → 重定向到 `/#/login`
  - `createClusterClient()` 支持多集群 Bearer token 代理
- `src/lib/api-version.ts`：API 版本管理工具函数

### 0.7 状态管理
- 安装 `@tanstack/react-query` + `@tanstack/react-query-devtools`
- 安装 `zustand`
- `main.tsx` 中 `QueryClientProvider`，默认 `staleTime: 30s`，`retry: 1`，`refetchOnWindowFocus: false`
- React Query DevTools 仅开发环境加载
- `src/stores/app-store.ts`：Zustand store
  - `sidebarOpen` — 侧边栏展开/收起
  - `isAuthenticated` — 登录状态
  - `username` — 当前用户名
  - `login(username)` — 登录
  - `logout()` — 登出

### 0.8 代码质量工具
- ESLint：`@typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
  - shadcn/ui 组件目录 `src/components/ui/` 关闭 `react-hooks/purity` 和 `react-hooks/set-state-in-effect` 规则
- Prettier：统一格式化规则（singleQuote, trailingComma: all, printWidth: 100）
- Vitest：单元测试框架，`@testing-library/react` + `jsdom` 环境，测试 setup 中初始化 i18n
- lint-staged：已配置，需手动执行 `pnpm lint-staged`
- Husky：**未配置**，因其需在 `frontend2/` 目录外的 git 根目录创建 `.husky/` 目录，与项目隔离原则冲突

## 与设计文档的差异

| 设计文档要求 | 实际实现 | 原因 |
|-------------|---------|------|
| Husky + lint-staged pre-commit hook | 仅配置 lint-staged，未配置 Husky | Husky 需在 git 根目录创建文件，超出 `frontend2/` 范围 |
| Toast 组件 | 使用 Sonner 替代 | shadcn/ui 已废弃 Toast，推荐 Sonner |
| `tests/` 目录（Playwright E2E） | 未创建 | Phase 0 不需要 E2E 测试，后续阶段按需添加 |
| react-router v7 Library Mode | 使用 `createHashRouter` | 符合设计文档的 Hash 路由模式要求 |
| 401 拦截仅通过 API 响应 hook | 增加 AuthGuard 路由守卫 + LoginPage | 纯 API 层拦截无法阻止用户直接访问页面，需路由层守卫配合 |

## 使用的 API

| API 路径 | 用途 |
|----------|------|
| `/api/*` | Ceph REST API 代理 |
| `/ui-api/*` | Ceph UI API 代理 |
| `/auth/*` | 认证接口代理 |
| `/docs/*` | API 文档代理 |

## 新增/修改的文件

### 配置文件
| 文件 | 说明 |
|------|------|
| `package.json` | 项目依赖和脚本 |
| `.npmrc` | pnpm 配置 |
| `.gitignore` | Git 忽略规则 |
| `.prettierrc` | Prettier 格式化规则 |
| `.prettierignore` | Prettier 忽略规则 |
| `components.json` | shadcn/ui 配置 |
| `eslint.config.js` | ESLint 配置（含 shadcn 组件规则豁免） |
| `tsconfig.json` | TS 项目引用 |
| `tsconfig.app.json` | TS 应用配置（strict, paths, ignoreDeprecations） |
| `tsconfig.node.json` | TS Node 配置 |
| `vite.config.ts` | Vite 配置（代理、别名、Tailwind、host: 0.0.0.0） |
| `vitest.config.ts` | Vitest 测试配置 |
| `index.html` | HTML 入口 |

### 源代码
| 文件 | 说明 |
|------|------|
| `src/index.css` | Tailwind CSS + 主题变量 + dark 模式 |
| `src/main.tsx` | 应用入口（React Query, Router, i18n） |
| `src/App.tsx` | 布局组件（SidebarProvider + Outlet，仅登录后显示） |
| `src/lib/utils.ts` | cn() 工具函数（clsx + tailwind-merge） |
| `src/lib/api-client.ts` | ky HTTP 客户端 + 401 拦截 + 多集群支持 |
| `src/lib/api-version.ts` | API 版本管理工具函数 |
| `src/i18n/index.ts` | i18next 配置（cd-lang cookie 检测） |
| `src/i18n/locales/en-US.json` | 英文翻译 |
| `src/routes/index.tsx` | Hash 路由定义（AuthGuard 包裹主布局） |
| `src/routes/auth-guard.tsx` | 路由鉴权守卫组件 |
| `src/routes/login-page.tsx` | 登录页面组件（Card + Form + 表单验证） |
| `src/routes/placeholder-page.tsx` | 占位页面组件 |
| `src/stores/app-store.ts` | Zustand 全局状态（sidebarOpen + 认证状态） |
| `src/types/index.ts` | TypeScript 类型定义 |
| `src/test/setup.ts` | 测试 setup（jest-dom, i18n 初始化） |
| `src/components/ui/*.tsx` | 19 个 shadcn/ui 组件 |
| `src/hooks/use-mobile.tsx` | 移动端检测 hook（shadcn Sidebar 依赖） |

### 测试文件
| 文件 | 说明 |
|------|------|
| `src/lib/api-version.test.ts` | API 版本工具测试（7 用例） |
| `src/stores/app-store.test.ts` | Zustand store 测试（3 用例） |
| `src/routes/placeholder-page.test.tsx` | 占位页面组件测试（2 用例） |
| `src/routes/auth-guard.test.tsx` | 路由守卫 + 登录页测试（5 用例） |

## 页面替换情况

本阶段为基础设施搭建，不涉及页面替换。所有功能路由指向 `PlaceholderPage` 占位组件，`/login` 路由使用 `LoginPage` 组件。后续阶段逐步将 PlaceholderPage 替换为实际功能页面。

## 校验结果

| # | 校验项 | 操作 | 预期结果 | 实际结果 |
|---|--------|------|----------|----------|
| 1 | 项目启动 | `pnpm dev` | 浏览器显示空白应用 | http://10.97.6.116:4201 显示登录页（未登录自动跳转） |
| 2 | API 代理 | 访问 `/api/summary` | 返回后端 JSON 数据 | 返回集群 JSON 数据，无 CORS 错误 |
| 3 | Tailwind | 组件中使用 CSS 变量类 | 样式正常渲染 | 侧边栏、按钮等样式正确 |
| 4 | shadcn/ui | Sidebar/Button 等组件 | 渲染正常 | 登录页 Card+Input+Button 正常，主题色正确 |
| 5 | i18n | `t('common.loading')` | 显示翻译文本 | 占位页显示 "No data available" |
| 6 | 路由 | 访问 `/#/dashboard` 等 | Hash 路由正常 | 登录后侧边栏导航切换正常 |
| 7 | API 客户端 | ky 请求头 | 包含 Accept header | api-client.ts 配置正确 |
| 8 | 401 拦截 | 未登录时访问任何页面 | 自动重定向到 `/#/login` | AuthGuard 路由守卫生效，未登录跳转登录页；API 层 401 也跳转登录页 |
| 9 | 构建产物 | `pnpm build` | dist/ 生成，无错误 | tsc + vite build 成功 |
| 10 | 单元测试 | `pnpm test` | Vitest 运行成功 | 17/17 通过（4 个测试文件） |
| 11 | Lint | `pnpm lint` | ESLint 无错误 | 0 errors, 5 warnings（shadcn 组件标准） |
| 12 | 路径别名 | import `@/components/ui/button` | 解析正常 | TS 和 Vite 均正常解析 |
