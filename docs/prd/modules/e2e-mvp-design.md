# YourCloud 端到端 MVP 设计（RN + Go + PostgreSQL + Web）

## 1. 范围与目标

交付一个可运行的端到端最小闭环，覆盖：

1. 登录
2. 上传
3. 文件列表
4. 下载
5. 分享

本设计基于以下约束：

- 移动端客户端：`Expo + React Native + TypeScript`（同时覆盖 Android 与 iOS）
- 后端：`Go + Gin`
- 数据库：`PostgreSQL`
- 鉴权：账号密码 + `JWT`
- 交付形态：单体后端服务 + `Web` + `Mobile (RN: Android + iOS)` 多端

## 2. 来自 PRD 的关键约束

- 必须保证存储可替换，业务层不得强依赖 COS SDK。
- 一期优先 Android + iOS + Web；后端 API 统一复用于多端。
- 支持私有化方向，关键配置通过环境变量注入。
- 客户端技术统一采用 React 技术栈：Web 使用 React + Vite，移动端（Android + iOS）使用 React Native（Expo）。

## 3. 架构设计

### 3.1 目录结构

- `services/api-go`：Go API 服务
- `clients/web`：Web 客户端
- `clients/mobile`：移动端客户端（Expo + React Native，Android + iOS）
- `packages/sdk`：可复用 API SDK（请求封装、类型定义、鉴权与错误处理）
- `infra`：本地运行基础设施（Docker Compose 启 PostgreSQL）
- `docs`：文档与运行说明

### 3.2 后端分层

- `api`：路由与请求/响应模型
- `service`：业务编排
- `domain`：核心实体与存储抽象
- `infrastructure`：
  - `db`（PostgreSQL + GORM）
  - `security`（JWT、密码哈希）
  - `storage`（`StorageProvider` 实现）

存储抽象边界定义如下：

- `StorageProvider.upload(...)`
- `StorageProvider.download(...)`
- `StorageProvider.delete(...)`
- `StorageProvider.getPublicOrSignedUrl(...)`

MVP 阶段可先实现 `LocalStorageProvider`，并保留 `CosStorageProvider` 扩展点。

### 3.3 客户端分层（RN + Web）

- `packages/sdk`：统一请求封装、接口类型、错误模型、鉴权头注入
- `clients/web`：Web 页面与交互（复用 `packages/sdk`）
- `clients/mobile`：Android/iOS 页面与交互（复用 `packages/sdk`）
- 双端 UI 分别实现，接口与数据模型保持一致

## 4. MVP 数据模型

- `users`
  - `id`, `account`, `password_hash`, `role`, `created_at`
- `files`
  - `id`, `owner_id`, `name`, `size`, `mime_type`, `storage_key`, `provider`, `created_at`
- `share_links`
  - `id`, `file_id`, `token`, `expire_at`, `allow_download`, `access_code_hash`, `created_at`

## 5. MVP API 约定

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/files/upload`（MVP 采用后端接收 multipart）
- `GET /api/files`
- `GET /api/files/{id}/download`
- `POST /api/shares`
- `GET /s/{token}`
- `POST /s/{token}/download`

## 6. 关键流程

### 6.1 登录流程

1. 用户提交账号密码
2. 后端校验密码哈希
3. 后端返回 JWT
4. 客户端保存 token 并附带 `Authorization: Bearer <token>`

### 6.2 上传流程

1. 用户选择本地文件
2. 客户端（Web/RN）通过 multipart 发送到后端
3. 后端调用 `StorageProvider` 写入文件
4. 后端在 `files` 表落库元数据
5. 客户端刷新文件列表

### 6.3 下载流程

1. 用户发起下载
2. 后端校验所有权（`owner_id == currentUserId`）
3. 后端通过存储提供器流式返回文件

### 6.4 分享流程

1. 用户为文件创建分享（过期时间 + 可选提取码）
2. 后端生成高熵 token 并写入分享记录
3. 外部用户访问 `/s/{token}`
4. 后端校验 token、有效期、提取码后允许下载

## 7. 安全边界

- 密码仅保存哈希，不保存明文。
- JWT 只保留最小声明（`userId`、`role`、`exp`）。
- 上传大小与类型校验配置化。
- 文件名与路径净化，防止路径穿越。
- 日志禁止输出密码、token、密钥。
- 分享 token 必须不可猜测且可失效。

## 8. Web UI/UX 执行（使用 `ui-ux-pro-max`）

UX 目标：新用户在 3 秒内识别核心操作路径。

### 8.1 优先级

- `P0`：上传、下载、分享入口必须一眼可见。
- `P0`：文件页与上传流程必须具备清晰的空态/加载态/错误态。
- `P1`：统一间距、按钮层级、文案风格。
- `P1`：表单与弹窗提供基础键盘可达与可访问性支持。
- `P2`：视觉细节与信息密度优化。

### 8.2 页面结构

- 登录页：
  - 账号输入
  - 密码输入
  - 登录按钮
- 文件页：
  - 顶部操作栏（上传）
  - 文件列表（名称、大小、时间、操作）
  - 行内操作（下载、分享）
- 分享弹窗：
  - 过期时间设置
  - 可选提取码
  - 生成链接 + 复制
- 分享访问页：
  - 文件信息
  - 可选提取码输入
  - 下载按钮

### 8.3 UX 验收标准

- 新用户 3 秒内可找到上传入口。
- 上传成功后 2 秒内在列表可见。
- 所有异步行为均有加载与错误反馈。
- 按钮语义与层级在各页面保持一致。

## 9. 里程碑

- `M1`：`clients/mobile` 与 `packages/sdk` 脚手架 + 后端联通
- `M2`：鉴权（注册/登录/JWT）+ Web/RN 统一错误处理
- `M3`：文件能力（上传/列表/下载）在 Web/RN 双端打通
- `M4`：分享能力（创建/访问/下载）在 Web/RN 双端打通
- `M5`：基础加固（校验、错误码、文档）+ Android/iOS/Web 一致性检查

## 10. 本期不包含

- 分片上传与断点续传
- 多租户 RBAC
- 回收站/版本管理/搜索/同步
- 直传 COS（放到下一阶段）

## 11. 风险与对策

- 风险：后续切换存储成本高
  - 对策：第一天就强制 `StorageProvider` 边界
- 风险：鉴权链路出错
  - 对策：中间件统一鉴权 + 401/403 集成测试
- 风险：界面可用性不足影响验证速度
  - 对策：按 `ui-ux-pro-max` 的 `P0/P1/P2` 与验收标准执行
- 风险：Web 与 RN 各端迭代导致接口调用不一致
  - 对策：统一沉淀 `packages/sdk`，Web 与 Android/iOS 仅做平台 UI 与交互适配
