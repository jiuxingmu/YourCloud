# Mobile 启动故障复盘（2026-04-30）

## 背景

在 `clients/mobile` 接入 Expo + React Native 后，Android 模拟器启动阶段连续出现“长时间转圈 / 蓝屏 / 红屏”等问题，导致无法稳定进入业务页面。

本次记录用于沉淀排障经验，避免后续重复踩坑。

## 问题现象

### 现象 1：Expo Go 蓝屏

- 提示：`Something went wrong`
- 关键信息：`java.io.IOException: Failed to download remote update`

### 现象 2：应用停留在启动图标页

- 模拟器显示应用图标与应用名（`mobile`）后无进一步 UI 变化
- 同时终端曾出现 `Stopped server`，说明 Metro 服务被中断

### 现象 3：红屏编译错误

- 错误：`Unable to resolve module @yourcloud/sdk from App.tsx`

### 现象 4：红屏运行时错误

- 错误：`NativeWorklets ... TurboModule ... installTurboModule`
- 典型栈涉及 `react-native-reanimated` / `NativeWorklets`

## 根因分析

本次不是单一根因，而是多个问题叠加：

1. **Expo 依赖版本不匹配**
   - `expo-document-picker`、`expo-secure-store` 起初版本不符合当前 Expo SDK 推荐版本，增加了运行不确定性。

2. **端口与运行会话不稳定**
   - `8081` 常被其他 webpack 进程占用，Expo 被迫切端口。
   - 多次 `expo start` 会话被中断（出现 `Stopped server`），导致客户端无可用 bundle。

3. **本地共享包解析问题（Monorepo file: 依赖）**
   - `@yourcloud/sdk` 使用 `file:../../packages/sdk`，Metro 默认对软链/工作区外目录解析不稳定。
   - 导致 `Unable to resolve module @yourcloud/sdk`。

4. **Reanimated 在 Expo Go 下触发 NativeWorklets 崩溃**
   - 引入 `react-native-reanimated` 与入口初始化后，出现 TurboModule/NativeWorklets 运行时异常。
   - 在当前项目阶段（未使用 Reanimated 动画能力）属于不必要依赖，移除后恢复稳定。

## 最终修复项

### 1) 依赖与入口修复

- 使用 `expo install` 对齐 Expo SDK 依赖版本：
  - `expo-document-picker`
  - `expo-secure-store`
- 安装导航必要依赖：
  - `react-native-gesture-handler`
- 移除引发崩溃的依赖：
  - `react-native-reanimated`
- 入口仅保留：
  - `import 'react-native-gesture-handler'`

### 2) Metro 对 monorepo 包的支持

新增 `clients/mobile/metro.config.js`：

- 开启 `resolver.unstable_enableSymlinks = true`
- 增加 `watchFolders` 指向 `../../packages`

用于稳定解析 `@yourcloud/sdk`（`file:` 本地包）。

### 3) 稳定启动流程

- 固定使用 `localhost` 模式启动：
  - `npx expo start -c --localhost --port 8081`
- 通过 adb 反向代理：
  - `adb reverse tcp:8081 tcp:8081`
- 保持 Metro 终端常驻，不要中途中断。

## 建议的标准启动命令

```bash
cd /Users/xuegao/proj/YourCloud/clients/mobile
npx expo start -c --localhost --port 8081
```

另开终端：

```bash
adb reverse tcp:8081 tcp:8081
```

然后在 Expo 终端按 `a` 打开 Android 模拟器。

## 后续防回归建议

1. **锁定移动端依赖策略**
   - Expo 生态依赖统一用 `npx expo install` 安装，避免手工安装导致版本漂移。

2. **统一 monorepo 规则**
   - 保留 `clients/*`（应用）+ `packages/*`（共享库）结构。
   - `clients/mobile` 必须保留 `metro.config.js` 的 symlink/watch 配置。

3. **避免不必要的原生依赖**
   - 未使用到动画能力时，不引入 `react-native-reanimated`。
   - 需要引入时，先在独立分支验证 Expo Go / Dev Build 兼容性。

4. **固定调试端口**
   - 启动前确认 `8081` 未被其他本地进程占用（避免自动切端口造成联调混乱）。

5. **排障优先级建议**
   - 先看 Metro 是否存活
   - 再看依赖版本是否匹配
   - 再看模块解析（monorepo）
   - 最后看运行时原生模块崩溃
