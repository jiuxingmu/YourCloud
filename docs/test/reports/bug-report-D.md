# D组测试报告（TC-032~TC-048）

执行人：D  
执行日期：2026-04-29  
范围：分享与体验链路（TC-032~TC-048）

## 1) 自动化执行记录

### 后端（`services/api-go`）
- 执行：`go test ./...`
- 结果：通过（`internal/handler`、`internal/service` 等均通过）

- 定向执行：`go test ./internal/handler ./internal/service -run Share -v`
- 结果：通过（关键用例）  
  - `TestShareHandlerGetByTokenRequiresExtractCode`
  - `TestShareHandlerGetByTokenWithExtractCode`
  - `TestShareHandlerDownloadByTokenRejectsWrongExtractCode`
  - `TestShareHandlerCreateIgnoresUntrustedOrigin`
  - `TestShareHandlerListMineAndRevoke`
  - `TestShareCreate`
  - `TestShareValidateExtractCode`

### 前端（`clients/web`）
- 执行：`CI=1 npm test -- --watch=false`
- 结果：通过（7/7 文件，47/47 用例）
- 关注覆盖：
  - `src/pages/SharePage.test.ts`（提取码/过期/404提示映射）
  - `src/App.test.ts`（分享路由解析）
  - `src/pages/FilesPage.test.ts`（最近/星标相关视图与行为辅助逻辑）

## 2) 缺陷列表

### BUG-D-001
- BUG-ID：BUG-D-001
- 用例ID：TC-038（分享失效-主动取消后访问），关联 TC-039（分享过期）
- 严重级别：P1
- 复现步骤：
  1. 用户A创建分享，拿到分享链接。
  2. 在“分享管理”执行“取消分享”。
  3. 使用已取消链接访问分享页（`/share/{token}`）。
  4. 后端返回 `410` 且错误码 `REVOKED`。
- 实际结果：
  - 前端 `SharePage` 对 `410 + REVOKED` 未做专门文案映射，回退为通用提示：`分享链接无效或已失效`。
- 预期结果：
  - 与后端状态一致，明确提示“分享已被取消/已失效（手动取消）”，与“已过期”区分。
- 初步定位：
  - `clients/web/src/pages/SharePage.tsx` 的 `mapShareErrorMessage()` 仅处理 `EXTRACT_CODE_INVALID`、`EXPIRED`、`NOT_FOUND`，缺少 `REVOKED` 分支。
  - 后端已正确返回 `410 + REVOKED`（`services/api-go/internal/handler/share_handler.go`）。

## 3) 结论

- 当前 D 组范围发现 **1 个非阻断问题（P1）**，未发现阻断发布的 P0 级问题。
- 分享状态流转核心接口语义（提取码、取消后 410、过期 410）在后端自动化中表现正常；前端主要问题是“取消分享”场景提示不够精确。

## 4) 证据与盲区

### 证据
- 后端全量与 share 定向测试全部通过。
- 前端单测全量通过，覆盖了分享错误码映射、路由解析、最近/星标部分行为辅助逻辑。

### 盲区
- 本次以单元/集成测试为主，未在可运行的完整联调环境执行端到端 UI 操作（如真实页面点击“取消分享”后的文案验证）。
- TC-043~TC-048 中部分交互（例如设置菜单清空动作的完整 UI 回显）缺少独立前端测试用例，需要后续补充 E2E 或组件交互测试。
