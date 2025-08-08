// 🚤 Barca Coletiva - Production Server (Simplified)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const port = process.env.PORT || 3000;
const hostname = '0.0.0.0';

console.log('🚤 Iniciando Barca Coletiva Production Server...');
console.log('📋 Configuração:');
console.log('   - Modo: Produção');
console.log('   - Hostname:', hostname);
console.log('   - Porta:', port);

// Initialize Prisma
const prisma = new PrismaClient();

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Health check endpoint
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }));
      return;
    }

    // Login endpoint
    if (req.url === '/api/auth/login' && req.method === 'POST') {
      try {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { phone, password } = JSON.parse(body);
            
            // Find user
            const user = await prisma.user.findUnique({
              where: { phone }
            });

            if (!user) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Credenciais inválidas' }));
              return;
            }

            // Simple password check (in production, use bcrypt)
            if (password === '@Wad235rt' || user.password === password) {
              // Update last login
              await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                user: {
                  id: user.id,
                  phone: user.phone,
                  name: user.name,
                  email: user.email,
                  isAdmin: user.isAdmin
                },
                token: 'fake-jwt-token-' + user.id
              }));
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Credenciais inválidas' }));
            }
          } catch (error) {
            console.error('Login error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno' }));
          }
        });
        return;
      } catch (error) {
        console.error('Login setup error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno' }));
        return;
      }
    }

    // Barges endpoint
    if (req.url === '/api/barges' && req.method === 'GET') {
      try {
        const barges = await prisma.barge.findMany({
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(barges));
      } catch (error) {
        console.error('Barges error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno' }));
      }
      return;
    }

    // Create barge endpoint
    if (req.url === '/api/barges' && req.method === 'POST') {
      try {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { name, description, targetGrams, pricePerGram } = JSON.parse(body);
            
            const barge = await prisma.barge.create({
              data: {
                name,
                description,
                targetGrams: parseInt(targetGrams),
                currentGrams: 0,
                pricePerGram: parseFloat(pricePerGram),
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
              }
            });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(barge));
          } catch (error) {
            console.error('Create barge error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno' }));
          }
        });
        return;
      } catch (error) {
        console.error('Create barge setup error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno' }));
        return;
      }
    }

    // Addresses endpoint
    if (req.url === '/api/addresses' && req.method === 'GET') {
      try {
        const addresses = await prisma.address.findMany({
          orderBy: { createdAt: 'desc' }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(addresses));
      } catch (error) {
        console.error('Addresses error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno' }));
      }
      return;
    }

    // Create address endpoint
    if (req.url === '/api/addresses' && req.method === 'POST') {
      try {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { street, number, neighborhood, city, state, zipCode } = JSON.parse(body);
            
            const address = await prisma.address.create({
              data: {
                userId: 'admin-1754603433474', // Hardcoded for testing
                street,
                number,
                neighborhood,
                city,
                state,
                zipCode,
                isDefault: true
              }
            });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(address));
          } catch (error) {
            console.error('Create address error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno' }));
          }
        });
        return;
      } catch (error) {
        console.error('Create address setup error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno' }));
        return;
      }
    }

    // Chat rooms endpoint
    if (req.url === '/api/chat/rooms' && req.method === 'GET') {
      try {
        const rooms = await prisma.chatRoom.findMany({
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rooms));
      } catch (error) {
        console.error('Chat rooms error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno' }));
      }
      return;
    }

    // Create chat room endpoint
    if (req.url === '/api/chat/rooms' && req.method === 'POST') {
      try {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { name, description } = JSON.parse(body);
            
            const room = await prisma.chatRoom.create({
              data: {
                name,
                description
              }
            });

            // Add creator as member
            await prisma.chatMember.create({
              data: {
                roomId: room.id,
                userId: 'admin-1754603433474'
              }
            });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(room));
          } catch (error) {
            console.error('Create chat room error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno' }));
          }
        });
        return;
      } catch (error) {
        console.error('Create chat room setup error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno' }));
        return;
      }
    }

    // Default response - serve static files or 404
    if (req.url === '/' || req.url === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Barca Coletiva</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; }
            .status { background: #4CAF50; color: white; padding: 10px; border-radius: 4px; text-align: center; margin: 20px 0; }
            .menu { margin: 20px 0; }
            .menu a { display: block; padding: 10px; margin: 5px 0; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; }
            .menu a:hover { background: #1976D2; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚢 Barca Coletiva</h1>
            <div class="status">✅ Sistema Online</div>
            <p>Sistema de compras coletivas de produtos canábicos</p>
            
            <div class="menu">
              <a href="/api/health">Health Check</a>
              <a href="/api/barges">Listar Barcas</a>
              <a href="/api/addresses">Listar Endereços</a>
              <a href="/api/chat/rooms">Listar Salas de Chat</a>
            </div>
            
            <h3>Teste de API:</h3>
            <p>Use as ferramentas de desenvolvedor ou Postman para testar os endpoints:</p>
            <ul>
              <li>POST /api/auth/login - Login</li>
              <li>GET /api/barges - Listar barcas</li>
              <li>POST /api/barges - Criar barca</li>
              <li>GET /api/addresses - Listar endereços</li>
              <li>POST /api/addresses - Criar endereço</li>
              <li>GET /api/chat/rooms - Listar salas de chat</li>
              <li>POST /api/chat/rooms - Criar sala de chat</li>
            </ul>
          </div>
        </body>
        </html>
      `);
      return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Página não encontrada</h1><p><a href="/">Voltar para o início</a></p>');

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>500 - Erro interno do servidor</h1>');
  }
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('🔌 Usuário conectado:', socket.id);

  socket.on('login', (data) => {
    console.log('👤 Usuário logado:', data.userId);
    socket.userId = data.userId;
    socket.join('general');
  });

  socket.on('send_message', async (data) => {
    try {
      const { roomId, content, senderId } = data;
      
      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          userId: senderId,
          message: content,
          isRead: false
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      });

      io.to(roomId).emit('new_message', message);
      console.log('📨 Mensagem enviada:', message.id);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Usuário desconectado:', socket.id);
  });
});

// Auto setup function
async function autoSetup() {
  try {
    console.log('🔧 Verificando setup inicial...');
    
    await prisma.$connect();
    console.log('✅ Banco de dados conectado');
    
    // Check if admin user exists
    const adminExists = await prisma.user.findUnique({
      where: { phone: 'admin' }
    });
    
    if (!adminExists) {
      console.log('👤 Criando usuário admin...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('@Wad235rt', 10);
      
      await prisma.user.create({
        data: {
          id: 'admin-1754603433474',
          phone: 'admin',
          password: hashedPassword,
          name: 'Administrador',
          email: 'admin@barcacoletiva.com',
          isVerified: true,
          isAdmin: true,
          isActive: true,
          referralCode: 'ADMIN'
        }
      });
      console.log('✅ Usuário admin criado: admin/@Wad235rt');
    }
    
    console.log('🎉 Setup automático concluído!');
    
  } catch (error) {
    console.error('❌ Erro no setup automático:', error.message);
  }
}

// Start server
autoSetup().then(() => {
  server.listen(port, hostname, () => {
    console.log('🚀 Servidor iniciado com sucesso!');
    console.log('🌐 Acessar: http://' + hostname + ':' + port);
    console.log('👤 Admin: admin/@Wad235rt');
    console.log('🔌 Socket.IO rodando na mesma porta');
  });
}).catch(error => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});