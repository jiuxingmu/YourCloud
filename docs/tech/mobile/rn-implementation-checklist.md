# Mobile 实施任务清单（Android + iOS）

## 目标

按“一期 Android + iOS + Web”范围推进，使用 Expo + React Native，统一复用 `packages/sdk`。

## 阶段 0：仓库与基线

- [ ] 创建 `clients/mobile`（Expo + TypeScript）
- [ ] 创建 `packages/sdk` 并配置构建/导出
- [ ] 在根目录补充 mobile 运行脚本
- [ ] 文档入口补齐（`docs/README.md`、`docs/tech/README.md`）

验收：
- [ ] `npm run mobile:android` 可启动
- [ ] `npm run mobile:ios` 可启动

## 阶段 1：SDK 抽离（先稳定请求层）

- [ ] 从 `clients/web/src/apiClient.ts` 抽离通用 request 到 `packages/sdk`
- [ ] 统一 API 错误模型（网络错误、401、429、5xx）
- [ ] 抽离 `auth/files/shares` 三组 API 方法
- [ ] 设计平台无关 TokenStore 接口（不把 localStorage 写死在 SDK）

验收：
- [ ] Web 功能行为无回归（登录、列表、上传、分享）
- [ ] Mobile 能复用同一套 SDK 完成登录与文件列表

## 阶段 2：移动端基础能力

- [ ] 认证流（登录、持久化 token、登出）
- [ ] 首页文件列表（加载态、空态、错误态）
- [ ] 文件夹导航（路径面包屑或返回上级）
- [ ] 全局错误提示与重试机制

验收：
- [ ] Android/iOS 上账号登录成功
- [ ] 文件列表与 Web 接口结果一致

## 阶段 3：文件操作能力

- [ ] 上传（Document Picker + multipart）
- [ ] 下载（FileSystem）
- [ ] 删除
- [ ] 移动
- [ ] 新建文件夹

验收：
- [ ] 上传后 2 秒内列表可见
- [ ] 下载文件可在系统中打开
- [ ] 删除/移动/新建在 Web 可见一致结果

## 阶段 4：分享与预览能力

- [ ] 创建分享（过期时间、提取码）
- [ ] 我的分享列表
- [ ] 撤销分享
- [ ] 预览图片/PDF/文本

验收：
- [ ] 分享链接可访问且权限生效
- [ ] 撤销后分享立即失效

## 阶段 5：质量与发布准备

- [ ] Android/iOS 统一埋点与关键日志（登录、上传、下载、分享）
- [ ] 崩溃与错误监控接入（可后续落地平台）
- [ ] 真机联调（至少 1 台 Android + 1 台 iPhone）
- [ ] 构建测试包（EAS Build）

验收：
- [ ] Android/iOS/Web 核心流程回归通过
- [ ] 发布包可安装并完成核心链路

## 推荐任务拆分（建议按 PR）

- PR1：`clients/mobile` 脚手架 + 健康检查页
- PR2：`packages/sdk` request 层 + Web 迁移
- PR3：Mobile 登录 + 文件列表
- PR4：上传/下载/删除/移动/新建文件夹
- PR5：分享与预览
- PR6：稳定性与发布配置

## 风险与预案

- SDK 抽离影响 Web 线上行为
  - 预案：先迁 request 层，小步替换，逐步回归
- 移动端网络配置复杂（模拟器/真机）
  - 预案：统一环境配置说明和调试页地址覆盖
- iOS 与 Android 系统能力差异
  - 预案：上传下载封装平台适配层，UI 尽量同构
