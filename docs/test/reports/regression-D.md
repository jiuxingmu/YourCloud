# BUG-D-001 回归验证记录

## 验证目标
- 验证 BUG-D-001（`REVOKED` 文案）是否修复正确。
- 确认其他分享错误码映射仍正确：`EXPIRED` / `EXTRACT_CODE_INVALID` / `NOT_FOUND`。

## 验证环境
- 仓库：`/Users/xuegao/proj/YourCloud`
- 前端目录：`clients/web`
- 测试框架：Vitest

## 验证步骤与命令
1. 进入前端目录并运行 SharePage 相关测试：
   - 命令：`npm test -- src/pages/SharePage.test.ts`
2. 检查测试通过情况与断言覆盖点。
3. 复核 `SharePage` 中错误码到文案的映射逻辑是否与测试一致。

## 执行结果
### 1) SharePage 测试执行结果
- 命令：`npm test -- src/pages/SharePage.test.ts`
- 结果：`1` 个测试文件通过，`4` 个测试用例全部通过（`4 passed`）。

### 2) REVOKED 文案验证
- 测试断言验证：
  - `mapShareErrorMessage(new ApiRequestError('revoked', { status: 410, code: 'REVOKED' }))`
  - 期望文案：`分享已被取消`
- 实际结果：断言通过。

### 3) 其他错误码映射验证
- `EXPIRED`（`410`）→ `分享链接已过期`：测试断言通过。
- `NOT_FOUND`（`404`）→ `分享内容不存在或已被删除`：测试断言通过。
- `EXTRACT_CODE_INVALID`（`403`）：
  - `isExtractCodeError` 识别断言通过。
  - 映射逻辑复核：`mapShareErrorMessage` 返回 `请输入正确的提取码后访问`，逻辑保持正确。

## 结论
- BUG-D-001 已被正确修复，`REVOKED` 文案为 `分享已被取消`，回归通过。
- 其余分享错误码映射（`EXPIRED` / `EXTRACT_CODE_INVALID` / `NOT_FOUND`）未受影响，行为正确。
- 本次仅新增回归文档，未修改业务代码。
