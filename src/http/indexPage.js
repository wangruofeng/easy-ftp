const fs = require('fs');
const path = require('path');
const { formatDate, formatLastUpdated, formatSize, welcomeLine, WELCOME_LINE_WIDTH } = require('./format');
const config = require('../../config');

// 顶部波浪形 ASCII 横幅（与 *** 区域同宽：仅右补空格，不截断以保持图案完整）
const ASCII_BANNER_RAW = [
  "   .-.     .-.     .-.     .-.     .-.     .-.     .-.",
  "_.'   `._.'   `._.'   `._.'   `._.'   `._.'   `._.'   `._",
];
const ASCII_BANNER = ASCII_BANNER_RAW.map((line) => line.padEnd(WELCOME_LINE_WIDTH));

function buildWelcomeLines() {
  const now = new Date();
  const lastUpdated = formatLastUpdated(now);
  return config.WELCOME_LINES.map((line) => (line === null ? lastUpdated : line)).map(welcomeLine);
}

/**
 * 生成索引页 HTML
 * @param {string} resolvedDir - 当前目录的绝对路径
 * @param {string} urlPath - 当前 URL 路径（用于链接，如 "" 或 "APPS/"）
 * @param {string} ftpHost
 * @param {string} siteName
 * @returns {string} HTML
 */
