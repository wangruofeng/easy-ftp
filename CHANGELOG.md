# Changelog

本文档记录项目的主要变更。

## [1.0.0] - 2026-02-09

### 实现

- FTP 服务（ftp-srv）：匿名登录，端口可配置，根目录与 HTTP 共用 `DATA_ROOT`
- HTTP 目录索引：ASCII 横幅、Welcome 标题、*** 信息框（居中对齐、可配置宽度）、Last updated、目录/文件列表（文件夹蓝色+图标、文件黑色+图标）
- 文件下载：支持中文等文件名（decodeURIComponent），流式输出，`Content-Disposition: attachment`
- 上传文件：Web 表单多文件上传（multer），选择文件后按钮才可用，上传后重定向回当前目录
- 新建文件：弹框输入文件名与可选内容，POST `/api/newfile`，创建后重定向
- 新增文件夹：弹框输入文件夹名，POST `/api/newdir`，创建后重定向；同名目录返回 400
- 布局：顶部 *** 区域与底部操作区、分割线统一为 80ch 最大宽度；上传/新建文件/新增文件夹三按钮右对齐、间距 1em
- 开发体验：`npm start` 使用 nodemon 监听代码变更自动重启；`.gitignore` 忽略 `node_modules/`、`.env`、`data/*`（保留 `.gitkeep`）
- 文档：README、docs/DESIGN.md、.env.example

### 技术栈

- Node.js、Express、ftp-srv、multer、dotenv、nodemon（dev）
