# 服务器部署（Docker + GitHub Hook）

## 1. 云服务器初始化

```bash
# Ubuntu
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

重新登录后生效。

## 2. 首次部署

```bash
git clone <your-repo-url> /opt/yourcloud
cd /opt/yourcloud
cp infra/env.prod.example infra/.env.prod
```

编辑 `infra/.env.prod`，至少设置：
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `WEB_PORT`（默认 `8088`，避免占用 80）
- `API_PORT`（默认 `18080`，容器内 API 端口，避免使用 8080）
- `API_HOST_PORT`（默认 `18080`，宿主机映射端口，供 1Panel 转发）

然后执行：

```bash
chmod +x scripts/deploy.prod.sh
./scripts/deploy.prod.sh
```

## 3. GitHub Hook 自动部署（流水线 + GHCR）

仓库已提供：`.github/workflows/deploy.yml`

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中新增：

- `DEPLOY_HOST`：云服务器 IP/域名
- `DEPLOY_USER`：SSH 用户（如 `ubuntu`）
- `DEPLOY_SSH_KEY`：私钥内容（建议专用 deploy key）
- `DEPLOY_PORT`：SSH 端口（可选，默认 22）
- `DEPLOY_PATH`：项目在服务器上的绝对路径（如 `/opt/yourcloud`）
- `GHCR_USER`：用于 `docker login ghcr.io` 的用户名（通常是 GitHub 用户名）
- `GHCR_TOKEN`：具有 `read:packages` 权限的令牌（用于服务器拉取 GHCR 镜像）

完成后，每次 push 到 `main` 会自动 SSH 到服务器执行：

```bash
./scripts/deploy.prod.sh
```

说明：
- CI 会构建并推送两个镜像到 GHCR：`api` 与 `web`
- 服务器不再本地构建，只负责 `docker pull` + `docker compose up -d`
- Web 已按 `/cloud/` 子路径构建，Nginx 暴露入口为 `/cloud/`
- 推荐由 1Panel 统一做反向代理：`/cloud/` -> web，`/cloud/api/` -> api

## 4. 常用运维命令

```bash
# 查看容器状态
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps

# 查看日志
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs -f

# 重启服务
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml restart
```

## 5. 访问入口

- 网站：`http://<server-ip>:<WEB_PORT>/cloud/`
- API 健康检查（直连）：`http://<server-ip>:<API_HOST_PORT>/health`

## 6. 1Panel 路由建议（方案 A）

- 路由 1：`/cloud/` -> `http://127.0.0.1:<WEB_PORT>/cloud/`
- 路由 2：`/cloud/api/` -> `http://127.0.0.1:<API_HOST_PORT>/api/`
