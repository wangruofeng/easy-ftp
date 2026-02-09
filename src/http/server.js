const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { resolvePath } = require('./format');
const { renderIndexPage } = require('./indexPage');
const config = require('../../config');

function createHttpServer() {
  const app = express();
  const dataRoot = path.resolve(config.DATA_ROOT);

  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: true }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
  });

  app.post('/api/upload', upload.array('file', 10), (req, res) => {
    const dirRelative = (req.body.path || '').replace(/\/+$/, '');
    const resolved = resolvePath(dirRelative, dataRoot);
    if (!resolved) {
      return res.status(403).send('Forbidden');
    }
    if (!fs.existsSync(resolved.resolved) || !fs.statSync(resolved.resolved).isDirectory()) {
      return res.status(400).send('Invalid directory');
    }
    const files = req.files || [];
    const saved = [];
    for (const f of files) {
      const safeName = path.basename((f.originalname || 'upload').replace(/\0/g, ''));
      if (!safeName) continue;
      const dest = path.join(resolved.resolved, safeName);
      if (path.resolve(dest).startsWith(dataRoot)) {
        fs.writeFileSync(dest, f.buffer);
        saved.push(safeName);
      }
    }
    const redirectPath = '/' + (resolved.relative ? resolved.relative + '/' : '');
    res.redirect(302, redirectPath);
  });

  app.post('/api/newfile', (req, res) => {
    const dirRelative = (req.body.path || '').replace(/\/+$/, '');
    const resolved = resolvePath(dirRelative, dataRoot);
    if (!resolved) {
      return res.status(403).send('Forbidden');
    }
    if (!fs.existsSync(resolved.resolved) || !fs.statSync(resolved.resolved).isDirectory()) {
      return res.status(400).send('Invalid directory');
    }
    const safeName = path.basename((req.body.filename || 'newfile.txt').replace(/\0/g, '').trim());
    if (!safeName) {
      return res.status(400).send('Filename required');
    }
    const dest = path.join(resolved.resolved, safeName);
    if (!path.resolve(dest).startsWith(dataRoot)) {
      return res.status(403).send('Forbidden');
    }
    const content = typeof req.body.content === 'string' ? req.body.content : '';
    try {
      fs.writeFileSync(dest, content, 'utf8');
    } catch (err) {
      return res.status(500).send('Failed to create file');
    }
    const redirectPath = '/' + (resolved.relative ? resolved.relative + '/' : '');
    res.redirect(302, redirectPath);
  });

  app.post('/api/newdir', (req, res) => {
    const dirRelative = (req.body.path || '').replace(/\/+$/, '');
    const resolved = resolvePath(dirRelative, dataRoot);
    if (!resolved) {
      return res.status(403).send('Forbidden');
    }
    if (!fs.existsSync(resolved.resolved) || !fs.statSync(resolved.resolved).isDirectory()) {
      return res.status(400).send('Invalid directory');
    }
    const safeName = path.basename((req.body.dirname || 'newfolder').replace(/\0/g, '').trim().replace(/\/+$/, ''));
    if (!safeName) {
      return res.status(400).send('Folder name required');
    }
    const dest = path.join(resolved.resolved, safeName);
    if (!path.resolve(dest).startsWith(dataRoot)) {
      return res.status(403).send('Forbidden');
    }
    try {
      if (fs.existsSync(dest)) {
        return res.status(400).send('Folder already exists');
      }
      fs.mkdirSync(dest, { recursive: false });
    } catch (err) {
      return res.status(500).send('Failed to create folder');
    }
    const redirectPath = '/' + (resolved.relative ? resolved.relative + '/' : '');
    res.redirect(302, redirectPath);
  });

  app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(dataRoot, 'favicon.ico');
    if (fs.existsSync(faviconPath) && fs.statSync(faviconPath).isFile()) {
      res.sendFile(faviconPath);
    } else {
      res.status(204).end();
    }
  });

  app.get('*', (req, res) => {
    let rawPath = (req.path || '/').replace(/^\/+/, '') || '';
    try {
      rawPath = decodeURIComponent(rawPath);
    } catch (_) {
      return res.status(400).send('Bad Request');
    }
    const isDirRequest = rawPath === '' || rawPath.endsWith('/');
    const pathWithoutTrailing = rawPath.replace(/\/$/, '');

    const resolved = resolvePath(pathWithoutTrailing, dataRoot);
    if (!resolved) {
      return res.status(403).send('Forbidden');
    }

    let stat;
    try {
      stat = fs.statSync(resolved.resolved);
    } catch (err) {
      if (err.code === 'ENOENT') return res.status(404).send('Not Found');
      return res.status(500).send('Internal Server Error');
    }

    if (stat.isDirectory()) {
      if (!isDirRequest) {
        const redirectPath = '/' + (pathWithoutTrailing ? pathWithoutTrailing + '/' : '');
        return res.redirect(302, redirectPath);
      }
      const urlPath = resolved.relative ? resolved.relative + '/' : '';
      const html = renderIndexPage(resolved.resolved, urlPath, config.FTP_HOST, config.SITE_NAME);
      if (!html) return res.status(500).send('Internal Server Error');
      res.type('html').send(html);
      return;
    }

    if (stat.isFile()) {
      res.setHeader('Content-Disposition', 'attachment; filename="' + path.basename(resolved.resolved) + '"');
      const stream = fs.createReadStream(resolved.resolved);
      stream.on('error', () => res.status(500).end());
      stream.pipe(res);
      return;
    }

    res.status(404).send('Not Found');
  });

  return app;
}

function startHttpServer() {
  const app = createHttpServer();
  const server = app.listen(config.HTTP_PORT, () => {
    console.log(`[HTTP] Index server at http://localhost:${config.HTTP_PORT}`);
  });
  return server;
}

module.exports = { createHttpServer, startHttpServer };
