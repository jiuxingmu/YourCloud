# YourCloud

KMP + Ktor + PostgreSQL 的云盘项目骨架。

## 当前已落地

- `apps/shared`：KMP 共享模型模块（`commonMain`）
- `apps/backend`：Ktor 服务（注册/登录、上传、文件列表、下载、分享）
- `apps/web`：Kotlin/JS Web 页面（登录、上传、列表、下载、分享查看）
- `infra/docker-compose.yml`：PostgreSQL 本地环境
- `apps/backend` 单元测试：`AuthServiceTest`、`ShareServiceTest`、`ApplicationErrorTest`

## 本地启动（当前推荐）

1. 启动 PostgreSQL

```bash
docker compose -f infra/docker-compose.yml up -d
```

2. 启动后端

```bash
DB_URL="jdbc:postgresql://localhost:5432/yourcloud" \
DB_USER="yourcloud" \
DB_PASSWORD="yourcloud" \
JWT_SECRET="dev-secret" \
./gradlew :apps:backend:run
```

3. 启动前端

```bash
./gradlew :apps:web:jsBrowserDevelopmentRun
```

## 访问地址

- Web：`http://localhost:8082/`
- Backend：`http://localhost:8080/`

## 已实现的体验优化

- 上传支持进度显示、超时控制和自动重试
- 上传支持手动取消
- 分享查看失败时会显示更明确的错误提示（如不存在、无权限、过期）
- 后端统一未处理异常返回格式：`{"message":"..."}`，便于前端展示

## 注意事项

- 当前仓库中没有可用的 `scripts/dev.sh`，请按上面的三步手动启动
- 后端文件存储目前仍是本地文件存储（`LocalFileStorage`），用于 MVP 闭环
