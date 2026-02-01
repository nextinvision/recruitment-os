/**
 * Simple HTTP Server for Testing Extension
 * 
 * Run: node test-server.js
 * Then open: http://localhost:3001/test/popup-test.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // Remove query string
  let filePath = req.url.split('?')[0];
  
  // Default to index.html
  if (filePath === '/') {
    filePath = '/test/popup-test.html';
  }
  
  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Remove leading slash
  filePath = filePath.substring(1);
  
  // Full file path
  const fullPath = path.join(ROOT, filePath);
  
  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    // Read and serve file
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Server error');
        return;
      }
      
      const ext = path.extname(fullPath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Test server running!`);
  console.log(`\n📋 Open in browser:`);
  console.log(`   http://localhost:${PORT}/test/popup-test.html`);
  console.log(`   http://localhost:${PORT}/dist/popup/index.html`);
  console.log(`\n🛑 Press Ctrl+C to stop\n`);
});

