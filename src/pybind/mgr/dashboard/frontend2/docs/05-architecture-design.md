# 05 - 新架构设计

## 技术选型决策

### UI 框架: React 19
- **为什么**: 生态最丰富、社区最大、shadcn/ui 生态、团队熟悉度
- **版本**: React 19 (支持 Server Components 范式，但本项目以 Client Components 为主)
- **与 Angular 对比**: 声明式 UI 思维一致，但 Hooks 模式比 RxJS 订阅更简洁

### UI 组件库: shadcn/ui
- **为什么**: 可定制性极高 (源码复制到项目)、基于 Radix UI (无障碍)、Tailwind 原生、无 lock-in
- **与 Carbon 对比**: Carbon 是 IBM 风格，shadcn/ui 更中性，定制成本低
- **组件覆盖**: shadcn/ui 已有 Table, Dialog, Form, Select, Tabs, NavigationMenu, Sheet, Toast 等，覆盖 90% 需求
- **不覆盖的部分**:
  - 图表 → 使用 Recharts (shadcn/ui 官方推荐)
  - 日期时间选择器 → shadcn/ui Calendar + Popover 组合 + date-fns
  - 向导/Stepper → 自建或使用 @shadcn/ui 扩展

### 样式: Tailwind CSS 4.x
- **为什么**: shadcn/ui 原生支持、开发效率高、无 CSS 命名冲突
- **与 SCSS 对比**: 无需编写 CSS 文件，所有样式在 JSX 中完成
- **主题**: 通过 CSS 变量配置，支持深色模式

### 状态管理

#### 服务端状态: TanStack Query v5
- **为什么**: 缓存、自动刷新、乐观更新、错误重试、请求去重
- **替代**: Angular 的 RxJS BehaviorSubject 轮询模式
- **映射**:
  - `SummaryService` (5s 轮询) → `useQuery({ refetchInterval: 5000 })`
  - `FeatureTogglesService` (30s 轮询) → `useQuery({ refetchInterval: 30000 })`
  - `DataGatewayService` 缓存 → TanStack Query 内置缓存 (`staleTime`)

#### 客户端状态: Zustand
- **为什么**: 极简 API、TypeScript 友好、无 Provider 包装
- **用于**: 认证状态、UI 状态 (侧边栏展开、通知面板)、面包屑
- **不用于**: API 数据 (用 TanStack Query)

### 表单: react-hook-form + zod
- **为什么**: react-hook-form 性能最优 (非受控模式)、zod 类型安全验证
- **替代**: Angular Reactive Forms + @ngx-formly
- **动态表单**: 从 OpenAPI spec 生成 zod schema → 自动生成表单 (可选高级功能)

### 路由: React Router v7
- **为什么**: React 生态标准、数据加载 (loader)、嵌套路由
- **配置**: Hash 模式 (与 Angular 版本一致，`useHash: true`)
- **路由守卫**: 使用 loader 函数 + redirect

### HTTP 客户端: ky (或 fetch wrapper)
- **为什么**: 轻量、基于 fetch、Hooks 友好
- **替代**: Angular HttpClient
- **关键功能**:
  - 自动添加 API 版本头
  - 401 自动重定向
  - 多集群 Bearer token 注入
  - 请求/响应拦截

### i18n: react-i18next
- **为什么**: React 生态标准、运行时语言切换、命名空间支持
- **替代**: Angular $localize (编译时)
- **优势**: 运行时切换无需重新构建 (Angular 需要每种语言单独构建)
- **迁移**: XLF → JSON 转换脚本

### 图表: Recharts
- **为什么**: React 原生、声明式 API、shadcn/ui 官方图表方案
- **替代**: Carbon Charts / Chart.js

### 构建工具: Vite
- **为什么**: 极快的 HMR、简洁配置、React 生态主流
- **替代**: Webpack + Nx

## 项目结构

