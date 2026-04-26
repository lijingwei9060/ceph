# Phase 11: 后端集成与清理

## 工作目标

完成 React 前端与 Ceph 后端的集成，清理 Angular 旧版本代码，完善翻译和测试覆盖。

完成标志：React 前端可通过 Ceph Dashboard 后端正确部署和运行，Angular 代码已清理，所有语言翻译完整，E2E 测试覆盖关键流程。

## 工作内容

### 11.1 后端集成修改

#### 11.1.1 修改 home.py

**文件**: `src/pybind/mgr/dashboard/home.py`

- 更新静态文件服务路径，指向 `frontend2/dist/`
- 配置 SPA fallback，所有未匹配路由返回 `index.html`
- 确保 hash router 模式正确工作

```python
# 示例修改
class Home(BaseController):
    @Endpoint('/')
    def index(self):
        # 返回 frontend2/dist/index.html
        pass
```

#### 11.1.2 修改 module.py

**文件**: `src/pybind/mgr/dashboard/module.py`

- 更新前端静态资源路径配置
- 添加 frontend2 相关配置选项
- 确保开发/生产模式正确切换

#### 11.1.3 修改 CMakeLists.txt

**文件**: `src/pybind/mgr/dashboard/CMakeLists.txt`

- 添加 frontend2 构建步骤
- 配置前端资源安装路径
- 更新构建依赖

```cmake
# 示例修改
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/frontend2/dist
    COMMAND cd ${CMAKE_CURRENT_SOURCE_DIR}/frontend2 && pnpm install && pnpm build
    COMMENT "Building React frontend"
)
```

#### 11.1.4 更新构建脚本

**文件**: `src/pybind/mgr/dashboard/frontend2/package.json`

- 添加构建后资源复制脚本
- 配置生产环境变量

### 11.2 Angular 版本清理

#### 11.2.1 删除 Angular 前端目录

```bash
rm -rf src/pybind/mgr/dashboard/frontend/
```

#### 11.2.2 清理相关配置

- 移除 Angular 构建相关配置
- 清理 package-lock.json 或 yarn.lock
- 更新 .gitignore

#### 11.2.3 更新文档引用

- 更新所有指向 Angular 前端的文档链接
- 更新开发者指南中的说明

### 11.3 翻译完善

#### 11.3.1 从 Angular 提取翻译

**源文件**: `src/pybind/mgr/dashboard/frontend/src/locale/messages.*.xlf`

**目标**: 将 XLF 格式翻译转换为 JSON 格式

**工具**: 可编写脚本自动转换

```bash
# 转换脚本示例
python scripts/convert_xlf_to_json.py
```

#### 11.3.2 完成各语言翻译

| 语言 | 文件 | 状态 |
|------|------|------|
| en-US | en-US.json | ✅ 完成 |
| zh-CN | zh-CN.json | ✅ 完成 |
| de | de.json | ⏳ 待翻译 |
| es | es.json | ⏳ 待翻译 |
| fr | fr.json | ⏳ 待翻译 |
| it | it.json | ⏳ 待翻译 |
| ja | ja.json | ⏳ 待翻译 |
| ko | ko.json | ⏳ 待翻译 |
| pl | pl.json | ⏳ 待翻译 |
| pt-BR | pt-BR.json | ⏳ 待翻译 |
| ru | ru.json | ⏳ 待翻译 |
| tr | tr.json | ⏳ 待翻译 |
| zh-TW | zh-TW.json | ⏳ 待翻译 |

#### 11.3.3 验证翻译完整性

- 使用 i18next `missingKeyHandler` 检查缺失 key
- 逐语言验证页面显示
- 确保无 raw key 暴露

### 11.4 E2E 测试扩展

#### 11.4.1 扩展测试用例

**文件**: `e2e/`

| 测试文件 | 测试内容 |
|---------|---------|
| `login.spec.ts` | 登录/登出流程 |
| `hosts.spec.ts` | 主机列表浏览、添加主机 |
| `osd.spec.ts` | OSD 列表浏览、标记操作 |
| `pools.spec.ts` | 存储池创建、编辑、删除 |
| `rbd.spec.ts` | RBD 镜像 CRUD |
| `rgw.spec.ts` | RGW 用户/存储桶管理 |
| `monitoring.spec.ts` | 告警列表、Silence 管理 |
| `users.spec.ts` | 用户管理、角色分配 |
| `i18n.spec.ts` | 语言切换验证 |

#### 11.4.2 CI 集成

**文件**: `.github/workflows/frontend2-e2e.yml`

```yaml
name: Frontend2 E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e
```

#### 11.4.3 测试报告

- 配置 HTML 报告输出
- 失败时上传截图和 trace
- 测试覆盖率统计

### 11.5 验证与部署

#### 11.5.1 集成测试

- 在开发环境验证后端集成
- 测试 SSO 登录流程
- 验证多集群场景

#### 11.5.2 性能测试

- 使用 Lighthouse 评估首屏加载
- 验证懒加载效果
- 检查内存使用

#### 11.5.3 生产部署

- 更新部署文档
- 验证构建产物安装
- 回归测试所有功能

## 校验方法

| # | 校验项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1 | 后端集成 | 启动 Ceph Dashboard | React 前端正确加载 |
| 2 | 静态资源 | 访问各页面 | 所有资源正确加载 |
| 3 | SPA 路由 | 刷新非根页面 | 正确显示页面（非 404） |
| 4 | Angular 清理 | 检查代码库 | frontend/ 目录已删除 |
| 5 | 构建脚本 | 运行 cmake 构建 | frontend2 正确构建和安装 |
| 6 | 翻译完整性 | 切换 13 种语言 | 所有文本正确显示 |
| 7 | E2E 测试 | 运行 pnpm test:e2e | 所有测试通过 |
| 8 | CI 集成 | 触发 GitHub Action | E2E 测试在 CI 中运行 |
| 9 | SSO 登录 | 完成 SAML2 流程 | 登录成功 |
| 10 | 多集群 | 切换集群并操作 | 数据正确，无串扰 |

## 文件变更清单

### 新增文件
- `.github/workflows/frontend2-e2e.yml` - CI 配置
- `scripts/convert_xlf_to_json.py` - 翻译转换脚本

### 修改文件
- `src/pybind/mgr/dashboard/home.py` - 静态文件服务
- `src/pybind/mgr/dashboard/module.py` - 前端配置
- `src/pybind/mgr/dashboard/CMakeLists.txt` - 构建配置
- `src/pybind/mgr/dashboard/frontend2/src/i18n/locales/*.json` - 完善翻译
- `src/pybind/mgr/dashboard/frontend2/e2e/*.spec.ts` - 扩展测试

### 删除文件
- `src/pybind/mgr/dashboard/frontend/` - Angular 旧版本目录

## 工作量估算

| 任务 | 预计时间 |
|------|----------|
| 后端集成修改 | 2-3 天 |
| Angular 清理 | 0.5 天 |
| 翻译完善 | 3-5 天 |
| E2E 测试扩展 | 2-3 天 |
| 验证与部署 | 1-2 天 |
| **总计** | **8-13 天** |

## 风险与依赖

1. **后端 API 兼容性**: 需确保现有 API 与 React 前端兼容
2. **构建系统集成**: CMake 构建可能需要调整 Node.js 版本要求
3. **翻译质量**: 自动转换可能需要人工校对
4. **E2E 测试环境**: 需要完整的 Ceph 测试环境

## 备注

此阶段完成后，React 前端迁移工作将正式完成。后续维护将聚焦于：
- 功能增强
- 性能优化
- 安全更新
- 新版本适配
