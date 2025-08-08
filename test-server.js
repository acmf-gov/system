const http = require('http');
const next = require('next');

const dev = true;
const hostname = 'localhost';
const port = 3000;

console.log('🚤 Iniciando servidor de teste...');

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer(async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  server.listen(port, () => {
    console.log('🚀 Servidor de teste iniciado com sucesso!');
    console.log('🌐 Acessar: http://localhost:' + port);
  });
});