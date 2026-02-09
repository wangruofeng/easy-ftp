# FTP 服务器复刻方案设计

> 参考站点：https://ftp.pieter.com/  
> 目标：在本地复刻「真实 FTP 服务 + 同风格 Web 目录索引」的一体化方案。

---

## 一、参考站点行为分析

### 1.1 整体形态

| 维度 | 观察 |
|------|------|
| **访问方式** | 浏览器访问 `https://ftp.pieter.com/` 得到的是 **HTTP 目录索引页**，不是原生 FTP 协议。 |
| **FTP** | 站点说明为「真实 FTP，支持匿名登录」，需用 FTP 客户端连接 `ftp://ftp.pieter.com`。 |
| **数据一致** | Web 上看到的目录/文件列表与 FTP 应为同一套文件系统（同一根目录）。 |

结论：需要同时实现 **FTP 服务** 和 **HTTP 目录索引 + 文件下载**，共用同一数据目录。

### 1.2 Web 页面结构（逐屏）

1. **ASCII 艺术横幅**（固定两行图案）  
   ```
   .-.     .-.     .-.     ...
   _.'   `._.'   `._.'   ...
   ```

2. **标题区**  
   - 文案：`Welcome to Pieter's FTP server` / `at ftp.pieter.com`

3. **信息框**（等宽字体、每行约 50 字符、两侧 `***` 边框）  
   - 说明是真实 FTP、匿名登录、FTP 地址  
   - 说明浏览器不再支持 FTP，需用 FTP 客户端  
   - 用途说明、联系方式、版权/删除请求说明  
   - **Last updated:** 动态时间（如 `Monday, 09-Feb-2026 02:12:54 GMT`）  
   - 主站链接（如 `pieter.com`）

4. **索引标题**  
   - `# Index of ftp://pieter.com/` 或 `# Index of ftp://pieter.com/APPS/`（随路径变化）

5. **分隔线**  
   - `---`

6. **目录列表**（表格化，等宽）  
   - 父目录：`../`  
   - 目录：`<name>/` + 日期 + `-`  
   - 文件：`<name>` + 日期 + 大小（如 `15K`、`4M`、`27M`）  
   - 列表项可点击：目录进子路径，文件触发下载（或直接展示，按需）

7. **页脚**  
   - 再次 `---`，风格与整体一致

### 1.3 子目录与文件

- 子目录（如 `/APPS/`、`/upload/`）：同一套布局，仅「Index of」路径和列表内容不同。  
- 列表中的「Last updated」为服务端当前时间，子路径可复用同一逻辑。  
- 文件通过 HTTP 提供下载（或直接 `Content-Disposition: attachment`），与 FTP 下载的是同一文件。

### 1.4 技术推断

- 列表和文案由服务端根据**当前路径 + 文件系统**动态生成。  
- 样式为**等宽字体 + 纯文本/轻量 HTML**，无复杂前端框架。  
- FTP 与 Web 共用**同一根目录**，保证两边看到的内容一致。

---

## 二、复刻目标与范围

| 项目 | 是否复刻 | 说明 |
|------|----------|------|
| FTP 服务（匿名登录、列表/上传/下载） | ✅ | 真实可用的 FTP 服务 |
| Web 目录索引页（ASCII 横幅 + 信息框 + 列表） | ✅ | 布局与风格一致 |
| 动态「Last updated」时间 | ✅ | 服务端生成 |
| 子目录与父目录链接（`../`） | ✅ | 与参考一致 |
| 文件大小人性化显示（K/M/G） | ✅ | 与参考一致 |
| 可配置站点名、FTP 地址、说明文案 | ✅ | 便于改成自己的「xxx's FTP」 |
| 实际部署域名/HTTPS/证书 | ❌ | 仅本地或内网演示，HTTPS 可选 |

---

## 三、系统架构

```
                    ┌─────────────────────────────────────┐
                    │           同一数据根目录              │
                    │         (如 ./data 或 ./ftp-root)   │
                    └───────────────┬─────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │  FTP Server   │       │  HTTP Server  │       │   (可选)      │
    │  端口 21      │       │  端口 3000    │       │ 静态/上传     │
    │  匿名登录     │       │  目录索引页   │       │               │
    │  列表/传文件  │       │  文件下载     │       │               │
    └───────────────┘       └───────────────┘       └───────────────┘
```

- **FTP**：只负责 FTP 协议下的列表、上传、下载。  
- **HTTP**：只负责生成「索引页」和提供文件 HTTP 下载；不实现 FTP 协议。  
- **数据**：FTP 与 HTTP 读写同一目录，无需同步逻辑。

---

## 四、技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| 语言 | Node.js | 与现有 Web 生态一致，便于同一仓库里写 HTTP + FTP，共享路径与配置。 |
| FTP 服务 | `ftp-srv` | 纯 JS、支持匿名、可挂载虚拟文件系统或本地目录，与数据目录对接简单。 |
| HTTP 服务 | Express | 轻量、路由清晰，便于做「任意深度」的目录索引和静态文件。 |
| 模板 | 单文件 HTML 字符串 或 轻量模板（ejs） | 页面结构固定，无需前端构建；便于维护 ASCII 与 `***` 排版。 |

备选：若你更熟悉 Python，可改为 **Python + pyftpdlib + Flask/FastAPI**，架构与下面接口设计一致，仅代码语言不同。

---

## 五、目录与模块划分