```
front2/
├── docs/                              # 迁移文档
├── public/                            # 静态资源
│   └── assets/                        # 模块联邦 manifest 等旧资产
├── src/
│   ├── components/                    # 共享 UI 组件
│   │   ├── ui/                        # shadcn/ui 组件 (自动生成)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   ├── layouts/                   # 布局组件
│   │   │   ├── workbench-layout.tsx   # 主布局 (侧边栏 + 内容)
│   │   │   ├── login-layout.tsx       # 登录页布局
│   │   │   └── blank-layout.tsx       # 404 布局
│   │   ├── data-table.tsx             # 通用数据表格
│   │   ├── crud-table.tsx             # 通用 CRUD 表格
│   │   ├── crud-form.tsx              # 通用 CRUD 表单
│   │   ├── delete-confirmation.tsx    # 删除确认对话框
│   │   ├── confirmation-modal.tsx     # 通用确认对话框
│   │   ├── loading-panel.tsx          # 加载面板
│   │   ├── usage-bar.tsx              # 使用率进度条
│   │   ├── health-badge.tsx           # 健康状态徽章
│   │   ├── breadcrumb.tsx             # 面包屑导航
│   │   ├── sidebar.tsx                # 侧边栏导航
│   │   ├── top-bar.tsx                # 顶部栏
│   │   └── wizard.tsx                 # 多步骤向导
│   ├── features/                      # 功能模块 (按业务域)
│   │   ├── auth/                      # 认证
│   │   │   ├── api/                   # API hooks
│   │   │   │   ├── use-login.ts
│   │   │   │   └── use-auth-check.ts
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── sso-button.tsx
│   │   │   │   └── change-password-form.tsx
│   │   │   └── pages/
│   │   │       ├── login.tsx
│   │   │       └── change-password.tsx
│   │   ├── dashboard/                 # 集群概览
│   │   │   ├── api/
│   │   │   │   ├── use-summary.ts
│   │   │   │   ├── use-health.ts
│   │   │   │   └── use-cluster.ts
│   │   │   ├── components/
│   │   │   │   ├── health-card.tsx
│   │   │   │   ├── capacity-bar.tsx
│   │   │   │   └── performance-chart.tsx
│   │   │   └── pages/
│   │   │       └── overview.tsx
│   │   ├── cluster/                   # 集群管理
│   │   │   ├── hosts/
│   │   │   ├── osd/
│   │   │   ├── monitor/
│   │   │   ├── config/
│   │   │   ├── crush/
│   │   │   ├── services/
│   │   │   ├── mgr-modules/
│   │   │   ├── logs/
│   │   │   ├── telemetry/
│   │   │   ├── upgrade/
│   │   │   ├── inventory/
│   │   │   └── multi-cluster/
│   │   ├── block/                     # 块存储
│   │   │   ├── rbd/
│   │   │   ├── mirroring/
│   │   │   ├── iscsi/
│   │   │   └── nvmeof/
│   │   ├── rgw/                       # 对象存储
│   │   │   ├── daemon/
│   │   │   ├── user/
│   │   │   ├── bucket/
│   │   │   ├── accounts/
│   │   │   ├── multisite/
│   │   │   └── topic/
│   │   ├── cephfs/                    # 文件系统
│   │   │   ├── fs/
│   │   │   ├── subvolume/
│   │   │   ├── snapshot-schedule/
│   │   │   └── mirroring/
│   │   ├── nfs/                       # NFS
│   │   ├── smb/                       # SMB
│   │   │   ├── cluster/
│   │   │   ├── share/
│   │   │   ├── join-auth/
│   │   │   └── users-groups/
│   │   ├── pool/                      # 存储池
│   │   ├── user-management/           # 用户管理
│   │   │   ├── users/
│   │   │   └── roles/
│   │   ├── monitoring/                # 监控
│   │   │   ├── alerts/
│   │   │   └── silences/
│   │   └── ceph-users/               # Ceph 用户 (通用 CRUD)
│   ├── hooks/                         # 全局自定义 Hooks
│   │   ├── use-auth.ts                # 认证 Hook
│   │   ├── use-permission.ts          # 权限检查 Hook
│   │   ├── use-feature-toggle.ts      # 功能开关 Hook
│   │   └── use-module-status.ts       # 模块状态 Hook
│   ├── i18n/                          # 国际化
│   │   ├── locales/
│   │   │   ├── en-US.json
│   │   │   ├── zh-CN.json
│   │   │   └── ...
│   │   └── index.ts
│   ├── lib/                           # 工具库
│   │   ├── api-client.ts              # HTTP 客户端 (版本头、401 处理、多集群)
│   │   ├── auth.ts                    # 认证工具函数
│   │   ├── crud.ts                    # 通用 CRUD 工具
│   │   ├── format.ts                  # 格式化工具 (替代 Pipes)
│   │   ├── health.ts                  # 健康状态工具
│   │   ├── permissions.ts             # 权限常量和检查
│   │   ├── scopes.ts                  # API 权限范围定义
│   │   └── utils.ts                   # shadcn/ui cn() 等通用工具
│   ├── routes/                        # 路由
│   │   ├── index.tsx                  # 路由定义
│   │   ├── guards.tsx                 # 路由守卫组件
│   │   └── navigation.ts             # 侧边栏菜单定义
│   ├── stores/                        # Zustand 状态
│   │   ├── auth-store.ts              # 认证状态
│   │   ├── ui-store.ts                # UI 状态 (侧边栏、通知)
│   │   └── notification-store.ts      # 通知状态
│   ├── types/                         # TypeScript 类型
│   │   ├── api.ts                     # API 响应通用类型
│   │   ├── auth.ts                    # 认证相关类型
│   │   ├── health.ts                  # 健康状态类型
│   │   ├── host.ts                    # 主机类型
│   │   ├── osd.ts                     # OSD 类型
│   │   ├── pool.ts                    # 存储池类型
│   │   ├── rbd.ts                     # RBD 类型
│   │   ├── rgw.ts                     # RGW 类型
│   │   ├── cephfs.ts                  # CephFS 类型
│   │   ├── nfs.ts                     # NFS 类型
│   │   ├── smb.ts                     # SMB 类型
│   │   ├── iscsi.ts                   # iSCSI 类型
│   │   ├── nvmeof.ts                  # NVMe-oF 类型
│   │   ├── user.ts                    # 用户类型
│   │   ├── role.ts                    # 角色类型
│   │   ├── monitor.ts                 # Monitor 类型
│   │   ├── prometheus.ts              # Prometheus 类型
│   │   └── cluster.ts                 # 集群类型
│   ├── App.tsx                        # 根组件
│   ├── main.tsx                       # 入口
│   ├── index.css                      # Tailwind 入口 + CSS 变量主题
│   └── vite-env.d.ts
├── tests/                             # 测试
│   ├── setup.ts                       # Vitest setup
│   ├── mocks/                         # MSW handlers
│   │   ├── handlers.ts
│   │   └── server.ts
│   └── e2e/                           # Playwright E2E
│       ├── auth.spec.ts
│       ├── hosts.spec.ts
│       └── ...
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── components.json                     # shadcn/ui 配置
├── tsconfig.json
├── tsconfig.node.json
├── .eslintrc.cjs
├── .prettierrc
└── package.json
```

