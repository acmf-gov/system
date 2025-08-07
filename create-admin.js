// 🚤 Criar usuário admin automaticamente
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🚤 Criando usuário admin...');
    
    // Verificar se admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { phone: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('✅ Usuário admin já existe!');
      return;
    }
    
    // Hash da senha
    const hashedPassword = bcrypt.hashSync('@Wad235rt', 10);
    
    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        phone: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        email: 'admin@barcacoletiva.com',
        isVerified: true,
        isAdmin: true,
        isActive: true
      }
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('👤 Telefone: admin');
    console.log('🔑 Senha: @Wad235rt');
    console.log('📧 Email: admin@barcacoletiva.com');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
createAdmin();