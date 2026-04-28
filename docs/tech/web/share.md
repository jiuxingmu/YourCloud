# Web 设计-分享模块

## 类关系
- `SharePage` -> `getShare` / `buildShareDownloadUrlWithCode`
- `SharePage` -> `mapShareErrorMessage`

## 流程图
```mermaid
flowchart LR
  A[访问分享链接] --> B[SharePage]
  B --> C[getShare]
  C --> D{是否成功}
  D -- 是 --> E[展示文件与下载]
  D -- 否 --> F[按错误码映射文案]
```

## 错误处理
- `EXTRACT_CODE_INVALID`：提示输入正确提取码
- `EXPIRED`：提示链接已过期
- `REVOKED`：提示分享已被取消
- `NOT_FOUND`：提示内容不存在
