# 04 - 测试策略

## 测试层级

### 1. 单元测试 (Vitest)

**范围**: 工具函数、自定义 Hooks、状态管理、API 客户端

**配置**:
```ts
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'cobertura'],
    },
  },
});
```

**优先测试**:
- `src/lib/format.ts` — 所有格式化函数 (对应 Angular Pipes)
- `src/lib/auth.ts` — 认证逻辑
- `src/lib/api-client.ts` — 请求拦截、版本头
- `src/stores/auth-store.ts` — 认证状态
- 每个 API hook — 使用 MSW (Mock Service Worker) mock 后端

**Angular Pipes 对比测试策略**:
```ts
// 对于每个格式化函数，从 Angular 管道中提取测试用例
// 例如 DimlessPipe 的 spec 文件中的 expect 语句
describe('formatDimless', () => {
  // 直接移植 Angular pipe 的测试用例
  it('should format 1024 as 1 KiB', () => {
    expect(formatDimless(1024)).toBe('1 KiB');
  });
});
```

### 2. 组件测试 (Vitest + React Testing Library)

**范围**: 所有 UI 组件、页面组件

**工具**:
- `@testing-library/react` — 组件渲染和交互
- `@testing-library/user-event` — 用户交互模拟
- `msw` — API Mock

**模式**:
```tsx
// 测试页面组件
describe('HostListPage', () => {
  beforeEach(() => {
    // 使用 MSW 设置 API mock
    server.use(
      http.get('/api/host', () => HttpResponse.json(mockHosts))
    );
  });

  it('should display hosts', async () => {
    render(<HostListPage />);
    expect(await screen.findByText('host1')).toBeInTheDocument();
  });

  it('should delete host on confirmation', async () => {
    render(<HostListPage />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    // 验证 DELETE 请求
  });
});
```

### 3. 集成测试

**范围**: 跨组件交互、路由跳转、认证流程

**关键场景**:
- 认证流程: 登录 → 获取权限 → 访问受保护页面 → 登出
- SSO 流程: 重定向 → 回调 → 自动登录
- 路由守卫: 未认证访问 → 重定向登录 → 登录后跳回
- 多集群: 切换集群 → API 代理 → 数据展示
- CRUD 完整流程: 列表 → 创建 → 编辑 → 删除

### 4. E2E 测试 (Playwright)

**范围**: 关键用户流程

**配置**:
```ts
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'https://localhost:4201',
    ignoreHTTPSErrors: true,
  },
});
```

**核心 E2E 场景** (必须通过才能完成迁移):

| 场景 | 步骤 | 验证 |
|---|---|---|
| 登录/登出 | 打开登录页 → 输入凭据 → 点击登录 → 登出 | 概览页显示 → 登录页显示 |
| SSO 登录 | 打开登录页 → 点击 SSO → 完成 IdP 认证 → 回调 | 概览页显示 |
| 密码修改 | 登录 (密码过期) → 修改密码 → 提交 | 跳转到概览页 |
| 主机管理 | 主机列表 → 添加主机 → 编辑主机 → 删除主机 | CRUD 操作成功 |
| OSD 操作 | OSD 列表 → 标记 down → 标记 up → 触发 scrub | 操作状态更新 |
| RBD CRUD | RBD 列表 → 创建 RBD → 编辑大小 → 删除 | 操作成功 |
| 存储池 CRUD | 存储池列表 → 创建副本池 → 编辑 → 删除 | 操作成功 |
| 用户管理 | 用户列表 → 创建用户 → 分配角色 → 删除 | 操作成功 |
| 功能开关 | 禁用 RGW → 侧边栏不显示 RGW 菜单 | 菜单项隐藏 |
| i18n | 切换语言到中文 → 检查菜单和标题 | 文本正确显示 |

### 5. 视觉回归测试

**工具**: Playwright 截图对比

**策略**:
- 每完成一个模块迁移，截取关键页面的截图
- 与 Angular 版本截图对比 (允许 shadcn/ui 风格差异，功能布局应一致)
- 重点关注: 表格布局、表单字段、模态框大小

## 迁移过程中每个阶段的测试检查清单

### Phase 0: 基础设施
- [ ] 开发服务器启动
- [ ] API 代理正常
- [ ] 构建成功
- [ ] 单元测试框架工作
- [ ] i18n 切换正常

### Phase 1: 共享层
- [ ] 登录/登出 API 调用正确
- [ ] 权限检查逻辑正确
- [ ] 所有格式化函数与 Angular 管道输出一致
- [ ] CRUD hooks 列表/详情/创建/更新/删除
- [ ] 路由守卫重定向逻辑

### Phase 2: 核心框架
- [ ] 登录页功能完整 (用户名密码 + SSO)
- [ ] 侧边栏导航正确
- [ ] 概览页数据正确 (5s 自动刷新)
- [ ] 通知 Toast 正常
- [ ] 面包屑导航正确

### Phase 3-9: 功能模块 (每个模块)
- [ ] 列表页: 数据加载、排序、筛选、分页
- [ ] 表单页: 字段验证、提交、错误提示
- [ ] CRUD 操作: 创建、编辑、删除确认
- [ ] 权限控制: 不同角色看到不同内容
- [ ] 功能开关: 模块禁用时隐藏

### Phase 10: 收尾
- [ ] 完整回归测试
- [ ] 13 种语言验证
- [ ] SSO/SAML2 流程
- [ ] 多集群代理
- [ ] CMake 构建流程
- [ ] 部署后静态文件服务

## 对比验证方法

为确保迁移不遗漏功能，采用以下对比方法:

### 1. 路由对比
- 列出 Angular 所有路由及其组件
- 逐一在 React 版本中验证每个路由可访问
- 确认所有子路由、参数路由正常

### 2. API 调用对比
- 在 Angular 版本中记录每个页面的 Network 请求
- 在 React 版本中验证相同的 API 调用
- 确认请求头 (特别是版本头) 一致

### 3. 表单验证对比
- 从 Angular 的 @ngx-formly 配置提取验证规则
- 在 React 版本中使用 zod schema 验证相同规则
- 确认错误消息一致

### 4. 权限对比
- 从 Angular 的 `AuthStorageDirective` 提取权限检查
- 在 React 版本中验证相同的权限逻辑
- 确认无权限时 UI 元素隐藏/禁用

## CI 集成

### GitHub Actions (或项目 CI)
```yaml
# .github/workflows/front2-ci.yml
name: Front2 CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: cd front2 && npm ci
      - run: cd front2 && npm run lint
      - run: cd front2 && npm run test:ci
      - run: cd front2 && npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - run: cd front2 && npm ci
      - run: cd front2 && npx playwright install
      - run: cd front2 && npm run e2e
```
