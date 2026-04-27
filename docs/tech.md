# 技术选型

- 客户端（必选）：KMP（Kotlin Multiplatform），共享网络层、领域层、数据模型与核心业务逻辑
- 后端：Kotlin + Ktor
- 数据库：PostgreSQL
- 鉴权：账号密码 + JWT
- 对象存储：默认腾讯云 COS（通过存储适配层解耦）
- Web：基于 KMP 共享层实现 Web 端能力（可采用 Kotlin/JS 或 Compose Multiplatform for Web 方案）
