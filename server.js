// 🚤 Barca Coletiva - Server.js (Auto-Setup para Easy Panel)
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

console.log('🚤 Iniciando Barca Coletiva Server...');

// Verificar variáveis de ambiente
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não está configurada!');
    console.log('📋 Por favor, configure as variáveis de ambiente no .env');
    process.exit(1);
}

// Inicializar Prisma
const prisma = new PrismaClient();

// Inicializar Next.js
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Função de setup automático
async function autoSetup() {
    try {
        console.log('🔧 Verificando setup inicial...');
        
        // Verificar se o banco de dados está acessível
        await prisma.$connect();
        console.log('✅ Banco de dados conectado');
        
        // Verificar se usuário admin existe
        const adminExists = await prisma.user.findUnique({
            where: { phone: 'admin' }
        });
        
        if (!adminExists) {
            console.log('👤 Criando usuário admin...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('@Wad235rt', 10);
            
            await prisma.user.create({
                data: {
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
        
        // Verificar se há produtos básicos
        const productsCount = await prisma.product.count();
        if (productsCount === 0) {
            console.log('📦 Criando produtos básicos...');
            await prisma.product.createMany({
                data: [
                    {
                        name: 'Gelo Premium',
                        description: 'Gelo de alta qualidade, perfeito para conservação',
                        type: 'gelo',
                        pricePerGram: 63.00,
                        stock: 1000,
                        isActive: true
                    },
                    {
                        name: 'Flor Top',
                        description: 'Flor de primeira linha, aroma intenso',
                        type: 'flor',
                        pricePerGram: 70.00,
                        stock: 500,
                        isActive: true
                    },
                    {
                        name: 'Dry Especial',
                        description: 'Dry especial, efeito prolongado',
                        type: 'dry',
                        pricePerGram: 75.00,
                        stock: 300,
                        isActive: true
                    }
                ]
            });
            console.log('✅ Produtos básicos criados');
        }
        
        console.log('🎉 Setup automático concluído!');
        
    } catch (error) {
        console.error('❌ Erro no setup automático:', error.message);
        console.log('⚠️  Continuando mesmo assim...');
    }
}

// Preparar aplicação
app.prepare().then(() => {
    // Criar servidor HTTP
    const server = http.createServer(async (req, res) => {
        try {
            await handler(req, res);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Configurar Socket.IO
    const io = new Server(server, {
        cors: {
            origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    // Armazenar usuários conectados
    const connectedUsers = new Map();

    // Eventos do Socket.IO
    io.on('connection', (socket) => {
        console.log('🔌 Usuário conectado:', socket.id);

        // Login do usuário
        socket.on('login', async (data) => {
            try {
                const { userId, token } = data;
                
                // Validar token (implementar validação real)
                if (userId && token) {
                    connectedUsers.set(userId, socket.id);
                    socket.userId = userId;
                    
                    // Entrar na sala geral
                    socket.join('general');
                    
                    console.log('👤 Usuário logado:', userId);
                    
                    // Notificar outros usuários
                    socket.to('general').emit('user_online', { userId });
                }
            } catch (error) {
                console.error('Erro no login:', error);
            }
        });

        // Enviar mensagem
        socket.on('send_message', async (data) => {
            try {
                const { roomId, content, senderId } = data;
                
                // Salvar mensagem no banco
                const message = await prisma.chatMessage.create({
                    data: {
                        roomId,
                        content,
                        senderId,
                        status: 'delivered'
                    },
                    include: {
                        sender: true
                    }
                });

                // Enviar para todos na sala
                io.to(roomId).emit('new_message', message);
                
                // Notificar usuários na sala
                const roomMembers = await prisma.chatRoomMember.findMany({
                    where: { roomId },
                    include: { user: true }
                });

                for (const member of roomMembers) {
                    const memberSocketId = connectedUsers.get(member.user.id);
                    if (memberSocketId && member.user.id !== senderId) {
                        io.to(memberSocketId).emit('notification', {
                            type: 'new_message',
                            message: `Nova mensagem em ${roomId}`,
                            data: message
                        });
                    }
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Digitando
        socket.on('typing', (data) => {
            socket.to(data.roomId).emit('user_typing', {
                userId: data.userId,
                roomId: data.roomId
            });
        });

        // Parar de digitar
        socket.on('stop_typing', (data) => {
            socket.to(data.roomId).emit('user_stopped_typing', {
                userId: data.userId,
                roomId: data.roomId
            });
        });

        // Marcar mensagens como lidas
        socket.on('mark_read', async (data) => {
            try {
                const { messageId, userId } = data;
                
                await prisma.chatMessage.update({
                    where: { id: messageId },
                    data: { status: 'read' }
                });

                socket.to(data.roomId).emit('message_read', { messageId, userId });
            } catch (error) {
                console.error('Erro ao marcar como lida:', error);
            }
        });

        // Desconexão
        socket.on('disconnect', () => {
            console.log('🔌 Usuário desconectado:', socket.id);
            
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
                socket.to('general').emit('user_offline', { userId: socket.userId });
            }
        });
    });

    // Health check endpoint
    server.on('request', (req, res) => {
        if (req.url === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            }));
        }
    });

    // Iniciar setup automático e depois o servidor
    autoSetup().then(() => {
        server.listen(port, () => {
            console.log('🚀 Servidor iniciado com sucesso!');
            console.log('🌐 Acessar: http://localhost:' + port);
            console.log('👤 Admin: admin/@Wad235rt');
            console.log('🔌 Socket.IO rodando na mesma porta');
        });
    }).catch(error => {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    });
});

// Tratamento de erros
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});