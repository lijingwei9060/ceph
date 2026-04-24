# Phase 9: 监控告警模块

## 工作目标

迁移 Prometheus 告警、告警规则、Silences、Grafana 集成等监控页面。完成后，用户可以在 React 应用中查看和管理监控告警。

完成标志：监控告警模块下所有页面可正常访问和操作，与 Angular 版本功能对等。

## 工作内容

### 9.1 迁移活跃告警

- 告警列表 → `src/features/monitoring/alerts/pages/active-alerts.tsx`
  - 使用 shadcn DataTable
  - 列：严重性（图标+颜色）、告警名、状态、标签、注解、触发时间
  - 严重性颜色：critical 红、warning 黄、info 蓝
  - 筛选：按严重性、状态过滤

### 9.2 迁移告警规则

- 规则列表 → `src/features/monitoring/alerts/pages/rules-list.tsx`
  - 按规则组分组展示
  - 展开规则组显示规则详情：表达式、for 持续时间、标签、注解
- 规则组 CRUD：
  - 创建规则组 → `src/features/monitoring/alerts/components/rule-group-form.tsx`
  - 编辑/删除规则组

### 9.3 迁移 Silences

- Silence 列表 → `src/features/monitoring/silences/pages/silence-list.tsx`
  - 列：匹配器、创建者、开始时间、结束时间、状态（活跃/过期）
  - 过期 Silence 灰色显示
  - 操作：创建、编辑、删除（过期）
- Silence 创建/编辑 → `src/features/monitoring/silences/components/silence-form.tsx`
  - 匹配器配置：键值对 + 正则匹配开关
  - 日期时间选择器：开始时间、持续时间（或结束时间）
  - 创建者、注释
  - 使用 `react-hook-form` + `zod` 验证

### 9.4 迁移 Grafana 集成

- Grafana 嵌入面板 → `src/features/monitoring/grafana/pages/grafana-dashboard.tsx`
  - 使用 iframe 嵌入 Grafana 仪表盘
  - URL 从 `GET /api/grafana` 获取
  - 处理 iframe 加载错误（Grafana 未配置时显示提示信息）

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 告警列表 | 导航到活跃告警页面 | 表格正确显示所有告警 |
| 2 | 告警严重性颜色 | 检查不同严重性的告警行 | critical 红、warning 黄、info 蓝 |
| 3 | 告警筛选 | 按严重性过滤 | 过滤正确 |
| 4 | 规则组列表 | 导航到告警规则页面 | 按组展示，展开后显示规则 |
| 5 | 规则组 CRUD | 创建 → 编辑 → 删除规则组 | 全流程正常 |
| 6 | Silence 列表 | 导航到 Silences 页面 | 列表正确显示活跃和过期 Silence |
| 7 | Silence 创建 | 填写匹配器、时间、注释 | 创建成功，列表刷新 |
| 8 | Silence 过期 | 等待 Silence 过期 | 状态变为过期，灰色显示 |
| 9 | Silence 删除 | 删除一个 Silence | 删除成功 |
| 10 | 日期时间选择 | 在 Silence 表单中选择时间 | 选择器正常工作 |
| 11 | Grafana 嵌入 | 配置 Grafana 后查看 | iframe 正常加载 Grafana 仪表盘 |
| 12 | Grafana 未配置 | 未配置 Grafana 时查看 | 显示友好提示而非空白 |
| 13 | 功能对比 | 对比 Angular 版本 | 功能无遗漏 |
