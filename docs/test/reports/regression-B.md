# B 回归验证报告

日期：2026-04-29  
执行人：B

## 验证范围

- 读取修复说明：`docs/bug-fix-E.md`
- 检查改动文件：
  - `clients/web/src/pages/SharePage.tsx`
  - `clients/web/src/pages/SharePage.test.ts`
- 回归目标：确认 `REVOKED` 文案修复未引入账号/鉴权回归，且不影响 `EXPIRED`、`NOT_FOUND`、提取码错误提示语义

## 执行命令

在 `clients/web` 目录执行：

1. `npm test -- -t 'login|auth|share|token'`
2. `npm test -- src/pages/SharePage.test.ts`

## 通过/失败项

- 通过：账号/鉴权/分享关键词筛选回归测试
  - 结果：`4 passed | 3 skipped (files)`，`10 passed | 37 skipped (tests)`
  - 说明：命中过滤条件的测试均通过，未命中项按预期 skipped
- 通过：`SharePage` 语义回归测试
  - 结果：`1 passed (file)`，`4 passed (tests)`
  - 覆盖点：
    - `410 + REVOKED` -> `分享已被取消`
    - `410 + EXPIRED` -> `分享链接已过期`
    - `404 + NOT_FOUND` -> `分享内容不存在或已被删除`
    - `403 + EXTRACT_CODE_INVALID` -> `请输入正确的提取码后访问`
- 失败：无

## 关键结果

- `mapShareErrorMessage()` 已包含 `REVOKED` 映射，且与 `EXPIRED` 分支并列区分。
- `SharePage.test.ts` 对 `REVOKED / EXPIRED / NOT_FOUND` 断言均通过，未出现语义回退到通用文案的回归。
- 提取码错误识别函数 `isExtractCodeError()` 与对应提示语断言通过，未受本次修复影响。

## 结论

本次 `REVOKED` 文案修复未发现账号/鉴权相关回归。  
`REVOKED`、`EXPIRED`、`NOT_FOUND` 及提取码错误提示语义均保持正确且可区分。