```
ftp-server-v2/
├── package.json
├── README.md
├── .env.example                 # 端口、根目录、站点名等
├── config.js                   # 读取环境变量 / 默认配置
├── src/
│   ├── index.js                # 启动入口：同时起 FTP + HTTP
│   ├── ftp/
│   │   └── server.js           # FTP 服务：匿名、根目录绑定
│   └── http/
│       ├── server.js           # Express 创建、路由注册
│       ├── indexPage.js        # 生成「索引页」HTML（ASCII + 信息框 + 列表）
│       └── format.js           # 日期格式化、文件大小 K/M/G、路径规范化
├── data/                       # 默认 FTP/HTTP 共用根目录（.gitignore 忽略内容）
└── docs/
    └── DESIGN.md               # 本文档
```

- **config.js**：`FTP_PORT`、`HTTP_PORT`、`DATA_ROOT`、`SITE_NAME`、`FTP_HOST`、`WELCOME_LINES`（信息框多行文案）等。  
- **index.js**：先读 config，再 `require('./ftp/server')` 与 `require('./http/server')` 分别 listen，共享 `DATA_ROOT`。

---

## 六、接口与行为约定

### 6.1 FTP

- **端口**：默认 21（需 root 或 capability；开发可用 2121）。  
- **匿名**：用户名 `anonymous`，密码任意（或空）。  
- **根目录**：`config.DATA_ROOT`，即与 HTTP 一致。  
- **权限**：匿名只读或可写由配置决定；复刻可先只读，后续再加「匿名可写」与目录限制。

### 6.2 HTTP

- **GET /**  
  - 返回索引页，等价于「当前路径 = 根目录」。

- **GET /path/to/dir/**  
  - 注意尾部斜杠：表示目录。  
  - 若路径对应到 `DATA_ROOT` 内的真实目录，返回该目录的索引页；否则 404。

- **GET /path/to/dir**（无尾斜杠）  
  - 若为目录：302 重定向到 `/path/to/dir/`。  
  - 若为文件：见下条。

- **GET /path/to/file**  
  - 若为文件：`Content-Type` 按扩展名或二进制；建议 `Content-Disposition: attachment` 触发下载；流式读取，不一次性读入内存。

- **安全**：路径解析必须限制在 `DATA_ROOT` 内，禁止 `..` 逃逸（用 path.resolve + startsWith 校验）。

### 6.3 索引页数据

- **当前路径**：来自 URL path，规范化后映射到 `DATA_ROOT` 下的子路径。  
- **列表**：`fs.readdirSync(..., { withFileTypes: true })`，对每项取 `name`、`mtime`、`size`（目录用 `-`）。  
- **排序**：目录在前、按名排序；文件按名排序（与参考一致即可）。  
- **「Index of」**：显示为 `ftp://{FTP_HOST}/{relativePath}`，例如 `ftp://localhost/APPS/`。  
- **Last updated**：使用当前服务器时间，格式 `Monday, 09-Feb-2026 02:12:54 GMT`（或配置时区）。

---

## 七、页面与样式（复刻要点）

- **字体**：等宽，如 `Consolas, "Courier New", monospace`。  
- **背景/前景**：浅色背景 + 深色字（或深色背景 + 浅色字），保证 ASCII 清晰可读。  
- **ASCII 横幅**：两行固定字符，可直接写死在模板或配置里。  
- **信息框**：每行前後 `***`，行宽约 50 字符，过长可截断或换行。  
- **列表**：  
  - 目录：`<a href="/path/name/">name/</a>` + 日期 + `-`  
  - 文件：`<a href="/path/name">name</a>` + 日期 + 大小  
  - 父目录：`<a href="/parent/">../</a>`  
- **favicon**：若 `data/` 根目录有 `favicon.ico`，则 HTTP 根路径可提供 `/favicon.ico`；否则可返回 204 或简单 ico。

---

## 八、配置项示例（.env / config.js）

```bash
# .env.example
FTP_PORT=2121
HTTP_PORT=3000
DATA_ROOT=./data
SITE_NAME=Pieter
FTP_HOST=localhost
# 可选：时区、匿名是否可写等
```

可在 `config.js` 里再增加 `WELCOME_LINES` 数组，用于信息框多行文案，便于改成自己的站点说明。

---

## 九、部署与运行

- **开发**：`node src/index.js`（或 `npm run start`），FTP 用 2121 避免 root。  
- **生产**：  
  - FTP 若用 21，需 root 或 setcap。  
  - HTTP 可前挂 Nginx/Caddy 做反向代理与 HTTPS，或直接暴露 3000。  
- **数据**：保证 `DATA_ROOT` 存在且进程可读（FTP 可写则需可写）。

---

## 十、实现顺序建议

1. **config + 目录结构**：创建 `config.js`、`src/`、`data/`。  
2. **HTTP 索引页**：实现 `format.js`、`indexPage.js`、Express 路由（仅索引 + 静态文件），在浏览器里对照参考站逐块调整 ASCII 与表格。  
3. **FTP 服务**：用 `ftp-srv` 绑定 `DATA_ROOT`，匿名只读，用客户端验证列表/下载。  
4. **联调**：同一 `data/` 下放若干目录和文件，确认 FTP 与 HTTP 列表、下载一致。  
5. **可选**：匿名上传、`upload/` 目录权限、favicon、Last updated 时区配置。

---

## 十一、风险与注意点

- **端口 21**：Linux 需 root 或 `setcap cap_net_bind_service=+ep`。  
- **路径安全**：所有基于 URL 的路径必须先 resolve 再严格限制在 `DATA_ROOT` 内。  
- **大文件**：HTTP 下载用 stream，避免 `fs.readFile` 整文件入内存。

---

请 Review 本方案，确认方向与范围后，再按上述顺序实现代码；若需要改成 Python 或调整端口/权限策略，可一并说明。
