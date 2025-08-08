// 🚤 Teste de Autenticação - Barca Coletiva
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt, encryptUserData, decryptUserData } = require('./src/lib/encryption.ts');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🚤 Iniciando teste de autenticação...\n');

    // 1. Testar criação de usuário
    console.log('1️⃣ Testando criação de usuário...');
    const testUser = {
      phone: '5534999999999',
      password: 'test123',
      name: 'Usuário Teste'
    };

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { phone: testUser.phone }
    });

    if (existingUser) {
      console.log('✅ Usuário de teste já existe');
    } else {
      // Criptografar dados do usuário
      const encryptedUserData = encryptUserData(testUser);
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      encryptedUserData.password = hashedPassword;

      // Criar usuário
      const user = await prisma.user.create({
        data: encryptedUserData
      });

      console.log('✅ Usuário criado com sucesso');
      console.log('   ID:', user.id);
      console.log('   Telefone (criptografado):', user.phone);
      console.log('   Nome (criptografado):', user.name);
      console.log('   Ativo:', user.isActive);
    }

    // 2. Testar busca de usuário
    console.log('\n2️⃣ Testando busca de usuário...');
    
    // Buscar por telefone original
    let foundUser = await prisma.user.findUnique({
      where: { phone: testUser.phone }
    });

    console.log('Busca por telefone original:', foundUser ? '✅ Encontrado' : '❌ Não encontrado');

    // Buscar por telefone criptografado
    if (!foundUser) {
      try {
        const encryptedPhone = encrypt(testUser.phone);
        foundUser = await prisma.user.findUnique({
          where: { phone: encryptedPhone }
        });
        console.log('Busca por telefone criptografado:', foundUser ? '✅ Encontrado' : '❌ Não encontrado');
      } catch (error) {
        console.error('❌ Erro ao criptografar telefone para busca:', error.message);
      }
    }

    // 3. Testar descriptografia
    console.log('\n3️⃣ Testando descriptografia...');
    if (foundUser) {
      try {
        const decryptedUser = decryptUserData(foundUser);
        console.log('✅ Usuário descriptografado com sucesso');
        console.log('   ID:', decryptedUser.id);
        console.log('   Telefone:', decryptedUser.phone);
        console.log('   Nome:', decryptedUser.name);
        console.log('   Ativo:', decryptedUser.isActive);
      } catch (error) {
        console.error('❌ Erro ao descriptografar usuário:', error.message);
      }
    }

    // 4. Testar verificação de senha
    console.log('\n4️⃣ Testando verificação de senha...');
    if (foundUser) {
      const isPasswordValid = await bcrypt.compare(testUser.password, foundUser.password);
      console.log('Senha válida:', isPasswordValid ? '✅ Sim' : '❌ Não');
    }

    // 5. Listar todos os usuários
    console.log('\n5️⃣ Listando todos os usuários...');
    const allUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        phone: true,
        name: true,
        isActive: true,
        isAdmin: true,
        createdAt: true
      }
    });

    console.log('Total de usuários:', await prisma.user.count());
    console.log('Primeiros 5 usuários:');
    
    allUsers.forEach((user, index) => {
      try {
        const decrypted = decryptUserData(user);
        console.log(`   ${index + 1}. ID: ${decrypted.id}, Telefone: ${decrypted.phone}, Nome: ${decrypted.name}, Ativo: ${decrypted.isActive}`);
      } catch (error) {
        console.log(`   ${index + 1}. ID: ${user.id}, Telefone: ${user.phone}, Nome: ${user.name}, Ativo: ${user.isActive} (erro ao descriptografar)`);
      }
    });

    console.log('\n🎉 Teste de autenticação concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testAuth();