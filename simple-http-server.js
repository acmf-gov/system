const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Barca Coletiva - Teste</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 48px; margin-bottom: 10px; }
        .status { padding: 20px; background: #f0f0f0; border-radius: 8px; margin: 20px 0; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🚤</div>
          <h1>Barca Coletiva</h1>
          <p>Sistema de compras coletivas de produtos canábicos</p>
        </div>
        
        <div class="status success">
          <h3>✅ Servidor HTTP está funcionando!</h3>
          <p>O servidor básico está rodando na porta 3000.</p>
        </div>
        
        <div class="status info">
          <h3>ℹ️ Status do Sistema</h3>
          <p><strong>Modo:</strong> Teste</p>
          <p><strong>Porta:</strong> 3000</p>
          <p><strong>Status:</strong> Online</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="status">
          <h3>🔧 Informações Técnicas</h3>
          <p>Este é um servidor de teste para verificar se a porta 3000 está acessível.</p>
          <p>O sistema completo está em processo de configuração.</p>
        </div>
        
        <div class="status">
          <h3>👤 Acesso Administrativo</h3>
          <p><strong>Usuário:</strong> admin</p>
          <p><strong>Senha:</strong> @Wad235rt</p>
          <p><em>(Nota: O login completo estará disponível quando o sistema estiver totalmente configurado)</em></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

server.listen(8080, () => {
  console.log('🚀 Servidor de teste iniciado na porta 8080');
  console.log('🌐 Acessar: http://localhost:8080');
});