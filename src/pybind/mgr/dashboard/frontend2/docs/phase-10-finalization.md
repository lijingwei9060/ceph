# Phase 10: 收尾与切换

## 工作目标

完成前端迁移的最后步骤：性能优化、i18n 完整迁移、E2E 测试、可访问性测试、文档更新。

完成标志：React 应用功能完备，所有页面与 Angular 版本对等，13 种语言翻译完整，E2E 测试覆盖关键流程，构建产物可通过 Ceph 后端正确部署。

注意：后端修改（home.py、module.py、CMakeLists.txt）不在本阶段范围内，由独立的后续任务处理。本阶段仅关注前端侧的收尾工作。

## 工作内容

### 10.1 性能优化

- 代码分割：Vite 默认按动态 import 分割，确认所有路由使用 `React.lazy` + `Suspense`
  ```tsx
  const HostList = React.lazy(() => import('@/features/cluster/hosts/pages/host-list'));
  ```
- 懒加载图表库：shadcn Chart (Recharts) 仅在需要图表的页面加载
- TanStack Query 缓存优化：
  - 按数据变化频率设置 `staleTime`：健康数据 5s、静态配置 5min、用户列表 30s
  - 避免重复请求，使用 `placeholderData` 保持旧数据直到新数据到达
- 首屏加载优化：
  - 分析 `pnpm build` 产物大小，确认无超过 200KB 的单 chunk（gzip 前）
  - 压缩图片资源
  - 确认 Vite 的 `build.rollupOptions.output.manualChunks` 合理分割

### 10.2 可访问性测试

- 键盘导航：所有页面可通过 Tab 键完整操作
  - 侧边栏菜单项可聚焦
  - 表格行可聚焦、操作按钮可触发
  - 对话框内 Tab 不会跳到对话框外
- ARIA 标签：
  - 图标按钮有 `aria-label`
  - 表格有正确的 `scope` 属性
  - 对话框有 `role="dialog"` 和 `aria-labelledby`
  - 加载状态有 `aria-busy` 或 `role="status"`
- 色彩对比度：所有文本与背景对比度满足 WCAG AA 标准（4.5:1）
- 屏幕阅读器兼容：使用 `@testing-library/jest-dom` 的 `toBeVisible()` 等断言验证

### 10.3 i18n 完整迁移

- 从 Angular XLF 翻译文件提取所有文本条目
- 转换为 react-i18next JSON 格式
- 支持的语言（13 种）：en-US、de、es、fr、it、ja、ko、pl、pt-BR、ru、tr、zh-CN、zh-TW
- 翻译文件目录结构：
  ```
  src/i18n/locales/
  ├── en-US.json
  ├── de.json
  ├── es.json
  ├── fr.json
  ├── it.json
  ├── ja.json
  ├── ko.json
  ├── pl.json
  ├── pt-BR.json
  ├── ru.json
  ├── tr.json
  ├── zh-CN.json
  └── zh-TW.json
  ```
- 验证：切换每种语言，确认所有页面文本正确显示，无遗漏的 key（显示为 raw key 而非翻译文本）
- 翻译 key 组织：按模块分组，如 `cluster.hosts.title`、`block.rbd.create`

### 10.4 E2E 测试

- 配置 Playwright（替代 Angular 版本的 Cypress/Protractor）
  - 配置文件：`playwright.config.ts`
  - 基础 URL：`http://localhost:4201`
  - 测试目录：`tests/`
- 关键流程 E2E 测试：
  - 登录/登出
  - 主机管理：列表浏览、添加主机
  - OSD 操作：列表浏览、标记操作
  - RBD CRUD：创建、编辑、删除
  - 存储池管理：创建、编辑
  - 用户管理：创建用户、分配角色
  - i18n：切换语言验证
- CI 集成准备：提供 `pnpm exec playwright test` 命令，后续接入 CI 时可直接使用

### 10.5 文档更新

- 更新 `front2/README.md`：
  - 项目简介
  - 技术栈列表
  - 开发环境搭建步骤
  - 开发服务器启动命令
  - 构建命令
  - 测试命令
- 开发者指南 (`front2/docs/developer-guide.md`)：
  - 目录结构说明
  - 如何创建新页面（路由 + 组件 + API hook + 翻译）
  - 如何添加新的 shadcn/ui 组件
  - 状态管理最佳实践
  - API 调用模式

### 10.6 构建验证

- 确认 `pnpm build` 产物结构：
  - `dist/index.html` 作为入口
  - `dist/assets/` 包含 JS/CSS/图片等静态资源
  - 所有资源路径为相对路径（适配后端提供静态文件）
- 确认构建产物可由 Python `http.server` 或类似方式正确提供（模拟后端提供）
- 构建产物大小统计并记录

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 路由懒加载 | 查看 Network 面板，导航到不同页面 | 每个路由加载独立 chunk，非一次性加载全部 |
| 2 | 图表懒加载 | 首次加载概览页后查看 bundle | Recharts 不包含在初始 chunk 中 |
| 3 | 缓存优化 | 快速切换页面再切回 | 第二次访问无网络请求（使用缓存） |
| 4 | 首屏加载时间 | Lighthouse 测试 | LCP < 2s（本地环境） |
| 5 | 键盘导航 | 仅用键盘操作整个应用 | 所有交互元素可聚焦和操作 |
| 6 | ARIA 标签 | 用 axe 或 Lighthouse 检查 | 无 ARIA 违规 |
| 7 | 色彩对比度 | 用 axe 检查 | 无对比度违规 |
| 8 | 13 种语言 | 逐一切换每种语言 | 所有文本正确翻译，无 raw key 暴露 |
| 9 | 翻译完整性 | 用 i18next 的 `missingKeyHandler` 检查 | 无缺失的翻译 key |
| 10 | E2E 登录 | `pnpm exec playwright test tests/login.spec.ts` | 测试通过 |
| 11 | E2E 主机管理 | `pnpm exec playwright test tests/hosts.spec.ts` | 测试通过 |
| 12 | E2E RBD | `pnpm exec playwright test tests/rbd.spec.ts` | 测试通过 |
| 13 | 构建产物 | `pnpm build` | `dist/` 生成，无错误 |
| 14 | 构建产物服务 | 用 `pnpm dlx serve dist` 访问 | 应用正常运行 |
| 15 | 资源路径 | 检查构建产物中的资源引用 | 均为相对路径 |
| 16 | 功能回归 | 逐一验证每个页面的核心功能 | 与 Angular 版本功能对等 |
| 17 | SSO 完整流程 | 配置 SAML2 后完成完整 SSO 流程 | 登录 → 使用 → 登出均正常 |
| 18 | 多集群场景 | 在多集群环境切换并操作 | 代理请求正确，数据不串 |
