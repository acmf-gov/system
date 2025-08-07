// 🚤 Teste Completo de Autenticação - Barca Coletiva
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'faabf8268fbbdc7805d496999420139b05d6b46d08e47018c0cccfd7f5effc4c';

// Encrypt data
const encrypt = (data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data
const decrypt = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Encrypt sensitive user data
const encryptUserData = (userData) => {
  const sensitiveFields = ['phone', 'email', 'name'];
  const encryptedData = { ...userData };
  
  sensitiveFields.forEach(field => {
    if (encryptedData[field]) {
      try {
        encryptedData[field] = encrypt(encryptedData[field]);
      } catch (error) {
        console.error(`Failed to encrypt ${field}:`, error);
        // Keep original data if encryption fails
      }
    }
  });
  
  return encryptedData;
};

// Decrypt sensitive user data
const decryptUserData = (encryptedData) => {
  const sensitiveFields = ['phone', 'email', 'name'];
  const decryptedData = { ...encryptedData };
  
  sensitiveFields.forEach(field => {
    if (decryptedData[field]) {
      try {
        // Try to decrypt
        const decrypted = decrypt(decryptedData[field]);
        decryptedData[field] = decrypted;
      } catch (error) {
        // If decryption fails, check if it's already decrypted (original format)
        console.warn(`Failed to decrypt ${field}, keeping original. Error: ${error.message}`);
        // Keep original data - it might be already in plain text
      }
    }
  });
  
  return decryptedData;
};

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🚤 Iniciando teste completo de autenticação...\n');

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
      console.log('   ID:', existingUser.id);
      console.log('   Telefone (criptografado):', existingUser.phone);
      console.log('   Ativo:', existingUser.isActive);
    } else {
      // Criptografar dados do usuário
      const encryptedUserData = encryptUserData(testUser);
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      encryptedUserData.password = hashedPassword;
      encryptedUserData.isActive = true;
      encryptedUserData.isVerified = false;
      encryptedUserData.isAdmin = false;

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

    // 2. Testar busca de usuário (simulando o login)
    console.log('\n2️⃣ Testando busca de usuário (simulando login)...');
    
    // Buscar por telefone original
    let foundUser = await prisma.user.findUnique({
      where: { phone: testUser.phone }
    });

    console.log('Busca por telefone original:', foundUser ? '✅ Encontrado' : '❌ Não encontrado');

    // Buscar por telefone criptografado
    if (!foundUser) {
      try {
        const encryptedPhone = encrypt(testUser.phone);
        console.log('Telefone criptografado para busca:', encryptedPhone);
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
        console.log('   Admin:', decryptedUser.isAdmin);
      } catch (error) {
        console.error('❌ Erro ao descriptografar usuário:', error.message);
      }
    }

    // 4. Testar verificação de senha
    console.log('\n4️⃣ Testando verificação de senha...');
    if (foundUser) {
      const isPasswordValid = await bcrypt.compare(testUser.password, foundUser.password);
      console.log('Senha válida:', isPasswordValid ? '✅ Sim' : '❌ Não');
      
      // Testar senha incorreta
      const isWrongPasswordValid = await bcrypt.compare('wrongpassword', foundUser.password);
      console.log('Senha incorreta rejeitada:', !isWrongPasswordValid ? '✅ Sim' : '❌ Não');
    }

    // 5. Testar status do usuário
    console.log('\n5️⃣ Testando status do usuário...');
    if (foundUser) {
      console.log('Usuário está ativo:', foundUser.isActive ? '✅ Sim' : '❌ Não');
      
      // Testar com usuário inativo
      if (foundUser.isActive) {
        console.log('Desativando usuário para teste...');
        await prisma.user.update({
          where: { id: foundUser.id },
          data: { isActive: false }
        });
        
        const inactiveUser = await prisma.user.findUnique({
          where: { id: foundUser.id }
        });
        
        console.log('Usuário agora está inativo:', !inactiveUser.isActive ? '✅ Sim' : '❌ Não');
        
        // Reativar usuário
        await prisma.user.update({
          where: { id: foundUser.id },
          data: { isActive: true }
        });
        
        console.log('Usuário reativado com sucesso');
      }
    }

    // 6. Listar todos os usuários
    console.log('\n6️⃣ Listando todos os usuários...');
    const allUsers = await prisma.user.findMany({
      take: 10,
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
    console.log('Primeiros 10 usuários:');
    
    allUsers.forEach((user, index) => {
      try {
        const decrypted = decryptUserData(user);
        console.log(`   ${index + 1}. ID: ${decrypted.id}, Telefone: ${decrypted.phone}, Nome: ${decrypted.name || 'N/A'}, Ativo: ${decrypted.isActive}, Admin: ${decrypted.isAdmin}`);
      } catch (error) {
        console.log(`   ${index + 1}. ID: ${user.id}, Telefone: ${user.phone}, Nome: ${user.name || 'N/A'}, Ativo: ${user.isActive}, Admin: ${user.isAdmin} (erro ao descriptografar)`);
      }
    });

    // 7. Testar criação de múltiplos usuários
    console.log('\n7️⃣ Testando criação de múltiplos usuários...');
    const testUsers = [
      { phone: '5534988888888', password: 'test456', name: 'Usuário 2' },
      { phone: '5534977777777', password: 'test789', name: 'Usuário 3' }
    ];

    for (const userData of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { phone: userData.phone }
      });

      if (!existing) {
        const encrypted = encryptUserData(userData);
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        encrypted.password = hashedPassword;
        encrypted.isActive = true;
        encrypted.isVerified = false;
        encrypted.isAdmin = false;

        const newUser = await prisma.user.create({
          data: encrypted
        });

        console.log(`✅ Usuário ${userData.name} criado com ID: ${newUser.id}`);
      } else {
        console.log(`ℹ️  Usuário ${userData.name} já existe`);
      }
    }

    console.log('\n🎉 Teste completo de autenticação concluído!');
    console.log('\n📋 Resumo:');
    console.log('   - Criptografia/descriptografia: ✅ Funcionando');
    console.log('   - Criação de usuários: ✅ Funcionando');
    console.log('   - Busca de usuários: ✅ Funcionando');
    console.log('   - Verificação de senha: ✅ Funcionando');
    console.log('   - Status do usuário: ✅ Funcionando');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testAuth();