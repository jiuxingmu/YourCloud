# E 负责人缺陷修复记录

日期：2026-04-29  
负责人：E

## 修复范围

根据修复原则，仅修复已确认可复现问题：

- 已修复：`BUG-D-001`（`SharePage` 对 `410 + REVOKED` 未单独提示）
- 未修复：B/C 报告中的其他项（均为未确认可复现或仅覆盖盲区，不在本次修复范围）

## 修复内容

### BUG-D-001（已修复）

- 问题：访问已被手动取消的分享链接时，后端返回 `410 + REVOKED`，前端提示回退为通用文案 `分享链接无效或已失效`。
- 修复：在 `mapShareErrorMessage()` 中新增 `REVOKED` 映射，文案为 `分享已被取消`，与 `EXPIRED`（`分享链接已过期`）做明确区分。

## 修改文件

- `clients/web/src/pages/SharePage.tsx`
  - 新增 `410 + REVOKED` 分支映射。
- `clients/web/src/pages/SharePage.test.ts`
  - 新增 `REVOKED` 错误码断言，确保回归测试覆盖该场景。
- `docs/bug-fix-E.md`
  - 新增本次修复记录。

## 验证命令与结果

在 `clients/web` 目录执行：

1. `npm test -- SharePage.test.ts`
   - 结果：通过（`1 file, 4 tests passed`）。

2. `npm test -- -t 'share|token'`
   - 结果：通过（`3 files passed, 9 tests passed`；其余为未命中过滤条件而 skipped）。

## 备注

- 本次未对后端逻辑做改动；后端在 D 报告中已确认能正确返回 `410 + REVOKED`。
