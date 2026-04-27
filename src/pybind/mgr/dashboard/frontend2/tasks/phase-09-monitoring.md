# Phase 9: 监控告警模块 — Summary

**Date**: 2026-04-26
**Branch**: feature/lijw-newdashboard

## 完成任务

### 1. 监控告警 API Hooks
**文件**: `src/features/monitoring/api/use-prometheus.ts`

**类型定义**:
- `GrafanaUrl` - Grafana 实例 URL
- `PrometheusAlertLabels` - 告警标签
- `PrometheusAlertAnnotations` - 告警注解
- `PrometheusAlert` - Prometheus 告警
- `PrometheusAlertGroup` - 告警分组
- `AlertmanagerAlert` - Alertmanager 告警
- `AlertmanagerAlertStatus` - 告警状态
- `PrometheusRule` - 告警规则
- `PrometheusRuleGroup` - 规则组
- `PrometheusRulesResponse` - 规则响应
- `AlertmanagerSilenceMatcher` - 静默匹配器
- `AlertmanagerSilenceStatus` - 静默状态
- `AlertmanagerSilence` - 静默规则

**API Hooks**:
- `useGrafanaUrl()` — GET `/api/grafana/url`
- `usePrometheusAlerts()` — GET `/api/prometheus` (告警分组)
- `useAlertmanagerAlerts()` — GET `/api/prometheus` (Alertmanager 告警)
- `usePrometheusRules(type)` — GET `/api/prometheus/rules`，支持按类型过滤
- `useFlattenedRules(type)` — 扁平化规则列表，附带组名
- `usePrometheusSilences()` — GET `/api/prometheus/silences`
- `useSilence(id)` — 获取单个静默规则
- `useCreateSilence()` — POST `/api/prometheus/silence`
- `useDeleteSilence()` — DELETE `/api/prometheus/silence/{id}`

### 2. 活跃告警列表页面
**文件**: `src/features/monitoring/alerts/pages/active-alerts.tsx`

- DataTable 展示：Name、Summary、Severity、State、Started、URL
- 严重性颜色：critical 红、warning 黄、info 蓝
- 状态颜色：active 蓝、unprocessed 黄、suppressed 灰
- 筛选功能：按严重性、状态过滤
- 点击行跳转创建 Silence
- 外部链接跳转 Prometheus

### 3. 告警规则列表页面
**文件**: `src/features/monitoring/alerts/pages/rules-list.tsx`

- 按规则组展示，可展开/折叠
- 规则组卡片：显示规则数量、活跃告警数
- 规则详情：Name、Severity、Duration、Health、活跃告警数、Summary
- 展开/折叠动画
- 过滤只显示 alerting 类型规则

### 4. Silences 列表页面
**文件**: `src/features/monitoring/silences/pages/silence-list.tsx`

- DataTable：匹配器、创建者、备注、开始时间、结束时间、状态
- 匹配器显示：支持正则匹配显示 `~=`
- 状态颜色：active 绿、pending 黄、expired 灰
- 过期 Silence 灰色显示（opacity-50）
- 操作菜单：
  - 编辑（未过期）
  - 重建（已过期）
  - 删除/过期
- 删除确认对话框

### 5. Silence 表单组件
**文件**: `src/features/monitoring/silences/components/silence-form.tsx`

- 支持模式：创建、编辑、重建、从告警创建
- 匹配器配置：
  - 名称、值、正则开关
  - 添加/删除匹配器
  - 至少需要一个匹配器验证
- 时间设置：
  - 开始时间（datetime-local）
  - 持续时间选择器（1h~1周）
  - 结束时间（自动计算/手动修改）
- 其他信息：创建者、备注
- react-hook-form + zod 验证

### 6. Grafana 嵌入面板
**文件**: `src/features/monitoring/grafana/pages/grafana-dashboard.tsx`

- iframe 嵌入 Grafana 仪表盘
- 未配置时显示友好提示
- 新窗口打开按钮
- 自适应高度

