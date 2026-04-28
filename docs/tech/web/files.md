# Web 设计-文件模块

## 类关系
- `FilesPage` -> `fileActionsService` -> `filesApi`
- `FilesPage` -> `FilesListTable` / `FilePreview`

## 流程图
```mermaid
flowchart LR
  A[文件操作点击] --> B[FilesPage]
  B --> C[fileActionsService]
  C --> D[filesApi]
  D --> E[刷新列表与提示]
```

## 错误处理
- 上传失败：toast + 保留当前页面状态
- 下载失败：错误提示
- 移动/删除失败：回滚交互状态并提示