## 核心设计模式

### 1. API Hook 模式

每个 API 端点对应一个 React Query hook:

```tsx
// src/features/host/api/use-hosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useHosts() {
  return useQuery({
    queryKey: ['hosts'],
    queryFn: () => apiClient.get('/api/host').json(),
  });
}

export function useHost(hostname: string) {
  return useQuery({
    queryKey: ['hosts', hostname],
    queryFn: () => apiClient.get(`/api/host/${hostname}`).json(),
  });
}

export function useCreateHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHostRequest) =>
      apiClient.post('/api/host', { json: data }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}

export function useDeleteHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hostname: string) =>
      apiClient.delete(`/api/host/${hostname}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}
```

### 2. 路由守卫模式

```tsx
// src/routes/guards.tsx
import { redirect, type LoaderFunction } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';

export function authGuard(): LoaderFunction {
  return ({ request }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      const url = new URL(request.url);
      return redirect(`/login?returnUrl=${encodeURIComponent(url.pathname)}`);
    }
    return null;
  };
}

export function featureToggleGuard(feature: string): LoaderFunction {
  return async () => {
    const features = await fetchFeatureToggles();
    if (!features[feature]) {
      throw new Response(null, { status: 404 });
    }
    return null;
  };
}

// 使用
// routes/index.tsx
{
  path: '/hosts',
  element: <HostListPage />,
  loader: authGuard(),
}
```

### 3. 通用 CRUD 组件模式

```tsx
// src/components/crud-table.tsx
import { useCrudList, useCrudDelete } from '@/lib/crud';

interface CrudTableProps {
  resource: string;          // e.g., 'api.rgw.role@1.0'
  columns: ColumnDef[];      // 列定义
  filters?: FilterDef[];     // 筛选条件
}

export function CrudTable({ resource, columns, filters }: CrudTableProps) {
  const { data, isLoading } = useCrudList(resource);
  const deleteMutation = useCrudDelete(resource);

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onDelete={(row) => deleteMutation.mutate(row.id)}
    />
  );
}
```

### 4. 权限控制模式

```tsx
// src/hooks/use-permission.ts
export function usePermission(scope: string): boolean {
  const { permissions } = useAuthStore();
  return permissions?.some(p => p.scope === scope) ?? false;
}

// 使用
function HostActions() {
  const canWrite = usePermission('hosts');
  return canWrite ? <Button>Add Host</Button> : null;
}

