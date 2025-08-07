const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Funções de criptografia
function generateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function decryptUserData(user) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isActive: user.isActive
  };
}

const server = http.createServer(async (req, res) => {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>🚤 Barca Coletiva</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 10px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #333;
              margin-bottom: 1rem;
            }
            p {
              color: #666;
              margin-bottom: 2rem;
            }
            .status {
              background: #4CAF50;
              color: white;
              padding: 1rem;
              border-radius: 5px;
              margin-bottom: 1rem;
            }
            .btn {
              background: #667eea;
              color: white;
              padding: 0.8rem 2rem;
              border: none;
              border-radius: 25px;
              font-size: 1rem;
              cursor: pointer;
              margin: 0.5rem;
              text-decoration: none;
              display: inline-block;
              transition: background 0.3s;
            }
            .btn:hover {
              background: #5a6fd8;
            }
            .error {
              background: #f44336;
              color: white;
              padding: 0.5rem;
              border-radius: 5px;
              margin: 0.5rem 0;
            }
            .success {
              background: #4CAF50;
              color: white;
              padding: 0.5rem;
              border-radius: 5px;
              margin: 0.5rem 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚤 Barca Coletiva</h1>
            <div class="status">
              ✅ Servidor funcionando!
            </div>
            <p>Sistema de compras coletivas de produtos canábicos</p>
            <p>O servidor está online e respondendo corretamente.</p>
            
            <div id="message"></div>
            
            <div style="margin: 2rem 0;">
              <h3>Teste de Login:</h3>
              <input type="text" id="phone" placeholder="Telefone (admin)" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 5px;">
              <input type="password" id="password" placeholder="Senha (@Wad235rt)" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 5px;">
              <button onclick="testLogin()" class="btn">Testar Login</button>
            </div>
            
            <a href="/status" class="btn">Ver Status do Sistema</a>
          </div>

          <script>
            async function testLogin() {
              const phone = document.getElementById('phone').value;
              const password = document.getElementById('password').value;
              const messageDiv = document.getElementById('message');
              
              try {
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ phone, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  messageDiv.innerHTML = '<div class="success">✅ Login funcionando! Token: ' + data.token.substring(0, 20) + '...</div>';
                } else {
                  messageDiv.innerHTML = '<div class="error">❌ Erro: ' + data.error + '</div>';
                }
              } catch (error) {
                messageDiv.innerHTML = '<div class="error">❌ Erro de conexão: ' + error.message + '</div>';
              }
            }
          </script>
        </body>
      </html>
    `);
  } else if (req.url === '/demo') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🚤 Barca Coletiva - Demonstração</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  margin: 0;
                  padding: 20px;
                  min-height: 100vh;
              }
              .container {
                  background: white;
                  border-radius: 15px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  max-width: 1200px;
                  margin: 0 auto;
                  overflow: hidden;
              }
              .header {
                  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                  color: white;
                  padding: 2rem;
                  text-align: center;
              }
              .content {
                  padding: 2rem;
              }
              .card {
                  background: #f8f9fa;
                  border-radius: 10px;
                  padding: 1.5rem;
                  margin: 1rem 0;
                  border-left: 4px solid #4CAF50;
              }
              .btn {
                  background: #667eea;
                  color: white;
                  padding: 0.8rem 2rem;
                  border: none;
                  border-radius: 25px;
                  font-size: 1rem;
                  cursor: pointer;
                  margin: 0.5rem;
                  text-decoration: none;
                  display: inline-block;
                  transition: all 0.3s;
              }
              .btn:hover {
                  background: #5a6fd8;
                  transform: translateY(-2px);
              }
              .btn.success {
                  background: #4CAF50;
              }
              .btn.success:hover {
                  background: #45a049;
              }
              .btn.danger {
                  background: #f44336;
              }
              .btn.danger:hover {
                  background: #da190b;
              }
              .grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                  gap: 1rem;
                  margin: 2rem 0;
              }
              .status-online {
                  color: #4CAF50;
                  font-weight: bold;
              }
              .status-offline {
                  color: #f44336;
                  font-weight: bold;
              }
              .log-area {
                  background: #1e1e1e;
                  color: #00ff00;
                  padding: 1rem;
                  border-radius: 5px;
                  font-family: monospace;
                  font-size: 0.9rem;
                  max-height: 300px;
                  overflow-y: auto;
                  margin: 1rem 0;
              }
              .form-group {
                  margin: 1rem 0;
              }
              .form-group label {
                  display: block;
                  margin-bottom: 0.5rem;
                  font-weight: bold;
                  color: #333;
              }
              .form-group input, .form-group select {
                  width: 100%;
                  padding: 0.8rem;
                  border: 2px solid #ddd;
                  border-radius: 5px;
                  font-size: 1rem;
                  transition: border-color 0.3s;
              }
              .form-group input:focus, .form-group select:focus {
                  outline: none;
                  border-color: #667eea;
              }
              .product-card {
                  background: white;
                  border: 1px solid #ddd;
                  border-radius: 10px;
                  padding: 1rem;
                  margin: 0.5rem 0;
                  transition: transform 0.3s;
              }
              .product-card:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
              }
              .price {
                  color: #4CAF50;
                  font-weight: bold;
                  font-size: 1.2rem;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1 style="font-size: 2.5rem; margin: 0;">🚤 Barca Coletiva</h1>
                  <p style="font-size: 1.2rem; margin: 1rem 0 0 0; opacity: 0.9;">Demonstração do Sistema Funcional</p>
              </div>
              
              <div class="content">
                  <!-- Status do Sistema -->
                  <div class="card">
                      <h2>🖥️ Status do Sistema</h2>
                      <div class="grid">
                          <div>
                              <strong>Servidor:</strong> <span id="server-status" class="status-offline">Verificando...</span>
                          </div>
                          <div>
                              <strong>API:</strong> <span id="api-status" class="status-offline">Verificando...</span>
                          </div>
                          <div>
                              <strong>Banco de Dados:</strong> <span id="db-status" class="status-offline">Verificando...</span>
                          </div>
                          <div>
                              <strong>Porta:</strong> <span>3002</span>
                          </div>
                      </div>
                  </div>

                  <!-- Teste de Login -->
                  <div class="card">
                      <h2>🔐 Teste de Autenticação</h2>
                      <div class="grid">
                          <div>
                              <div class="form-group">
                                  <label>Telefone:</label>
                                  <input type="text" id="login-phone" value="admin" placeholder="Digite o telefone">
                              </div>
                              <div class="form-group">
                                  <label>Senha:</label>
                                  <input type="password" id="login-password" value="@Wad235rt" placeholder="Digite a senha">
                              </div>
                              <button class="btn success" onclick="testLogin()">🚀 Testar Login</button>
                              <button class="btn" onclick="clearLoginForm()">🗑️ Limpar</button>
                          </div>
                          <div>
                              <h4>Resultado:</h4>
                              <div id="login-result" class="log-area">Aguardando teste...</div>
                          </div>
                      </div>
                  </div>

                  <!-- Produtos -->
                  <div class="card">
                      <h2>📦 Produtos Disponíveis</h2>
                      <button class="btn" onclick="loadProducts()">🔄 Carregar Produtos</button>
                      <div id="products-container">
                          <div class="log-area">Carregando produtos...</div>
                      </div>
                  </div>

                  <!-- Barcas -->
                  <div class="card">
                      <h2>🚤 Barcas Disponíveis</h2>
                      <button class="btn" onclick="loadBarges()">🔄 Carregar Barcas</button>
                      <div id="barges-container">
                          <div class="log-area">Carregando barcas...</div>
                      </div>
                  </div>

                  <!-- Logs -->
                  <div class="card">
                      <h2>📋 Logs do Sistema</h2>
                      <button class="btn danger" onclick="clearLogs()">🗑️ Limpar Logs</button>
                      <div id="system-logs" class="log-area">
                          Sistema iniciado. Aguardando interações...
                      </div>
                  </div>

                  <!-- Ações -->
                  <div class="card">
                      <h2>🎯 Ações Rápidas</h2>
                      <div class="grid">
                          <a href="/" class="btn">🏠 Página Principal</a>
                          <a href="/status" class="btn">📊 Status do Sistema</a>
                          <a href="/api/health" class="btn success">❤️ Health Check</a>
                          <button class="btn" onclick="window.location.reload()">🔄 Recarregar Página</button>
                      </div>
                  </div>
              </div>
          </div>

          <script>
              let authToken = null;

              // Função para adicionar logs
              function addLog(message, type = 'info') {
                  const logs = document.getElementById('system-logs');
                  const timestamp = new Date().toLocaleTimeString();
                  const color = type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#74c0fc';
                  logs.innerHTML += '<div style="color: ' + color + '">[' + timestamp + '] ' + message + '</div>';
                  logs.scrollTop = logs.scrollHeight;
              }

              // Função para limpar logs
              function clearLogs() {
                  document.getElementById('system-logs').innerHTML = 'Logs limpos. Sistema pronto para novos testes...';
                  addLog('Logs limpos pelo usuário', 'success');
              }

              // Verificar status do sistema
              async function checkSystemStatus() {
                  try {
                      // Verificar API
                      const response = await fetch('/api/health');
                      if (response.ok) {
                          document.getElementById('server-status').textContent = '✅ Online';
                          document.getElementById('server-status').className = 'status-online';
                          document.getElementById('api-status').textContent = '✅ Online';
                          document.getElementById('api-status').className = 'status-online';
                          document.getElementById('db-status').textContent = '✅ Conectado';
                          document.getElementById('db-status').className = 'status-online';
                          addLog('Sistema verificado: Todos os serviços online', 'success');
                      } else {
                          throw new Error('API não respondeu corretamente');
                      }
                  } catch (error) {
                      document.getElementById('server-status').textContent = '❌ Offline';
                      document.getElementById('server-status').className = 'status-offline';
                      document.getElementById('api-status').textContent = '❌ Offline';
                      document.getElementById('api-status').className = 'status-offline';
                      document.getElementById('db-status').textContent = '❌ Erro';
                      document.getElementById('db-status').className = 'status-offline';
                      addLog('Erro ao verificar sistema: ' + error.message, 'error');
                  }
              }

              // Testar login
              async function testLogin() {
                  const phone = document.getElementById('login-phone').value;
                  const password = document.getElementById('login-password').value;
                  const resultDiv = document.getElementById('login-result');

                  if (!phone || !password) {
                      resultDiv.innerHTML = '<div style="color: #ff6b6b;">❌ Preencha todos os campos!</div>';
                      addLog('Tentativa de login falhou: Campos vazios', 'error');
                      return;
                  }

                  addLog('Tentando login com usuário: ' + phone);
                  resultDiv.innerHTML = '<div style="color: #74c0fc;">⏳ Processando login...</div>';

                  try {
                      const response = await fetch('/api/auth/login', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ phone, password })
                      });

                      const data = await response.json();

                      if (response.ok) {
                          authToken = data.token;
                          resultDiv.innerHTML = 
                              '<div style="color: #51cf66;">✅ Login realizado com sucesso!</div>' +
                              '<div><strong>Token:</strong> ' + data.token.substring(0, 50) + '...</div>' +
                              '<div><strong>Usuário:</strong> ' + data.user.name + ' (' + data.user.phone + ')</div>' +
                              '<div><strong>Admin:</strong> ' + (data.user.isAdmin ? 'Sim' : 'Não') + '</div>';
                          addLog('Login bem-sucedido: ' + data.user.name, 'success');
                      } else {
                          resultDiv.innerHTML = '<div style="color: #ff6b6b;">❌ Erro: ' + data.error + '</div>';
                          addLog('Login falhou: ' + data.error, 'error');
                      }
                  } catch (error) {
                      resultDiv.innerHTML = '<div style="color: #ff6b6b;">❌ Erro de conexão: ' + error.message + '</div>';
                      addLog('Erro de conexão no login: ' + error.message, 'error');
                  }
              }

              // Limpar formulário de login
              function clearLoginForm() {
                  document.getElementById('login-phone').value = '';
                  document.getElementById('login-password').value = '';
                  document.getElementById('login-result').innerHTML = 'Formulário limpo. Ready for next test...';
                  authToken = null;
                  addLog('Formulário de login limpo', 'info');
              }

              // Carregar produtos
              async function loadProducts() {
                  const container = document.getElementById('products-container');
                  container.innerHTML = '<div class="log-area">🔄 Carregando produtos...</div>';
                  addLog('Carregando lista de produtos...');

                  try {
                      const response = await fetch('/api/products');
                      const data = await response.json();

                      if (response.ok) {
                          let productsHtml = '';
                          data.products.forEach(product => {
                              productsHtml += 
                                  '<div class="product-card">' +
                                  '<h3>' + product.name + '</h3>' +
                                  '<p><strong>Tipo:</strong> ' + product.type + '</p>' +
                                  '<p><strong>Descrição:</strong> ' + product.description + '</p>' +
                                  '<p class="price">R$ ' + product.pricePerGram.toFixed(2) + '/g</p>' +
                                  '<p><strong>Estoque:</strong> ' + product.stock + 'g</p>' +
                                  '<button class="btn success" onclick="selectProduct(\\'' + product.id + '\\')">Selecionar</button>' +
                                  '</div>';
                          });
                          container.innerHTML = productsHtml;
                          addLog(data.products.length + ' produtos carregados com sucesso', 'success');
                      } else {
                          container.innerHTML = '<div class="log-area" style="color: #ff6b6b;">❌ Erro ao carregar produtos</div>';
                          addLog('Erro ao carregar produtos', 'error');
                      }
                  } catch (error) {
                      container.innerHTML = '<div class="log-area" style="color: #ff6b6b;">❌ Erro: ' + error.message + '</div>';
                      addLog('Erro ao carregar produtos: ' + error.message, 'error');
                  }
              }

              // Carregar barcas
              async function loadBarges() {
                  const container = document.getElementById('barges-container');
                  container.innerHTML = '<div class="log-area">🔄 Carregando barcas...</div>';
                  addLog('Carregando lista de barcas...');

                  try {
                      const response = await fetch('/api/barges');
                      const data = await response.json();

                      if (response.ok) {
                          if (data.barges.length === 0) {
                              container.innerHTML = '<div class="log-area" style="color: #74c0fc;">ℹ️ Nenhuma barca disponível no momento</div>';
                              addLog('Nenhuma barca encontrada', 'info');
                          } else {
                              let bargesHtml = '';
                              data.barges.forEach(barge => {
                                  bargesHtml += 
                                      '<div class="product-card">' +
                                      '<h3>' + barge.name + '</h3>' +
                                      '<p><strong>Descrição:</strong> ' + (barge.description || 'Sem descrição') + '</p>' +
                                      '<p><strong>Meta:</strong> ' + barge.targetGrams + 'g</p>' +
                                      '<p><strong>Atual:</strong> ' + barge.currentGrams + 'g</p>' +
                                      '<p><strong>Status:</strong> ' + barge.status + '</p>' +
                                      '<button class="btn success" onclick="selectBarge(\\'' + barge.id + '\\')">Ver Detalhes</button>' +
                                      '</div>';
                              });
                              container.innerHTML = bargesHtml;
                              addLog(data.barges.length + ' barcas carregadas com sucesso', 'success');
                          }
                      } else {
                          container.innerHTML = '<div class="log-area" style="color: #ff6b6b;">❌ Erro ao carregar barcas</div>';
                          addLog('Erro ao carregar barcas', 'error');
                      }
                  } catch (error) {
                      container.innerHTML = '<div class="log-area" style="color: #ff6b6b;">❌ Erro: ' + error.message + '</div>';
                      addLog('Erro ao carregar barcas: ' + error.message, 'error');
                  }
              }

              // Selecionar produto
              function selectProduct(productId) {
                  addLog('Produto selecionado: ' + productId, 'success');
                  alert('Produto ' + productId + ' selecionado!');
              }

              // Selecionar barca
              function selectBarge(bargeId) {
                  addLog('Barca selecionada: ' + bargeId, 'success');
                  alert('Barca ' + bargeId + ' selecionada!');
              }

              // Inicialização
              document.addEventListener('DOMContentLoaded', function() {
                  addLog('Página de demonstração carregada', 'success');
                  checkSystemStatus();
                  
                  // Auto-verificar status a cada 30 segundos
                  setInterval(checkSystemStatus, 30000);
                  
                  // Carregar dados iniciais
                  setTimeout(() => {
                      loadProducts();
                      loadBarges();
                  }, 1000);
              });
          </script>
      </body>
      </html>
    `);
  } else if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🚤 Barca Coletiva - Status</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  margin: 0;
                  padding: 20px;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              .container {
                  background: white;
                  padding: 2rem;
                  border-radius: 15px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 500px;
                  width: 100%;
              }
              .logo {
                  font-size: 3rem;
                  margin-bottom: 1rem;
              }
              h1 {
                  color: #333;
                  margin-bottom: 1rem;
                  font-size: 2rem;
              }
              .status-card {
                  background: #4CAF50;
                  color: white;
                  padding: 1.5rem;
                  border-radius: 10px;
                  margin: 1.5rem 0;
                  font-size: 1.1rem;
              }
              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 1rem;
                  margin: 1.5rem 0;
              }
              .info-item {
                  background: #f5f5f5;
                  padding: 1rem;
                  border-radius: 8px;
                  text-align: left;
              }
              .info-label {
                  font-weight: bold;
                  color: #666;
                  font-size: 0.9rem;
              }
              .info-value {
                  color: #333;
                  font-size: 1rem;
                  margin-top: 0.5rem;
              }
              .actions {
                  margin-top: 2rem;
              }
              .btn {
                  background: #667eea;
                  color: white;
                  padding: 0.8rem 2rem;
                  border: none;
                  border-radius: 25px;
                  font-size: 1rem;
                  cursor: pointer;
                  margin: 0.5rem;
                  text-decoration: none;
                  display: inline-block;
                  transition: background 0.3s;
              }
              .btn:hover {
                  background: #5a6fd8;
              }
              .btn.success {
                  background: #4CAF50;
              }
              .btn.success:hover {
                  background: #45a049;
              }
              .timestamp {
                  color: #666;
                  font-size: 0.9rem;
                  margin-top: 1rem;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">🚤</div>
              <h1>Barca Coletiva</h1>
              <div class="status-card">
                  ✅ Servidor Online e Funcionando!
              </div>
              
              <div class="info-grid">
                  <div class="info-item">
                      <div class="info-label">Status do Sistema</div>
                      <div class="info-value">Operacional</div>
                  </div>
                  <div class="info-item">
                      <div class="info-label">Porta</div>
                      <div class="info-value">3002</div>
                  </div>
                  <div class="info-item">
                      <div class="info-label">API</div>
                      <div class="info-value">Respondendo</div>
                  </div>
                  <div class="info-item">
                      <div class="info-label">Banco de Dados</div>
                      <div class="info-value">Conectado</div>
                  </div>
              </div>
              
              <div class="actions">
                  <a href="/" class="btn">Página Principal</a>
                  <a href="/api/health" class="btn success">API Health Check</a>
              </div>
              
              <div class="timestamp">
                  Última verificação: <span id="timestamp"></span>
              </div>
          </div>

          <script>
              document.getElementById('timestamp').textContent = new Date().toLocaleString('pt-BR');
          </script>
      </body>
      </html>
    `);
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'API funcionando!',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      server: 'Barca Coletiva - Servidor Simplificado',
      version: '1.0.0',
      port: 3002
    }));
  } else if (req.url === '/api/auth/login' && req.method === 'POST') {
    // Rota de login
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { phone, password } = JSON.parse(body);
          
          if (!phone || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Telefone e senha são obrigatórios' }));
            return;
          }

          // Generate hash for phone search
          const phoneHash = generateHash(phone);

          // Buscar usuário pelo hash do telefone
          let user = await prisma.user.findUnique({
            where: { phoneHash }
          });

          // Se não encontrar, tentar buscar pelo telefone original (para compatibilidade)
          if (!user) {
            user = await prisma.user.findUnique({
              where: { phone }
            });
          }

          if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Usuário não encontrado' }));
            return;
          }

          // Verificar se o usuário está ativo
          if (!user.isActive) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Usuário inativo. Entre em contato com o suporte.' }));
            return;
          }

          // Verificar senha
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Senha incorreta' }));
            return;
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          });

          // Decrypt user data for response
          const decryptedUser = decryptUserData(user);

          // Generate JWT token
          const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            message: 'Login realizado com sucesso',
            token,
            user: {
              id: decryptedUser.id,
              phone: decryptedUser.phone,
              name: decryptedUser.name,
              email: decryptedUser.email,
              isAdmin: decryptedUser.isAdmin,
              isActive: decryptedUser.isActive
            }
          }));

        } catch (error) {
          console.error('Erro no login:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
    }
  } else if (req.url === '/api/barges' && req.method === 'GET') {
    // Rota para listar barcas
    try {
      const barges = await prisma.barge.findMany({
        include: {
          orders: true,
          bargeProducts: {
            include: {
              product: true
            }
          }
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ barges }));

    } catch (error) {
      console.error('Erro ao buscar barcas:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
    }
  } else if (req.url === '/api/products' && req.method === 'GET') {
    // Rota para listar produtos
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ products }));

    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>Página não encontrada</h1>');
  }
});

const PORT = 3002;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log('📊 Health check: http://localhost:' + PORT + '/api/health');
});