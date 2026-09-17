# Easy FTP (ftp-server-v2)

## 定位

复刻 [Pieter's FTP](https://ftp.pieter.com/) 风格的一体化文件服务：真实 FTP 服务（匿名登录）+ 同风格 Web 目录索引，共用同一数据目录。远端仓库为 `wangruofeng/easy-ftp`。

## 怎么跑

```bash
cp .env.example .env   # 可选，全部有默认值
npm install
npm start              # nodemon 监听 src/、config.js、.env 自动重启
npm run serve          # 单次启动，不监听
```

- Web 索引：http://localhost:3000
- FTP：`ftp://localhost:2121`，用户 `anonymous`，密码任意

## 技术栈

- Node.js ≥18（CommonJS）
- Express（HTTP 索引/上传/新建/下载）、ftp-srv（FTP 服务）、multer（内存暂存上传，`array('file', 10)` 最多 10 文件、单文件 100MB）、dotenv
- nodemon（dev）

## 目录与约定

```
config.js            # 唯一配置入口（读 .env：FTP_PORT/HTTP_PORT/DATA_ROOT/SITE_NAME/FTP_HOST）
src/index.js         # 同时启动 FTP + HTTP
src/ftp/server.js    # 匿名 FTP
src/http/server.js   # API 路由：上传/新建文件/新建文件夹/下载/favicon
src/http/indexPage.js# 索引页 HTML 与弹框
src/http/format.js   # resolvePath 路径防护（禁止 .. 逃逸）与格式化
data/                # 运行数据目录，内容全部 gitignore
docs/DESIGN.md       # 方案设计（参考站逐屏分析）
```

- 安全红线：所有文件操作必须经 `resolvePath` 校验且 `startsWith(dataRoot)`；文件名 `path.basename` + 去空字节
- `data/` 下不放任何被跟踪文件；`favicon.ico` 放 data/ 根即可自动生效
- 配置只在 `config.js` 汇总，新增环境变量需同步 `.env.example` 与 README 配置表

## 当前状态与下一步

- v1.0.1（2026-02-09）：功能完整——FTP/索引/上传/新建/下载/防护均已实现并有截图
- CHANGELOG.md 记录版本叙事；改版时先更新 CHANGELOG 再升 package.json 版本
- 可能的下一步：生产部署（21 端口需 setcap、反代 HTTPS）、访问日志、上传进度提示