// 声明式组件
<PermissionGuard scope="hosts" fallback={null}>
  <Button onClick={handleAdd}>Add Host</Button>
</PermissionGuard>
```

### 5. 侧边栏菜单模式

```tsx
// src/routes/navigation.ts
export const navigationItems = [
  {
    label: 'Overview',
    path: '/overview',
    icon: DashboardIcon,
  },
  {
    label: 'Cluster',
    icon: ClusterIcon,
    children: [
      { label: 'Hosts', path: '/hosts', scope: 'hosts' },
      { label: 'Monitors', path: '/monitor', scope: 'monitor' },
      { label: 'OSD', path: '/osd', scope: 'osd' },
      // ...
    ],
  },
  {
    label: 'Block',
    icon: BlockIcon,
    feature: 'rbd',  // 需要 feature toggle 启用
    children: [
      { label: 'RBD', path: '/block/rbd' },
      { label: 'iSCSI', path: '/block/iscsi', feature: 'iscsi' },
      { label: 'NVMe-oF', path: '/block/nvmeof', feature: 'nvmeof' },
    ],
  },
  // ...
];
```

### 6. 表单模式

```tsx
// 使用 react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const hostSchema = z.object({
  hostname: z.string().min(1, 'Hostname is required'),
  addresses: z.array(z.string()).min(1),
  labels: z.array(z.string()).optional(),
});

type HostFormValues = z.infer<typeof hostSchema>;

function HostForm({ defaultValues, onSubmit }) {
  const form = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="hostname" render={({ field }) => (
          <FormItem>
            <FormLabel>Hostname</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {/* ... */}
        <SubmitButton isLoading={form.formState.isSubmitting}>Save</SubmitButton>
      </form>
    </Form>
  );
}
```

## 后端集成设计

### 方案 A: 独立前端 (推荐)

React 应用完全独立部署，后端仅负责 API 服务，不再提供静态文件。

**优点**:
- 前后端完全解耦
- 前端可独立更新部署
- 开发体验最佳

**改动**:
- 后端 `HomeController` 可保留作为后备
- 前端通过反向代理 (nginx) 部署
- API 跨域处理 (CORS) 或同源代理

### 方案 B: 后端内嵌 (兼容现有模式)

React 构建产物放入 `front2/dist/`，后端 `HomeController` 修改为同时支持两种前端。

**优点**:
- 不改变部署方式
- 兼容现有 CMake 构建流程

**改动**:
- 修改 `module.py` 添加 `front2/dist` 路径支持
- 修改 `HomeController` 的 `LanguageMixin` 适配 Vite 输出结构
- Vite 输出: 单一 `index.html` + assets (无语言子目录)
- i18n 改为运行时切换，不再按语言构建

**推荐方案 B** 作为迁移过渡 (保持兼容)，迁移完成后可考虑方案 A。

### API 版本头处理

```ts
// src/lib/api-client.ts
import ky from 'ky';

const CEPH_API_VERSION = 'application/vnd.ceph.api.v1.0+json';

export const apiClient = ky.create({
  prefixUrl: '',  // 相对路径
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set('Accept', CEPH_API_VERSION);
        request.headers.set('Content-Type', 'application/json');

        // 多集群: 注入远程集群 token
        const currentCluster = multiClusterStore.getState().currentCluster;
        if (currentCluster?.token) {
          request.headers.set('Authorization', `Bearer ${currentCluster.token}`);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          authStore.getState().clearAuth();
          window.location.hash = '#/login';
        }
      },
    ],
  },
});
```

## 渐进式迁移策略

### 并行运行期间的路由分流

在迁移期间，Angular 和 React 前端并行运行:

**方案 1: 端口分流 (开发环境)**
- Angular: `https://localhost:4200` (现有)
- React: `https://localhost:4201` (新增)
- 开发者根据需要选择端口

**方案 2: 路径分流 (可选)**
- 在后端添加路由规则，将已迁移的路径重定向到 React 前端
- 未迁移的路径继续使用 Angular 前端
- 复杂度较高，建议仅在需要单一入口时使用

**推荐方案 1**: 开发期间两个端口独立运行，功能对等后再切换。

### 迁移顺序原则

1. **先基础后业务**: 认证 → 布局 → 概览 → 各业务模块
2. **先简单后复杂**: 登录 → 列表页 → 详情页 → 复杂表单/向导
3. **先独立后关联**: 独立功能 (用户管理) → 关联功能 (RBD + Pool + Mirroring)
4. **先验证后批量**: 每完成一个模块，验证通过后再开始下一个
