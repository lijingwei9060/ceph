# Ceph Dashboard 前端集成测试指南

## 背景

Ceph Dashboard 后端由 `mgr` 模块中的 CherryPy 服务器提供，默认 HTTPS 端口 8443。前端通过两种方式与后端交互：

- `/api/*` — 公共 REST API（`@APIRouter`）
- `/ui-api/*` — 前端专用 API（`@UIRouter`）

认证基于 JWT Token，通过 cookie `token` 或 `Authorization: Bearer` 头传递。所有 API 请求必须携带 `Accept: application/vnd.ceph.api.v1.0+json` 头，否则返回 415。

## Rook 环境下的 Dashboard 访问信息

### 获取 Dashboard 地址和密码

```bash
# 获取 Dashboard URL（mgr 所在节点 + NodePort）
HOST=$(kubectl get pods -n rook-ceph -l "app=rook-ceph-mgr" -o json | jq .items[0].spec.nodeName | tr -d '"')
PORT=$(kubectl get svc -n rook-ceph rook-ceph-mgr-dashboard-external-https -o yaml | grep nodePort: | awk '{print $2}')
DASHBOARD_URL="https://${HOST}:${PORT}"
echo "Dashboard URL: $DASHBOARD_URL"

# 如果用 minikube
# HOST=$(minikube ip)

# 获取 admin 密码（Rook 自动生成）
PASSWD=$(kubectl -n rook-ceph get secret rook-ceph-dashboard-password -o yaml | grep "password:" | awk '{print $2}' | base64 --decode)
echo "Admin password: $PASSWD"
```

### 验证后端可用

> **重要**：所有 Dashboard API 请求必须携带 `Accept: application/vnd.ceph.api.v1.0+json` 头，否则返回 `415 Unsupported Media Type`。
> Rook 自动生成的 admin 密码可能包含特殊字符（`"`、`\`、`$` 等），**不能**直接拼接到 JSON 字符串中，必须用 `jq -n --arg` 安全构造 JSON。

```bash
# 测试健康检查
curl -k -s -H "Accept: application/vnd.ceph.api.v1.0+json" \
  ${DASHBOARD_URL}/api/health | jq .

# 测试登录（用 jq 构造 JSON，避免密码特殊字符破坏 JSON 结构）
JSON_BODY=$(jq -n --arg u "admin" --arg p "${PASSWD}" '{"username":$u,"password":$p}')
curl -k -s \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.ceph.api.v1.0+json" \
  -X POST -d "${JSON_BODY}" \
  ${DASHBOARD_URL}/api/auth | jq .

# 预期返回:
# {
#   "token": "eyJ...",
#   "username": "admin",
#   "permissions": { ... }
# }
```

## 方案一：Vite 开发代理（推荐开发阶段）

Vite 的 proxy 将前端请求转发到 Ceph 后端，无需修改后端代码，开发时热更新。

### 1. 获取 Dashboard URL

参考上方，确认 `DASHBOARD_URL`（如 `https://192.168.1.100:31159`）。

### 2. 配置 vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4201,
    // 如果 Rook Dashboard 配置了 url_prefix，需要加到 proxy 路径前
    proxy: {
      '/api': {
        target: DASHBOARD_URL,   // 如 'https://192.168.1.100:31159'
        secure: false,           // 自签名证书，跳过验证
        changeOrigin: true,
      },
      '/ui-api': {
        target: DASHBOARD_URL,
        secure: false,
        changeOrigin: true,
      },
      '/auth': {
        target: DASHBOARD_URL,
        secure: false,
        changeOrigin: true,
      },
      '/docs': {
        target: DASHBOARD_URL,
        secure: false,
        changeOrigin: true,
      },
    },
  },
});
```

> **注意**：`target` 不能硬编码，因为每个 Rook 环境地址不同。建议通过环境变量注入：

```ts
// vite.config.ts
const dashboardUrl = process.env.CEPH_DASHBOARD_URL || 'https://localhost:8443';

export default defineConfig({
  server: {
    proxy: {
      '/api': { target: dashboardUrl, secure: false, changeOrigin: true },
      '/ui-api': { target: dashboardUrl, secure: false, changeOrigin: true },
      '/auth': { target: dashboardUrl, secure: false, changeOrigin: true },
    },
  },
});
```

启动命令：

```bash
CEPH_DASHBOARD_URL=https://192.168.1.100:31159 npm run dev
```

### 3. 处理 CORS（如需要）

Vite 代理默认绕过 CORS（浏览器请求发到 localhost:4201，由 Vite 服务端转发）。如果遇到 CORS 问题，确认代理配置的 `changeOrigin: true` 已设置。

如果 Dashboard 后端配置了 `cross_origin_url`，也可以添加前端开发地址：

```bash
# 在 Rook 容器内执行
kubectl exec -n rook-ceph deploy/rook-ceph-tools -- \
  ceph config set mgr mgr/dashboard/cross_origin_url "http://localhost:4201"
