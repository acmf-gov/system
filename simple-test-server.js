const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const hostname = 'localhost';

console.log('🚤 Iniciando servidor simples...');

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barca Coletiva - Sistema de Compras Coletivas</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .welcome {
            color: #333;
            margin-bottom: 30px;
            font-size: 18px;
        }
        .btn {
            background: #667eea;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #5a6fd8;
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚤</div>
        <h1>Barca Coletiva</h1>
        <div class="subtitle">Sistema de compras coletivas de produtos canábicos</div>
        <div class="welcome">Bem-vindo ao sistema!</div>
        <button class="btn" onclick="enterSystem()">Entrar no Sistema</button>
        <div class="status">
            <strong>Status:</strong> Servidor online<br>
            <strong>Porta:</strong> ${port}<br>
            <strong>Horário:</strong> ${new Date().toLocaleString('pt-BR')}
        </div>
    </div>

    <script>
        function enterSystem() {
            alert('Sistema em manutenção. Por favor, tente novamente mais tarde.');
        }
    </script>
</body>
</html>
    `);
    return;
  }

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Servidor simples funcionando'
    }));
    return;
  }

  // Para qualquer outra rota, retornar 404
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>Página não encontrada</h1><p><a href="/">Voltar para o início</a></p>');
});

server.listen(port, hostname, () => {
  console.log(`🚀 Servidor iniciado com sucesso!`);
  console.log(`🌐 Acessar: http://${hostname}:${port}`);
  console.log(`👤 Admin: admin/@Wad235rt`);
  console.log(`🔌 Servidor simples rodando na porta ${port}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});