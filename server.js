const http = require('http');
const fs   = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.mp3':  'audio/mpeg',
  '.json': 'application/json',
};

http.createServer((req, res) => {
  let filePath = '.' + decodeURIComponent(req.url);
  if (filePath === './') filePath = './index.html';
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(3000, () => console.log('游戏运行在 http://localhost:3000'));