```

> 通常不需要这一步，因为 Vite 代理已经绕过了浏览器的同源限制。

### 4. 登录测试

浏览器访问 `http://localhost:4201`，输入 admin 密码登录。

### 局限性

- 登录成功后后端设置的 `token` cookie 的 `Secure` 标记为 `True`，`SameSite` 为 `Strict`——由于代理场景下浏览器通过 HTTP 访问 localhost，**cookie 可能不会被浏览器保存**。
- 需要前端手动处理 token 存储（见下方 ky 客户端配置）。

## 方案二：Nginx 反向代理（推荐完整集成测试）

在 Vite 前端和 Ceph 后端之间加一层 Nginx，统一为 HTTPS，解决 cookie 问题。

### 1. 生成自签名证书

```bash
mkdir -p /tmp/ceph-proxy/certs
openssl req -x509 -newkey rsa:2048 -keyout /tmp/ceph-proxy/certs/key.pem \
  -out /tmp/ceph-proxy/certs/cert.pem -days 365 -nodes \
  -subj "/CN=localhost"
```

### 2. Nginx 配置

创建 `/tmp/ceph-proxy/nginx.conf`：

```nginx
events { worker_connections 1024; }

http {
  # 前端静态资源 → Vite 开发服务器
  # API 请求 → Ceph Dashboard 后端
  server {
    listen 8444 ssl;
    ssl_certificate     /tmp/ceph-proxy/certs/cert.pem;
    ssl_certificate_key /tmp/ceph-proxy/certs/key.pem;

    # 前端页面（Vite dev server 或构建产物）
    location / {
      proxy_pass http://localhost:4201;
      proxy_set_header Host $host;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";  # Vite HMR WebSocket
    }

    # API 请求 → Ceph 后端
    location /api/ {
      proxy_pass DASHBOARD_URL;  # 替换为实际地址
      proxy_ssl_verify off;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # UI API 请求 → Ceph 后端
    location /ui-api/ {
      proxy_pass DASHBOARD_URL;
      proxy_ssl_verify off;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # SAML2 SSO → Ceph 后端
    location /auth/ {
      proxy_pass DASHBOARD_URL;
      proxy_ssl_verify off;
      proxy_set_header Host $host;
    }

    # 文档 → Ceph 后端
    location /docs/ {
      proxy_pass DASHBOARD_URL;
      proxy_ssl_verify off;
    }
  }
}
```

将配置中的 `DASHBOARD_URL` 替换为实际地址（如 `https://192.168.1.100:31159`）。

### 3. 启动 Nginx

```bash
docker run -d --name ceph-proxy \
  -p 8444:8444 \
  -v /tmp/ceph-proxy/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /tmp/ceph-proxy/certs:/tmp/ceph-proxy/certs:ro \
  nginx:alpine
```

### 4. 访问

浏览器访问 `https://localhost:8444`，此时：
- 所有请求走 HTTPS → cookie `Secure` 标记正常工作
- `SameSite: Strict` 正常工作（同源）
- 前端页面由 Vite 提供（支持 HMR 热更新）
- API 请求转发到 Ceph 后端

## 方案三：构建产物部署（最终验证）

将 React 构建产物放到 Ceph 后端的静态文件目录，完全模拟生产环境。

### 1. 构建前端

```bash
cd front2
npm run build
# 产物在 dist/ 目录
```

### 2. 将构建产物复制到 Ceph 容器

```bash
# 找到 mgr 容器
MGR_POD=$(kubectl get pods -n rook-ceph -l "app=rook-ceph-mgr" -o json | jq .items[0].metadata.name -r)

# 查看当前前端目录
kubectl exec -n rook-ceph $MGR_POD -- ls -la /usr/share/ceph/mgr/dashboard/frontend/dist/

# 备份原有前端
kubectl exec -n rook-ceph $MGR_POD -- mv /usr/share/ceph/mgr/dashboard/frontend /usr/share/ceph/mgr/dashboard/frontend.bak

# 复制新前端到容器（通过 tar 保留目录结构）
tar czf /tmp/front2-dist.tar.gz -C dist .
kubectl cp /tmp/front2-dist.tar.gz rook-ceph/$MGR_POD:/tmp/front2-dist.tar.gz
kubectl exec -n rook-ceph $MGR_POD -- mkdir -p /usr/share/ceph/mgr/dashboard/frontend/dist
kubectl exec -n rook-ceph $MGR_POD -- tar xzf /tmp/front2-dist.tar.gz -C /usr/share/ceph/mgr/dashboard/frontend/dist/
```

> **注意**：后端 `HomeController` 期望前端目录结构为 `frontend/dist/<locale>/index.html`（如 `frontend/dist/en-US/index.html`）。
> Vite 构建产物是 `dist/index.html` 单入口 + `dist/assets/*`，**不按语言分子目录**。
> 因此这种方案需要修改后端 `home.py` 的 `LanguageMixin` 逻辑，或调整 Vite 构建输出结构。
> 这是 Phase 10（后续后端集成任务）要解决的问题。

