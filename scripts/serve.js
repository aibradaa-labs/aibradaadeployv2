const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = fs.existsSync(path.join(rootDir, 'dist'))
  ? path.join(rootDir, 'dist')
  : rootDir;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

function getFilePath(urlPath) {
  const safeSuffix = path.normalize(urlPath).replace(/^\/+/, '');
  let filePath = path.join(distDir, safeSuffix);

  if (!filePath.startsWith(distDir)) {
    return null;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = getFilePath(decodeURIComponent(urlPath));

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.createReadStream(filePath)
    .on('open', () => {
      res.writeHead(200, { 'Content-Type': contentType });
    })
    .on('error', error => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server error: ${error.message}`);
    })
    .pipe(res);
});

const PORT = process.env.PORT || 4173;

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT} (serving ${distDir})`);
});
