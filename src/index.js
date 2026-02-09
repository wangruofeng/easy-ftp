const fs = require('fs');
const path = require('path');
const config = require('../config');
const { startHttpServer } = require('./http/server');
const { startFtpServer } = require('./ftp/server');

const dataRoot = path.resolve(config.DATA_ROOT);
if (!fs.existsSync(dataRoot)) {
  fs.mkdirSync(dataRoot, { recursive: true });
  console.log('[Init] Created data root:', dataRoot);
}

// 先启动 HTTP，保证浏览器能打开；FTP 独立启动，失败不影响 HTTP
startHttpServer();

startFtpServer()
  .then(() => {
    console.log('[FTP] Server at ftp://localhost:' + config.FTP_PORT + ' (anonymous)');
  })
  .catch((err) => {
    console.warn('[FTP] Not running:', err.message);
    console.warn('      Web index still works. Fix FTP (e.g. port ' + config.FTP_PORT + ') if needed.');
  });

console.log('');
console.log('Ready. Open http://localhost:' + config.HTTP_PORT + ' in browser.');