### 3. 如要快速验证（不修改后端）

可以临时创建语言目录结构来适配后端期望：

```bash
cd dist
mkdir -p en-US
# 将 index.html 和 assets 移入 en-US/
mv index.html en-US/
mv assets en-US/
# 创建符号链接给其他语言
for lang in de es fr it ja ko pl pt-BR ru tr zh-CN zh-TW; do
  ln -s en-US $lang
done
```

## ky 客户端配置要点

后端认证的关键细节：

| 项目 | 值 |
|------|-----|
| 登录 API | `POST /api/auth` body: `{"username":"...","password":"..."}` |
| Token 位置 | 响应 JSON 中的 `token` 字段，同时后端设置 `token` cookie |
| Cookie 名 | `token`（HttpOnly, Secure, SameSite=Strict, path=/） |
| Token 传递方式 | cookie `token`（优先）或 `Authorization: Bearer <token>` |
| API 版本头 | `Accept: application/vnd.ceph.api.v1.0+json` |
| 401 处理 | Token 过期或无效 → 重定向到 `/#/login` |
| 语言 Cookie | `cd-lang`（值如 `en-us`，小写） |
| JWT TTL | 默认 28800 秒（8 小时） |

### ky 实例配置

```ts
// src/lib/api-client.ts
import ky, { type KyInstance } from 'ky';

// 登录后存储 token
let authToken: string | null = localStorage.getItem('ceph_token');

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('ceph_token', token);
}

export function clearToken() {
  authToken = null;
  localStorage.removeItem('ceph_token');
}

export const apiClient: KyInstance = ky.create({
  prefixUrl: '/api',
  headers: {
    Accept: 'application/vnd.ceph.api.v1.0+json',
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // 后端优先读 cookie，但代理场景下 cookie 可能不可用
        // 主动通过 Authorization 头传递 token
        if (authToken) {
          request.headers.set('Authorization', `Bearer ${authToken}`);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          clearToken();
          window.location.hash = '#/login';
        }
      },
    ],
  },
});
```

### 登录流程

```ts
// src/lib/auth.ts
import { apiClient, setToken, clearToken } from './api-client';

export async function login(username: string, password: string) {
  const result = await apiClient.post('auth', {
    json: { username, password },
  }).json<{ token: string; username: string; permissions: Record<string, string[]> }>();

  setToken(result.token);
  return result;
}

export async function logout() {
  try {
    await apiClient.post('auth/logout');
  } finally {
    clearToken();
    window.location.hash = '#/login';
  }
}
```

## 多集群代理

Ceph Dashboard 支持多集群管理。代理请求通过 `POST /api/auth/proxy` 获取目标集群的 token，后续请求携带该 token。

```ts
// 多集群场景：代理请求时使用目标集群的 token
export function createProxyClient(proxyToken: string): KyInstance {
  return apiClient.extend({
    hooks: {
      beforeRequest: [
        (request) => {
          request.headers.set('Authorization', `Bearer ${proxyToken}`);
        },
      ],
    },
  });
}
```

## 快速验证清单

| # | 步骤 | 命令/操作 | 预期 |
|---|------|-----------|------|
| 1 | 获取 Rook Dashboard 地址和密码 | 见上方脚本 | 输出 URL 和密码 |
| 2 | 验证后端可访问 | `curl -k -H "Accept: application/vnd.ceph.api.v1.0+json" $URL/api/health` | 返回 JSON |
| 3 | 验证登录 | 用 `jq -n --arg` 构造 JSON + 加 `Accept` 头（见上方示例） | 返回 token |
| 4 | 启动 Vite 开发服务器 | `CEPH_DASHBOARD_URL=... npm run dev` | localhost:4201 可访问 |
| 5 | 测试 API 代理 | 浏览器访问 `http://localhost:4201/api/health` | 返回后端 JSON |
| 6 | 测试登录 | 在 React 页面输入用户名密码 | 登录成功，跳转概览页 |
| 7 | 测试 Token 传递 | 登录后刷新页面 | 自动恢复登录态（localStorage token） |
| 8 | 测试 401 处理 | Token 过期后操作 | 自动跳转登录页 |
| 9 | 如需 HTTPS cookie | 启动 Nginx 代理方案 | `https://localhost:8444` 正常工作 |

## 推荐开发流程

1. **Phase 0-1（基础设施+共享层）**：使用方案一（Vite 代理），足够验证 API 连通性和认证流程
2. **Phase 2+（页面开发）**：继续使用方案一，如果遇到 cookie 问题切换到方案二（Nginx 代理）
3. **Phase 10（收尾）**：使用方案三（构建产物部署），验证最终集成效果
