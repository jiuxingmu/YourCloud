# YourCloud

## 项目简介

YourCloud 是一个写给所有人的开源云盘：不限速、跨平台、稳定可靠。  
我们相信，文件不该被速度限制，不该被平台锁定，也不该被黑盒服务绑架。

这个项目的目标很直接：
- 做一个真正“好用”的云盘，开箱即用，长期可维护
- 保持代码公开透明，让每个人都能参与改进
- 支持自部署，把数据控制权还给用户和团队

如果你也在寻找一个能长期使用、可持续演进的云盘项目，欢迎一起把它打磨成社区共建的基础设施。

## 技术栈

- **服务端**：Go、Gin、GORM、PostgreSQL
- **前端**：React、Vite、TypeScript、MUI
- **本地基础设施**：Docker（PostgreSQL）
- **测试**：Vitest（前端）、Go test（后端）

## 本地编译与运行

### 1) 环境要求

- Docker
- Go
- Node.js + npm

### 2) 一键启动（推荐）

```bash
./scripts/dev.sh
```

启动后：
- Web：`http://localhost:8082/`
- API：`http://localhost:8080/`

健康检查：

```bash
curl http://localhost:8080/health
```

### 3) 单独编译（可选）

前端：

```bash
cd clients/web
npm install
npm run build
```

后端：

```bash
cd services/api-go
go build ./...
```

### 4) 运行测试（可选）

前端：

```bash
cd clients/web
npm test
```

后端：

```bash
cd services/api-go
go test ./...
```

## 功能进展

### 已完成

- 账号：注册、登录、登出（JWT）
- 文件：列表、上传、下载、删除、移动
- 文件夹：创建与层级导航
- 分享：创建分享、按 token 访问、提取码校验、下载
- 视图：最近、星标、回收站（Web）
- 基础测试与回归文档体系

### 待完成（下一阶段）

- 多端扩展（Android / iOS / Desktop）
- 更完整的预览能力（如 Office 等格式）
- 更强上传能力（大文件分片、断点续传）
- 权限与协作能力（更细粒度权限、多人协作）
- 私有化与多云存储配置体验优化