function renderIndexPage(resolvedDir, urlPath, ftpHost, siteName) {
  const welcomeBlock = buildWelcomeLines().join('\n');
  const indexOfPath = `ftp://${ftpHost}/${urlPath}`.replace(/\/$/, '/') || `ftp://${ftpHost}/`;
  const title = `Index of ${indexOfPath}`;

  let entries = [];
  try {
    entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
  } catch (_) {
    return null;
  }

  const dirs = entries.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const files = entries.filter((e) => e.isFile()).sort((a, b) => a.name.localeCompare(b.name, 'en'));

  const baseHref = urlPath ? `/${urlPath}`.replace(/\/$/, '') + '/' : '/';
  const parentPath = urlPath ? urlPath.replace(/\/?[^/]+\/?$/, '') || '' : '';
  const parentHref = parentPath ? `/${parentPath}/` : '/';

  const rows = [];
  if (urlPath) {
    rows.push({ type: 'parent', name: '../', href: parentHref, date: '', size: '-' });
  }
  for (const d of dirs) {
    const full = path.join(resolvedDir, d.name);
    let mtime;
    try {
      mtime = fs.statSync(full).mtime;
    } catch (_) {
      mtime = new Date(0);
    }
    rows.push({
      type: 'dir',
      name: d.name + '/',
      href: baseHref + encodeURIComponent(d.name) + '/',
      date: formatDate(mtime),
      size: '-',
    });
  }
  for (const f of files) {
    const full = path.join(resolvedDir, f.name);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch (_) {
      stat = { mtime: new Date(0), size: 0 };
    }
    rows.push({
      type: 'file',
      name: f.name,
      href: baseHref + encodeURIComponent(f.name),
      date: formatDate(stat.mtime),
      size: formatSize(stat.size),
    });
  }

  const listRows = rows
    .map((r) => {
      const rowClass = r.type === 'file' ? 'row-file' : 'row-dir';
      const icon = r.type === 'file' ? 'icon-file' : 'icon-dir';
      return `<tr class="${rowClass}"><td><span class="icon ${icon}"></span><a href="${escapeHtml(r.href)}">${escapeHtml(r.name)}</a></td><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.size)}</td></tr>`;
    })
    .join('\n');

  const preContent = [
    '',
    ASCII_BANNER.join('\n'),
    '',
    `             Welcome to ${siteName}'s FTP server`,
    `                   at ${ftpHost}`,
    '',
    ASCII_BANNER.join('\n'),
    '',
    welcomeBlock,
    '',
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Consolas, "Courier New", monospace; background: #f5f5f5; color: #111; margin: 2em; line-height: 1.4; }
    pre { white-space: pre; margin: 0 0 1em 0; overflow-x: auto; min-width: min(80ch, 100%); }
    h1 { font-size: 1.2em; margin: 1em 0 0.5em 0; }
    table { border-collapse: collapse; margin: 0.5em 0; }
    th, td { text-align: left; padding: 0.2em 1em 0.2em 0; vertical-align: top; }
    td .icon { display: inline-block; width: 1.2em; text-align: center; margin-right: 0.4em; }
    .icon-dir::before { content: "📁"; }
    .icon-file::before { content: "📄"; }
    .row-dir a { color: #0066b8; text-decoration: none; }
    .row-dir a:hover { text-decoration: underline; }
    .row-file a { color: #111; text-decoration: none; }
    .row-file a:hover { text-decoration: underline; color: #0066b8; }
    .content-wrap { max-width: 65ch; }
    hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
    .upload-box { margin: 1em 0; padding: 0.8em; background: #eee; border: 1px solid #ccc; border-radius: 4px; display: flex; align-items: center; gap: 0.8em; flex-wrap: wrap; max-width: 65ch; box-sizing: border-box; }
    .upload-box form { display: flex; align-items: center; gap: 0.8em; flex-wrap: wrap; margin: 0; width: 100%; }
    .upload-box .btn-group-right { margin-left: auto; display: flex; align-items: center; gap: 1em; }
    .upload-box input[type="file"] { font-family: inherit; }
    .upload-box button { padding: 0.4em 0.8em; cursor: pointer; background: #0066b8; color: #fff; border: none; border-radius: 4px; font-family: inherit; }
    .upload-box button:hover { background: #005a9e; }
    .upload-box button:disabled { background: #999; cursor: not-allowed; }
    .upload-box button:disabled:hover { background: #999; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; align-items: center; justify-content: center; }
    .modal-overlay.show { display: flex; }
    .modal-dialog { background: #fff; border-radius: 8px; padding: 1.2em; min-width: 20em; max-width: 90vw; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .modal-dialog h2 { margin: 0 0 0.6em 0; font-size: 1.1em; }
    .modal-dialog form { display: flex; flex-direction: column; gap: 0.6em; }
    .modal-dialog label { display: block; }
    .modal-dialog input[type="text"], .modal-dialog textarea { font-family: inherit; padding: 0.4em; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
    .modal-dialog textarea { min-height: 5em; resize: vertical; }
    .modal-dialog .modal-actions { display: flex; gap: 0.6em; margin-top: 0.4em; }
    .modal-dialog button[type="submit"] { padding: 0.4em 1em; cursor: pointer; background: #2d7a2d; color: #fff; border: none; border-radius: 4px; font-family: inherit; }
    .modal-dialog button[type="submit"]:hover { background: #246b24; }
    .modal-dialog button[type="button"].btn-close { padding: 0.4em 1em; cursor: pointer; background: #666; color: #fff; border: none; border-radius: 4px; font-family: inherit; }
    .modal-dialog button[type="button"].btn-close:hover { background: #555; }
    .btn-newfile, .btn-newdir { padding: 0.4em 0.8em; cursor: pointer; border: none; border-radius: 4px; font-family: inherit; }
    .btn-newfile { background: #2d7a2d; color: #fff; }
    .btn-newfile:hover { background: #246b24; }
    .btn-newdir { background: #6b5b95; color: #fff; }
    .btn-newdir:hover { background: #5a4a82; }
  </style>
</head>
<body>
<pre>${escapeHtml(preContent)}</pre>
<div class="content-wrap">
<h1>${escapeHtml(title)}</h1>
<hr>
<div class="upload-box">
  <form action="/api/upload" method="post" enctype="multipart/form-data">
    <input type="hidden" name="path" value="${escapeHtml(urlPath.replace(/\/$/, ''))}">
    <input type="file" name="file" multiple id="upload-file-input">
    <div class="btn-group-right">
      <button type="submit" id="upload-submit-btn" disabled>上传文件</button>
      <button type="button" class="btn-newfile" id="btn-newfile">新建文件</button>
      <button type="button" class="btn-newdir" id="btn-newdir">新增文件夹</button>
    </div>
  </form>
</div>
<div class="modal-overlay" id="newdir-modal">
  <div class="modal-dialog">
    <h2>新增文件夹</h2>
    <form action="/api/newdir" method="post" id="newdir-form">
      <input type="hidden" name="path" value="${escapeHtml(urlPath.replace(/\/$/, ''))}">
      <label for="newdir-name">文件夹名称</label>
      <input type="text" id="newdir-name" name="dirname" placeholder="例如 myfolder" required>
      <div class="modal-actions">
        <button type="submit">创建</button>
        <button type="button" class="btn-close" id="newdir-close">取消</button>
      </div>
    </form>
  </div>
</div>
<div class="modal-overlay" id="newfile-modal">
  <div class="modal-dialog">
    <h2>新建文件</h2>
    <form action="/api/newfile" method="post" id="newfile-form">
      <input type="hidden" name="path" value="${escapeHtml(urlPath.replace(/\/$/, ''))}">
      <label for="newfile-name">文件名</label>
      <input type="text" id="newfile-name" name="filename" placeholder="例如 newfile.txt" required>
      <label for="newfile-content">内容（可选）</label>
      <textarea id="newfile-content" name="content" placeholder="留空则创建空文件"></textarea>
      <div class="modal-actions">
        <button type="submit">创建</button>
        <button type="button" class="btn-close" id="newfile-close">取消</button>
      </div>
    </form>
  </div>
</div>
<script>
(function(){
  var overlay = document.getElementById('newfile-modal');
  var btn = document.getElementById('btn-newfile');
  var closeBtn = document.getElementById('newfile-close');
  if (btn) btn.onclick = function(){ overlay.classList.add('show'); };
  if (closeBtn) closeBtn.onclick = function(){ overlay.classList.remove('show'); };
  overlay.onclick = function(e){ if (e.target === overlay) overlay.classList.remove('show'); };

  var newdirOverlay = document.getElementById('newdir-modal');
  var newdirBtn = document.getElementById('btn-newdir');
  var newdirClose = document.getElementById('newdir-close');
  if (newdirBtn) newdirBtn.onclick = function(){ newdirOverlay.classList.add('show'); };
  if (newdirClose) newdirClose.onclick = function(){ newdirOverlay.classList.remove('show'); };
  if (newdirOverlay) newdirOverlay.onclick = function(e){ if (e.target === newdirOverlay) newdirOverlay.classList.remove('show'); };

  var fileInput = document.getElementById('upload-file-input');
  var submitBtn = document.getElementById('upload-submit-btn');
  if (fileInput && submitBtn) {
    fileInput.addEventListener('change', function() {
      submitBtn.disabled = !this.files || this.files.length === 0;
    });
  }
})();
</script>
<table>
<thead><tr><th>Name</th><th>Last modified</th><th>Size</th></tr></thead>
<tbody>
${listRows}
</tbody>
</table>
<hr>
</div>
</body>
</html>`;
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { renderIndexPage };
