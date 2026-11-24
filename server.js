const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8000;
const ROOT = __dirname;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary'
};
http.createServer((req, res) => {
  let requestPath;
  try { requestPath = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (requestPath === '/') requestPath = '/index.html';
  const filePath = path.resolve(ROOT, '.' + requestPath);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('File not found'); }
    res.writeHead(200, {'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control':'no-cache'});
    res.end(data);
  });
}).listen(PORT, () => console.log(`NIM Jungle 3D running at http://localhost:${PORT}\nKeep this terminal open while playing.`));
