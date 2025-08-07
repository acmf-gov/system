// 🚤 Popular banco de dados com dados iniciais
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🚤 Populando banco de dados...');
    
    // Criar produtos se não existirem
    const productCount = await prisma.product.count();
    if (productCount === 0) {
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
      console.log('✅ Produtos criados!');
    }
    
    // Criar barca de exemplo se não existir
    const bargeCount = await prisma.barge.count();
    if (bargeCount === 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await prisma.barge.create({
        data: {
          name: 'Barca do Dia',
          description: 'Barca coletiva diária com os melhores produtos',
          targetGrams: 100,
          currentGrams: 0,
          pricePerGram: 65.00,
          status: 'active',
          startDate: new Date(),
          endDate: tomorrow
        }
      });
      console.log('✅ Barca de exemplo criada!');
    }
    
    // Criar sala de chat geral se não existir
    const chatRoomCount = await prisma.chatRoom.count();
    if (chatRoomCount === 0) {
      await prisma.chatRoom.create({
        data: {
          name: 'Geral',
          description: 'Sala de chat geral para todos os usuários',
          isPrivate: false
        }
      });
      console.log('✅ Sala de chat geral criada!');
    }
    
    console.log('🎉 Banco de dados populado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
seedDatabase();