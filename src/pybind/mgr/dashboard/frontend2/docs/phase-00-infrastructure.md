# Phase 0: 项目基础设施

## 工作目标

在 `front2/` 目录下初始化完整的 React + TypeScript 项目工具链，使开发环境可运行、构建产物可与 Ceph 后端对接，为后续所有阶段提供可依赖的项目骨架。

完成标志：开发者执行 `pnpm dev` 即可在浏览器中看到带侧边栏占位和路由导航的空白应用，且 API 代理能正确转发到后端。

## 工作内容

### 0.0 环境准备

- Node.js: 22 LTS（通过 nvm 管理）
- 包管理器: pnpm（通过 corepack 启用）
- 初始化步骤：

```bash
nvm install 22
nvm use 22
nvm alias default 22
corepack enable
corepack prepare pnpm@latest --activate
node -v   # 确认 v22.x
pnpm -v   # 确认 pnpm 版本
```

- 在 `package.json` 中声明包管理器（确保团队一致性）：

```json
{
  "packageManager": "pnpm@<版本号>"
}
```

- 创建 `.npmrc`（pnpm 配置）：

```ini
shamefully-hoist=true
strict-peer-dependencies=false
```

> `shamefully-hoist=true` 让 pnpm 将依赖提升到根目录 node_modules，兼容部分需要隐式依赖的第三方库（如 shadcn/ui 组件依赖）。

### 0.1 初始化 Vite + React + TypeScript 项目

- 使用 `pnpm create vite front2 --template react-ts` 创建项目
- 配置 `tsconfig.json`：启用 `strict`、`noUnusedLocals`、`noUnusedParameters`
- 配置路径别名：`@/` → `src/`，需要在 `vite.config.ts` 的 `resolve.alias` 和 `tsconfig.json` 的 `paths` 中同步设置
- 创建目录结构：

```
front2/
├── docs/
├── public/
├── src/
│   ├── components/ui/     # shadcn/ui 组件
│   ├── features/          # 功能模块
│   ├── hooks/             # 自定义 Hooks
│   ├── i18n/locales/      # 国际化翻译文件
│   ├── lib/               # 工具库 (api-client, auth, utils)
│   ├── routes/            # 路由定义 + 守卫
│   ├── stores/            # Zustand 状态
│   ├── types/             # TypeScript 类型
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/                 # Playwright E2E
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
└── .npmrc
```

### 0.2 安装和配置 Tailwind CSS + shadcn/ui

- 安装 Tailwind CSS 4.x 及 Vite 插件 `@tailwindcss/vite`
- 在 `index.css` 中引入 `@import "tailwindcss"`
- 执行 `pnpm dlx shadcn@latest init`，选择：
  - Style: Default
  - Base color: Slate
  - CSS variables: yes
- 配置主题色，映射 Carbon Design 色彩方案：
  - 主色 → 蓝色系 (`blue-60` 对应的 HSL)
  - 警告色 → 黄色系
  - 错误色 → 红色系
  - 成功色 → 绿色系
- 批量安装常用 shadcn 组件：Button, Input, Table, Dialog, Card, Tabs, Select, Form, Toast, NavigationMenu, Sheet, DropdownMenu, Badge, Sidebar, Breadcrumb, Sonner

### 0.3 配置开发代理

- 在 `vite.config.ts` 中配置 proxy（通过环境变量注入 Ceph 后端地址）：

```ts
const dashboardUrl = process.env.CEPH_DASHBOARD_URL || 'https://localhost:8443';

export default defineConfig({
  server: {
    port: 4201,
    proxy: {
      '/api': { target: dashboardUrl, secure: false, changeOrigin: true },
      '/ui-api': { target: dashboardUrl, secure: false, changeOrigin: true },
      '/auth': { target: dashboardUrl, secure: false, changeOrigin: true },
      '/docs': { target: dashboardUrl, secure: false, changeOrigin: true },
    },
  },
});
```

- 启动命令：`CEPH_DASHBOARD_URL=https://<host>:<port> pnpm dev`
- 端口 4201 避免与现有 Angular 开发服务器 (4200) 冲突
- Rook 环境下获取地址：`kubectl get svc -n rook-ceph rook-ceph-mgr-dashboard-external-https`

### 0.4 配置 i18n

- 安装 `react-i18next`、`i18next`、`i18next-browser-languagedetector`
- 创建 `src/i18n/index.ts` 配置：
  - 语言检测顺序：`cd-lang` cookie → `Accept-Language` 头 → 默认 `en-US`
  - 初始翻译文件 `src/i18n/locales/en-US.json`（仅框架级文本，如通用按钮、错误消息）
- 后续各阶段按模块逐步补充翻译条目

### 0.5 配置路由

- 安装 `react-router` v7，使用 Library Mode
- 配置 Hash 路由模式（与现有 Angular `useHash: true` 一致）：
  ```ts
  createHashRouter([...])
  ```
- 创建基础路由结构，各路由指向空占位页面

### 0.6 配置 API 客户端

- 安装 `ky` 作为 HTTP 客户端
- 创建 `src/lib/api-client.ts`：
  - 基础 URL：`/api`
  - 默认请求头：`Accept: application/vnd.ceph.api.v1.0+json`
  - 401 响应拦截 → 重定向到 `/login`
  - 多集群 Bearer token 代理支持
- 创建 `src/lib/api-version.ts`：API 版本管理工具函数

### 0.7 配置状态管理

- 安装 `@tanstack/react-query`（服务端状态）
- 安装 `zustand`（客户端状态）
- 在 `App.tsx` 中配置 `QueryClientProvider`，默认 `staleTime: 30s`
- 配置 React Query DevTools（仅开发环境）

### 0.8 配置代码质量工具

- ESLint：`@typescript-eslint/eslint-plugin` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- Prettier：统一格式化规则
- Husky + lint-staged：pre-commit 时自动 lint 和格式化
- Vitest：单元测试框架，配置 `@testing-library/react` + `jsdom` 环境

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 项目启动 | `pnpm dev` | 浏览器访问 `http://localhost:4201` 显示空白应用 |
| 2 | API 代理 | 启动 Ceph 后端后，浏览器访问 `/api/health` | 返回后端 JSON 数据，无 CORS 错误 |
| 3 | Tailwind | 在任意组件中使用 `className="text-blue-600"` | 文字显示蓝色，无样式丢失 |
| 4 | shadcn/ui | 在页面中渲染 `<Button>Test</Button>` | 按钮渲染正常，主题色正确 |
| 5 | i18n | 在组件中使用 `t('common.loading')` | 显示对应翻译文本 |
| 6 | 路由 | 浏览器直接访问 `http://localhost:4201/#/test` | Hash 路由正常，页面无 404 |
| 7 | API 客户端 | 用 ky 实例请求 `/api/summary` | 请求头包含 `Accept: application/vnd.ceph.api.v1.0+json` |
| 8 | 401 拦截 | 未登录时请求需认证的 API | 自动重定向到 `/#/login` |
| 9 | 构建产物 | `pnpm build` | `dist/` 目录生成，无构建错误 |
| 10 | 单元测试 | `pnpm test` | Vitest 运行成功（即使 0 用例） |
| 11 | Lint | `pnpm lint` | ESLint 运行成功，无错误 |
| 12 | 路径别名 | import 组件使用 `@/components/ui/button` | 解析正常，无 TS 报错 |