### 7. 路由配置
**文件**: `src/routes/index.tsx`

- `/monitoring` → 重定向到 `/monitoring/alerts`
- `/monitoring/alerts` → 活跃告警页面
- `/monitoring/rules` → 告警规则页面
- `/monitoring/silences` → Silences 列表
- `/monitoring/silences/create` → 创建 Silence
- `/monitoring/silences/create/:id` → 从告警创建 Silence
- `/monitoring/silences/edit/:id` → 编辑 Silence
- `/monitoring/silences/recreate/:id` → 重建 Silence
- `/monitoring/grafana` → Grafana 面板

### 8. 导航配置
**文件**: `src/routes/nav-config.ts`

- Monitoring 顶级菜单，使用 Activity 图标
- 权限：`prometheus`
- 子菜单：
  - Active Alerts（活跃告警）
  - Alert Rules（告警规则）
  - Silences（静默规则）
  - Grafana（需要 grafana 权限）

### 9. 集成测试
**文件**: `src/features/monitoring/api/use-prometheus.test.tsx` (10 tests)

- useGrafanaUrl
- usePrometheusAlerts
- usePrometheusSilences
- usePrometheusRules（含类型过滤）
- useFlattenedRules
- useSilence（含 null guard）
- useCreateSilence
- useDeleteSilence

## 验证结果
- `npx tsc --noEmit` — PASSED (0 errors)
- `npx vite build` — PASSED (build successful)
- `npx vitest run` — 223 tests passed (34 test files)，含 10 个新增 monitoring 测试

## 使用的 API

| API 端点 | 方法 | 用途 |
|---------|------|------|
| `/api/grafana/url` | GET | 获取 Grafana 实例 URL |
| `/api/prometheus` | GET | 获取活跃告警 |
| `/api/prometheus/rules` | GET | 获取告警规则 |
| `/api/prometheus/silences` | GET | 获取静默规则列表 |
| `/api/prometheus/silence` | POST | 创建静默规则 |
| `/api/prometheus/silence/{id}` | DELETE | 删除/过期静默规则 |

## 迁移页面对照

| Angular 页面 | React 页面 | 功能对等 |
|-------------|-----------|---------|
| active-alert-list | active-alerts.tsx | ✅ 完整迁移 |
| rules-list | rules-list.tsx | ✅ 完整迁移 |
| silence-list | silence-list.tsx | ✅ 完整迁移 |
| silence-form | silence-form.tsx | ✅ 完整迁移 |
| Grafana 嵌入 | grafana-dashboard.tsx | ✅ 完整迁移 |

## 文件变更

| 文件 | 操作 | 描述 |
|------|------|------|
| `src/features/monitoring/api/use-prometheus.ts` | 新增 | Prometheus API hooks + 类型定义 |
| `src/features/monitoring/api/use-prometheus.test.tsx` | 新增 | API hooks 测试 |
| `src/features/monitoring/api/use-monitoring.ts` | 修改 | 重导出新的 hooks |
| `src/features/monitoring/alerts/pages/active-alerts.tsx` | 新增 | 活跃告警列表页面 |
| `src/features/monitoring/alerts/pages/rules-list.tsx` | 新增 | 告警规则列表页面 |
| `src/features/monitoring/silences/pages/silence-list.tsx` | 新增 | Silences 列表页面 |
| `src/features/monitoring/silences/pages/silence-form-page.tsx` | 新增 | 表单页面入口 |
| `src/features/monitoring/silences/components/silence-form.tsx` | 新增 | Silence 表单组件 |
| `src/features/monitoring/grafana/pages/grafana-dashboard.tsx` | 新增 | Grafana 嵌入面板 |
| `src/routes/index.tsx` | 修改 | 添加监控告警路由 |
| `src/routes/nav-config.ts` | 修改 | 添加 Monitoring 顶级菜单 |
| `src/components/layouts/workbench-layout.tsx` | 修改 | 添加 Activity 图标 |
| `src/components/ui/alert-dialog.tsx` | 新增 | AlertDialog 组件 |
