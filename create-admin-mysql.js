const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Tentando conectar ao banco de dados MySQL...');
    
    // Testar conexão primeiro
    await prisma.$connect();
    console.log('Conexão com MySQL estabelecida com sucesso!');
    
    // Verificar se o usuário admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@barcas.com' }
    });
    
    if (existingAdmin) {
      console.log('Usuário admin já existe, atualizando...');
      const hashedPassword = await bcrypt.hash('@Wad235rt', 10);
      
      const updatedAdmin = await prisma.user.update({
        where: { email: 'admin@barcas.com' },
        data: {
          password: hashedPassword,
          isAdmin: true,
          name: 'Admin'
        }
      });
      
      console.log('Admin user atualizado com sucesso!');
    } else {
      console.log('Criando novo usuário admin...');
      const hashedPassword = await bcrypt.hash('@Wad235rt', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@barcas.com',
          name: 'Admin',
          password: hashedPassword,
          isAdmin: true,
        },
      });
      
      console.log('Admin user criado com sucesso!');
    }
    
    // Verificar todos os usuários no banco
    const allUsers = await prisma.user.findMany();
    console.log(`\nTotal de usuários no banco: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Admin: ${user.isAdmin}`);
    });
    
  } catch (error) {
    console.error('Erro detalhado:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();