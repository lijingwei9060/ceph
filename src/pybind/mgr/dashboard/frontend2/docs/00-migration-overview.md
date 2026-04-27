# Ceph Dashboard 前端迁移总览

## 目标

将 Ceph Dashboard 前端从 Angular (frontend/) 逐步迁移到 React + TypeScript + shadcn/ui + Tailwind CSS (front2/)，确保迁移过程清晰、逐步、可测试。

## 当前技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Angular 19.2.9 (NgModule 模式) |
| UI 组件库 | Carbon Components Angular v5.59.2 + NG-Bootstrap v17 |
| 状态管理 | RxJS BehaviorSubject (无 NgRx) |
| 表单 | @ngx-formly (动态表单) |
| 图表 | Carbon Charts + Chart.js (ng2-charts) |
| 构建工具 | Nx 20.8.1 + Webpack/Rspack + Module Federation |
| i18n | Angular $localize, 13 种语言, XLF 文件 |
| 后端 | Python CherryPy, REST API + UI API |
| API 版本 | MIME 类型 `application/vnd.ceph.api.v1.0+json` |

## 规模统计

| 指标 | 数量 |
|---|---|
| Angular 组件 | ~317 |
| API 服务 | 54 |
| 工具服务 | 48 |
| 模块 | 25 |
| 管道 (Pipes) | 45 |
| 指令 (Directives) | 21 |
| 路由守卫 | 5 |
| 模型/接口 | ~80 |
| TypeScript 文件 | ~600+ |

## 目标技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 19 + TypeScript 5.x |
| UI 组件库 | shadcn/ui (Radix UI 基础) |
| 样式 | Tailwind CSS 4.x |
| 状态管理 | TanStack Query (服务端) + Zustand (客户端) |
| 表单 | react-hook-form + zod 验证 |
| 图表 | Recharts 或 TanStack Chart |
| 路由 | React Router v7 |
| 构建工具 | Vite |
| i18n | react-i18next |
| API 客户端 | OpenAPI 生成 TypeScript 客户端 |

## 迁移原则

1. **渐进式替换**: 新页面用 React，旧页面保持 Angular，两者并行运行
2. **每步可测试**: 每完成一个模块都能独立验证功能正确性
3. **API 契约不变**: 后端 API 完全不动，前端切换对后端透明
4. **视觉一致性**: 迁移期间保持功能完整，UI 风格可逐步统一
5. **独立部署**: front2 构建产物可独立部署，不依赖 frontend/ 的构建

## 迁移阶段概览

| 阶段 | 名称 | 预估工作量 | 说明 |
|---|---|---|---|
| Phase 0 | 项目基础设施 | 2-3 天 | 初始化 React 项目，配置工具链，搭建 API 客户端 |
| Phase 1 | 共享层迁移 | 3-5 天 | API 客户端、认证、权限、i18n、通用类型 |
| Phase 2 | 核心框架页面 | 5-7 天 | 布局、导航、登录、仪表盘概览 |
| Phase 3 | 集群管理模块 | 5-7 天 | 主机、OSD、Monitor、配置、Crush Map |
| Phase 4 | 块存储模块 | 5-7 天 | RBD、iSCSI、NVMe-oF、镜像 |
| Phase 5 | 对象存储模块 | 3-5 天 | RGW 用户/桶/守护进程/多站点 |
| Phase 6 | 文件系统模块 | 3-5 天 | CephFS、NFS、SMB |
| Phase 7 | 存储池模块 | 2-3 天 | Pool 列表/创建/编辑 |
| Phase 8 | 用户管理模块 | 2-3 天 | 用户、角色管理 |
| Phase 9 | 监控告警模块 | 2-3 天 | Prometheus、Grafana、Silences |
| Phase 10 | 收尾与切换 | 3-5 天 | 移除 Angular、统一构建、E2E 测试 |

**总计预估: 30-50 天**

详细内容见各阶段文档：
- [01-codebase-analysis.md](./01-codebase-analysis.md) — 代码库分析
- [02-api-mapping.md](./02-api-mapping.md) — API 映射关系
- [03-migration-phases.md](./03-migration-phases.md) — 各阶段详细计划
- [04-testing-strategy.md](./04-testing-strategy.md) — 测试策略
- [05-architecture-design.md](./05-architecture-design.md) — 新架构设计
