const path = require('path');
const FtpSrv = require('ftp-srv');
const config = require('../../config');

function startFtpServer() {
  const dataRoot = path.resolve(config.DATA_ROOT);
  const port = config.FTP_PORT;
  const ftpServer = new FtpSrv({
    url: `ftp://0.0.0.0:${port}`,
    anonymous: true,
    pasv_min: 1024,
    pasv_max: 65535,
  });

  ftpServer.on('login', ({ username, password }, resolve, reject) => {
    const anonNames = ['anonymous', 'anon'];
    if (anonNames.includes((username || '').toLowerCase())) {
      return resolve({ root: dataRoot });
    }
    reject(new Error('Invalid username or password'));
  });

  return ftpServer
    .listen()
    .then(() => {
      console.log(`[FTP] Server at ftp://localhost:${port} (root: ${dataRoot})`);
      return ftpServer;
    })
    .catch((err) => {
      console.error('[FTP] Failed to start:', err.message);
      throw err;
    });
}

module.exports = { startFtpServer };
