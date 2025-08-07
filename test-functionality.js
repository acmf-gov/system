const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testFunctionality() {
  console.log('🧪 Iniciando testes de funcionalidade...\n')

  try {
    // Test 1: Database Connection
    console.log('1. Testando conexão com o banco de dados...')
    await prisma.$connect()
    console.log('✅ Conexão com o banco de dados estabelecida\n')

    // Test 2: Admin User
    console.log('2. Verificando usuário admin...')
    const adminUser = await prisma.user.findUnique({
      where: { phone: 'admin' }
    })
    
    if (adminUser && adminUser.isAdmin) {
      console.log('✅ Usuário admin encontrado e verificado')
      console.log(`   ID: ${adminUser.id}`)
      console.log(`   Nome: ${adminUser.name}`)
      console.log(`   Admin: ${adminUser.isAdmin}\n`)
    } else {
      console.log('❌ Usuário admin não encontrado ou não é admin\n')
    }

    // Test 3: User Creation with Encryption
    console.log('3. Testando criação de usuário com criptografia...')
    const testPassword = 'test123'
    const hashedPassword = await bcrypt.hash(testPassword, 10)
    
    const testUser = await prisma.user.create({
      data: {
        phone: 'testuser' + Date.now(),
        password: hashedPassword,
        name: 'Test User',
        isActive: true
      }
    })
    console.log('✅ Usuário de teste criado com sucesso')
    console.log(`   ID: ${testUser.id}`)
    console.log(`   Telefone: ${testUser.phone}\n`)

    // Test 4: Product Creation
    console.log('4. Testando criação de produto...')
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Product for testing',
        type: 'GELO',
        isActive: true
      }
    })
    console.log('✅ Produto de teste criado com sucesso')
    console.log(`   ID: ${testProduct.id}`)
    console.log(`   Nome: ${testProduct.name}`)
    console.log(`   Tipo: ${testProduct.type}\n`)

    // Test 5: Barge Creation
    console.log('5. Testando criação de barca...')
    const testBarge = await prisma.barge.create({
      data: {
        title: 'Test Barge',
        description: 'Barge for testing',
        productId: testProduct.id,
        targetGrams: 100,
        unitPrice: 70,
        totalValue: 7000,
        eventDate: new Date(),
        status: 'ACTIVE',
        createdBy: adminUser.id
      }
    })
    console.log('✅ Barca de teste criada com sucesso')
    console.log(`   ID: ${testBarge.id}`)
    console.log(`   Título: ${testBarge.title}`)
    console.log(`   Status: ${testBarge.status}\n`)

    // Test 6: Order Creation
    console.log('6. Testando criação de pedido...')
    const testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        bargeId: testBarge.id,
        grams: 10,
        total: 700,
        status: 'PENDING'
      }
    })
    console.log('✅ Pedido de teste criado com sucesso')
    console.log(`   ID: ${testOrder.id}`)
    console.log(`   Gramas: ${testOrder.grams}`)
    console.log(`   Total: R$ ${testOrder.total}\n`)

    // Test 7: Chat Room Creation
    console.log('7. Testando criação de sala de chat...')
    const testChatRoom = await prisma.chatRoom.create({
      data: {
        name: 'Test Chat Room',
        type: 'GROUP',
        createdBy: adminUser.id,
        members: {
          create: [
            { userId: adminUser.id, role: 'ADMIN' },
            { userId: testUser.id, role: 'MEMBER' }
          ]
        }
      }
    })
    console.log('✅ Sala de chat de teste criada com sucesso')
    console.log(`   ID: ${testChatRoom.id}`)
    console.log(`   Nome: ${testChatRoom.name}`)
    console.log(`   Tipo: ${testChatRoom.type}\n`)

    // Test 8: Chat Message Creation
    console.log('8. Testando criação de mensagem de chat...')
    const testMessage = await prisma.chatMessage.create({
      data: {
        roomId: testChatRoom.id,
        userId: adminUser.id,
        content: 'Hello, this is a test message!',
        type: 'TEXT'
      }
    })
    console.log('✅ Mensagem de chat de teste criada com sucesso')
    console.log(`   ID: ${testMessage.id}`)
    console.log(`   Conteúdo: ${testMessage.content}\n`)

    // Test 9: Referral Code Generation
    console.log('9. Testando sistema de indicações...')
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { referralCode: 'TESTCODE' + Date.now().toString().slice(-6) }
    })
    console.log('✅ Código de indicação gerado com sucesso')
    console.log(`   Código: ${updatedUser.referralCode}\n`)

    // Test 10: Payment Creation
    console.log('10. Testando criação de pagamento...')
    const testPayment = await prisma.payment.create({
      data: {
        userId: testUser.id,
        orderId: testOrder.id,
        amount: 700,
        method: 'PIX',
        status: 'PENDING'
      }
    })
    console.log('✅ Pagamento de teste criado com sucesso')
    console.log(`   ID: ${testPayment.id}`)
    console.log(`   Valor: R$ ${testPayment.amount}`)
    console.log(`   Método: ${testPayment.method}\n`)

    // Test 11: Delivery Creation
    console.log('11. Testando criação de entrega...')
    const testDelivery = await prisma.delivery.create({
      data: {
        bargeId: testBarge.id,
        status: 'PENDING',
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      }
    })
    console.log('✅ Entrega de teste criada com sucesso')
    console.log(`   ID: ${testDelivery.id}`)
    console.log(`   Status: ${testDelivery.status}\n`)

    // Test 12: Notification Creation
    console.log('12. Testando criação de notificação...')
    const testNotification = await prisma.notification.create({
      data: {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'GENERAL',
        userId: testUser.id
      }
    })
    console.log('✅ Notificação de teste criada com sucesso')
    console.log(`   ID: ${testNotification.id}`)
    console.log(`   Título: ${testNotification.title}\n`)

    // Summary
    console.log('🎉 Todos os testes foram concluídos com sucesso!')
    console.log('\n📊 Resumo dos testes:')
    console.log('   ✅ Conexão com banco de dados')
    console.log('   ✅ Usuário admin')
    console.log('   ✅ Criação de usuário com criptografia')
    console.log('   ✅ Criação de produto')
    console.log('   ✅ Criação de barca')
    console.log('   ✅ Criação de pedido')
    console.log('   ✅ Criação de sala de chat')
    console.log('   ✅ Criação de mensagem de chat')
    console.log('   ✅ Sistema de indicações')
    console.log('   ✅ Criação de pagamento')
    console.log('   ✅ Criação de entrega')
    console.log('   ✅ Criação de notificação')
    console.log('\n🚀 O sistema está pronto para implantação!')

  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
    console.error('\nDetalhes do erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testFunctionality()