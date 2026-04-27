# Phase 2: 核心框架页面

## 工作目标

迁移布局框架、侧边栏导航、登录页和集群概览仪表盘——用户看到的第一批页面。完成后，用户可以在 React 应用中完成完整的登录→浏览导航→查看集群概览→登出流程。

完成标志：在 React 应用中的核心交互流程与 Angular 版本一致，包括登录（含 SSO）、侧边栏导航、集群健康概览数据展示和自动刷新。

## 工作内容

### 2.1 迁移布局组件

- `WorkbenchLayout` → `src/components/layouts/workbench-layout.tsx`
  - 侧边栏（可折叠，使用 shadcn Sidebar 组件）+ 主内容区 + 顶部栏
  - 侧边栏：基于用户权限动态显示菜单项
  - 顶部栏：集群健康状态指示器（调用 `useHealth()`）、通知铃铛、用户菜单（登出）
- `LoginLayout` → `src/components/layouts/login-layout.tsx`
  - 居中卡片布局，仅用于登录页和修改密码页
- `BlankLayout` → 404 页面

### 2.2 迁移侧边栏导航

- 基于 `VerticalNavigationComponent` 创建侧边栏，使用 shadcn Sidebar 组件
- 菜单结构（完整）：

```
概览 (Overview)
├── 集群 (Cluster)
│   ├── 主机 (Hosts)
│   ├── 监视器 (Monitors)
│   ├── 服务 (Services)
│   ├── OSD
│   ├── 配置 (Configuration)
│   ├── CRUSH Map
│   ├── Manager Modules
│   ├── 集群升级 (Upgrade)
│   └── 日志 (Logs)
├── 块 (Block)
│   ├── RBD 镜像
│   ├── RBD 命名空间
│   ├── RBD 回收站
│   ├── RBD 性能
│   ├── RBD 镜像 (Mirroring)
│   ├── iSCSI
│   └── NVMe-oF
├── 对象 (Object)
│   ├── 守护进程
│   ├── 用户
│   ├── 桶
│   └── 多站点
├── 文件系统 (Filesystem)
│   ├── CephFS
│   ├── NFS
│   └── SMB
└── 存储池 (Pools)
```

- 菜单项根据 Feature Toggles 和权限动态显示/隐藏
- 当前激活路由高亮对应菜单项
- 侧边栏折叠状态持久化到 localStorage

### 2.3 迁移登录页

- `LoginComponent` → `src/features/auth/pages/login.tsx`
  - 登录表单：用户名 + 密码，使用 `react-hook-form` + `zod` 验证
  - SSO 按钮：当后端返回有 SSO 配置时显示
  - 自定义登录横幅：请求 `GET /ui-api/login/custom_banner`，如有内容则显示
- 密码修改页 → `src/features/auth/pages/change-password.tsx`
  - 密码策略展示（从 `GET /ui-api/standard_settings` 获取）
  - 新密码 + 确认密码表单
- 登录成功后重定向到 `/#/dashboard`

### 2.4 迁移集群概览仪表盘

- `DashboardComponent` → `src/features/dashboard/pages/overview.tsx`
  - 健康状态卡片：`HEALTH_OK` / `HEALTH_WARNING` / `HEALTH_ERROR`，颜色使用 `getHealthColor()`
  - 性能摘要：IOPS、吞吐量、容量使用（调用 `useSummary()`，5s 轮询）
  - 存储容量使用条：总量 vs 已用 vs 可用
  - PG 状态分布：使用 shadcn Chart 展示饼图或条形图
  - 最近告警列表：调用 `useActiveAlerts()`
- 图表使用 shadcn/ui Chart（基于 Recharts 封装）

### 2.5 迁移通知系统

- Toast 通知 → 使用 shadcn Sonner 组件
- 通知侧边栏：点击顶部铃铛打开 Sheet，显示最近通知
- 每日消息 (MOTD)：请求 `GET /ui-api/motd`，有内容时以 Toast 展示
- 密码过期提示：检查 `authStore.passwordExpiresAt`，临近过期时弹出提示

### 2.6 迁移面包屑导航

- `BreadCrumbService` → React Router 面包屑
- 创建 `src/components/breadcrumb.tsx`：
  - 基于当前路由自动生成面包屑
  - 支持自定义面包屑标签（通过路由 meta 配置）

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 用户名密码登录 | 输入正确用户名密码，点击登录 | 跳转到概览页，侧边栏显示菜单 |
| 2 | 登录失败 | 输入错误密码 | 显示错误提示，停留在登录页 |
| 3 | SSO 登录 | 点击 SSO 按钮 | 重定向到 IdP → 回调 → 自动登录 → 跳转概览页 |
| 4 | 密码过期 | 使用密码即将过期的账户登录 | 强制跳转修改密码页 |
| 5 | 自定义横幅 | 后端配置了 custom_banner | 登录页显示横幅内容 |
| 6 | 侧边栏展开/折叠 | 点击折叠按钮 | 侧边栏折叠为图标模式，刷新页面后状态保持 |
| 7 | 菜单权限 | 用只读用户登录 | 无权操作的菜单项隐藏 |
| 8 | Feature Toggle | 关闭某个 Feature Toggle | 对应菜单项隐藏 |
| 9 | 概览健康状态 | 集群处于 HEALTH_WARN | 概览卡片显示黄色警告状态 |
| 10 | 概览数据刷新 | 停留在概览页观察 | 数据每 5 秒自动更新 |
| 11 | 图表渲染 | 概览页加载 | PG 分布图、容量使用图正常渲染 |
| 12 | MOTD 提示 | 后端设置了 MOTD | 登录后弹出 Toast 提示 |
| 13 | 面包屑 | 从概览导航到主机详情页 | 面包屑显示 `概览 > 集群 > 主机 > <hostname>` |
| 14 | 登出 | 点击用户菜单中的登出 | 清除状态，跳转登录页 |
| 15 | 视觉一致性 | 同一浏览器并排对比 Angular 和 React | 布局结构、配色、间距基本一致 |
