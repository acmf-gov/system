const http = require('http');
console.log('Creating simple server...');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!\n');
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Server running at http://127.0.0.1:3000/');
});

setTimeout(() => {
  console.log('Closing server...');
  server.close();
  process.exit(0);
}, 5000);