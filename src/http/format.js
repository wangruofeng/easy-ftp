const path = require('path');

const MAX_LINE_WIDTH = 50;

/**
 * 格式化为参考站点的日期：DD-Mon-YYYY HH:MM
 */
function formatDate(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${mon}-${year} ${h}:${m}`;
}

/**
 * Last updated 用：Monday, 09-Feb-2026 02:12:54 GMT
 */
function formatLastUpdated(d) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[d.getUTCDay()];
  const date = String(d.getUTCDate()).padStart(2, '0');
  const mon = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${day}, ${date}-${mon}-${year} ${h}:${m}:${s} GMT`;
}

/**
 * 文件大小人性化：K, M, G
 */
function formatSize(bytes) {
  if (bytes === 0) return '0';
  const k = 1024;
  const units = ['', 'K', 'M', 'G'];
  let i = 0;
  let n = bytes;
  while (n >= k && i < units.length - 1) {
    n /= k;
    i++;
  }
  return i === 0 ? String(n) : (n % 1 === 0 ? n : n.toFixed(1)) + units[i];
}

/**
 * 将 URL 路径规范化为相对数据根的路径，确保不逃逸出 data root
 */
function resolvePath(urlPath, dataRoot) {
  const normalized = '/' + (urlPath || '').replace(/\/+/g, '/').replace(/\/$/, '') || '';
  const resolved = path.resolve(dataRoot, '.' + normalized);
  if (!resolved.startsWith(dataRoot)) return null;
  const relative = path.relative(dataRoot, resolved) || '';
  return { resolved, relative: relative.split(path.sep).join('/') };
}

// *** 之间内容区宽度，总行宽与顶部横幅一致
const WELCOME_CONTENT_WIDTH = 72;
const WELCOME_LINE_WIDTH = 4 + WELCOME_CONTENT_WIDTH + 4; // *** (4) + 内容(72) + *** (4) = 80

/**
 * 信息框单行：内容在 *** 之间居中对齐
 */
function welcomeLine(line) {
  const prefix = '*** ';
  const suffix = ' ***';
  const content = line.length > WELCOME_CONTENT_WIDTH ? line.slice(0, WELCOME_CONTENT_WIDTH) : line;
  if (content.length >= WELCOME_CONTENT_WIDTH) {
    return prefix + content + suffix;
  }
  const leftPad = Math.floor((WELCOME_CONTENT_WIDTH - content.length) / 2);
  const rightPad = WELCOME_CONTENT_WIDTH - content.length - leftPad;
  return prefix + ' '.repeat(leftPad) + content + ' '.repeat(rightPad) + suffix;
}

module.exports = {
  formatDate,
  formatLastUpdated,
  formatSize,
  resolvePath,
  welcomeLine,
  MAX_LINE_WIDTH,
  WELCOME_LINE_WIDTH,
};
