# Mobile 初始化指南（Expo + React Native）

## 1. 目标

在当前仓库中新增 `clients/mobile`，一次性支持 Android 与 iOS，本地可运行并可联调现有 `services/api-go`。

本阶段只做工程搭建与基础联通，不包含完整业务页面实现。

## 2. 目录目标

```text
clients/
  web/
  mobile/              # 新增 Expo App（Android + iOS）
packages/
  sdk/                 # 新增共享 API SDK（Web + Mobile 复用）
services/
  api-go/
```

## 3. 环境要求

- Node.js 20+
- npm 10+
- Xcode（iOS 模拟器）
- Android Studio（Android Emulator）
- Expo CLI（通过 `npx expo` 使用即可）

## 4. 初始化步骤

### 4.1 创建移动端工程

在仓库根目录执行：

```bash
npx create-expo-app@latest clients/mobile --template
```

建议模板：
- 优先 `tabs (TypeScript)` 或 `blank (TypeScript)`
- 若选择 tabs，后续可按业务路由逐步替换默认页面

### 4.2 统一脚本（根目录 package.json）

建议在根目录补充脚本（若根目录还没有 `package.json`，先初始化）：

- `mobile:dev`: 启动 Expo 开发服务
- `mobile:android`: 启动 Android
- `mobile:ios`: 启动 iOS

示例：

```json
{
  "scripts": {
    "mobile:dev": "npm --prefix clients/mobile run start",
    "mobile:android": "npm --prefix clients/mobile run android",
    "mobile:ios": "npm --prefix clients/mobile run ios"
  }
}
```

### 4.3 新增共享 SDK 包

新建 `packages/sdk`：

- `src/request.ts`：请求基座（fetch、错误处理、超时、统一响应结构）
- `src/auth.ts`：登录/注册/用户信息
- `src/files.ts`：文件列表、上传、下载、删除、移动
- `src/shares.ts`：分享创建、列表、撤销、按 token 访问
- `src/types.ts`：接口类型与错误码

导出入口：
- `packages/sdk/src/index.ts`

### 4.4 Web 接入共享 SDK（第一步只迁移 request）

先将 `clients/web/src/apiClient.ts` 的通用逻辑迁移到 `packages/sdk`，再在 Web 侧最小改造调用。

建议迁移顺序：
1. 请求函数和错误模型
2. 鉴权头注入策略
3. 文件与分享 API 封装

### 4.5 Mobile 联调最小闭环

在 `clients/mobile` 先实现一个最小联调页：
- 输入 API Base URL
- 登录（账号密码）
- 拉取文件列表并渲染

这一步用于验证：
- 网络通
- token 存取通
- SDK 复用通

## 5. API Base URL 约定（Mobile）

移动端不使用 `import.meta.env`，建议如下：

- 开发环境通过 `app.config.ts` 注入 `extra.apiBaseUrl`
- 运行时从 `expo-constants` 读取
- 预留覆盖机制（调试页手动输入地址）

推荐规则：
- iOS 模拟器可用 `http://localhost:8080`
- Android Emulator 使用 `http://10.0.2.2:8080`
- 真机调试使用局域网 IP（如 `http://192.168.x.x:8080`）

## 6. 鉴权与存储策略

- Web: `localStorage`
- Mobile: `expo-secure-store`（优先）或 `@react-native-async-storage/async-storage`（次选）

建议封装统一 TokenStore 接口：
- `getToken()`
- `setToken(token)`
- `clearToken()`

由平台层注入，SDK 不直接依赖具体存储库。

## 7. 上传下载策略（一期）

- 上传：`multipart/form-data` 对齐现有 Go API
- 下载：先走 API 下载链接与系统打开能力
- 大文件分片/断点续传先不做（已在 PRD 设为后续）

推荐依赖：
- `expo-document-picker`（选文件）
- `expo-file-system`（下载；预览下载可用 `expo-file-system/legacy` 的 `downloadAsync`）
- `expo-sharing`（分享文件到系统）

## 7.1 路由与预览（工程内已实现）

- **路由**：`@react-navigation/native` + bottom tabs（「文件」「分享」）+ native stack 模态页「预览」。
- **预览**：图片走缩略图 URL 下载到缓存后 `Image` 展示；文本走下载后 `readAsStringAsync`；PDF 等文档用 `WebView` 的 `source.uri` + `headers.Authorization`。
- **分享**：`Shares` 标签页调用 SDK `listMine` / `revoke`，与 Web 能力对齐。

## 8. 页面范围（一期）

移动端（Android + iOS）与 Web 对齐：

- 登录
- 文件列表/文件夹导航
- 上传
- 下载
- 分享创建/撤销
- 图片/PDF/文本预览
- 文件管理（重命名、删除、移动）

## 9. 验收标准（初始化阶段）

- `clients/mobile` 在 iOS/Android 均可启动
- 可成功请求 `GET /health`
- 可登录并拿到 JWT
- 可拉取文件列表
- `packages/sdk` 被 Web 与 Mobile 同时引用

## 10. 常见问题

- iOS 启动失败：先确认 Xcode 与 Command Line Tools 配置
- Android 连不上本机 API：检查是否使用 `10.0.2.2`
- CORS 报错（Web 才有）：Mobile 不受浏览器 CORS 限制
- HTTPS 限制：真机调试建议优先走同网段 HTTP（开发期）
