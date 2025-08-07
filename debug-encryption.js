// 🚤 Debug de Criptografia - Barca Coletiva
const { PrismaClient } = require('@prisma/client');
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

const prisma = new PrismaClient();

async function debugEncryption() {
  try {
    console.log('🚤 Debug de Criptografia - Investigando o problema...\n');

    const testPhone = '5534999999999';
    
    // 1. Testar criptografia consistente
    console.log('1️⃣ Testando consistência da criptografia...');
    
    const encrypted1 = encrypt(testPhone);
    const encrypted2 = encrypt(testPhone);
    const encrypted3 = encrypt(testPhone);
    
    console.log('Telefone original:', testPhone);
    console.log('Criptografado 1:', encrypted1);
    console.log('Criptografado 2:', encrypted2);
    console.log('Criptografado 3:', encrypted3);
    console.log('São iguais?', encrypted1 === encrypted2 && encrypted2 === encrypted3);
    
    // Testar descriptografia
    const decrypted1 = decrypt(encrypted1);
    const decrypted2 = decrypt(encrypted2);
    const decrypted3 = decrypt(encrypted3);
    
    console.log('Descriptografado 1:', decrypted1);
    console.log('Descriptografado 2:', decrypted2);
    console.log('Descriptografado 3:', decrypted3);
    console.log('São iguais ao original?', decrypted1 === testPhone && decrypted2 === testPhone && decrypted3 === testPhone);

    // 2. Buscar usuário no banco de dados
    console.log('\n2️⃣ Buscando usuário no banco de dados...');
    
    // Buscar todos os usuários
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        isActive: true,
        isAdmin: true,
        createdAt: true
      }
    });

    console.log('Total de usuários:', allUsers.length);
    
    // Procurar pelo telefone de teste
    let foundUser = null;
    let foundByEncrypted = null;
    
    for (const user of allUsers) {
      console.log(`\nUsuário ID: ${user.id}`);
      console.log('Telefone armazenado:', user.phone);
      
      // Tentar descriptografar
      try {
        const decryptedPhone = decrypt(user.phone);
        console.log('Telefone descriptografado:', decryptedPhone);
        
        if (decryptedPhone === testPhone) {
          foundUser = user;
          console.log('✅ Usuário encontrado por descriptografia!');
        }
      } catch (error) {
        console.log('❌ Falha ao descriptografar:', error.message);
      }
      
      // Tentar criptografar o telefone de teste e comparar
      try {
        const encryptedTestPhone = encrypt(testPhone);
        console.log('Telefone teste criptografado:', encryptedTestPhone);
        console.log('Igual ao armazenado?', user.phone === encryptedTestPhone);
        
        if (user.phone === encryptedTestPhone) {
          foundByEncrypted = user;
          console.log('✅ Usuário encontrado por criptografia!');
        }
      } catch (error) {
        console.log('❌ Falha ao criptografar para comparação:', error.message);
      }
    }

    // 3. Testar diferentes abordagens de busca
    console.log('\n3️⃣ Testando diferentes abordagens de busca...');
    
    // Abordagem 1: Busca direta pelo telefone original
    console.log('Abordagem 1: Busca direta pelo telefone original...');
    try {
      const directUser = await prisma.user.findUnique({
        where: { phone: testPhone }
      });
      console.log('Resultado:', directUser ? '✅ Encontrado' : '❌ Não encontrado');
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
    
    // Abordagem 2: Busca pelo telefone criptografado
    console.log('\nAbordagem 2: Busca pelo telefone criptografado...');
    try {
      const encryptedPhone = encrypt(testPhone);
      console.log('Telefone criptografado:', encryptedPhone);
      
      const encryptedUser = await prisma.user.findUnique({
        where: { phone: encryptedPhone }
      });
      console.log('Resultado:', encryptedUser ? '✅ Encontrado' : '❌ Não encontrado');
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
    
    // Abordagem 3: Buscar todos e filtrar
    console.log('\nAbordagem 3: Buscar todos e filtrar...');
    try {
      const allUsersForFilter = await prisma.user.findMany();
      let foundByFilter = null;
      
      for (const user of allUsersForFilter) {
        try {
          const decryptedPhone = decrypt(user.phone);
          if (decryptedPhone === testPhone) {
            foundByFilter = user;
            break;
          }
        } catch (error) {
          // Ignorar erros de descriptografia
        }
      }
      
      console.log('Resultado:', foundByFilter ? '✅ Encontrado' : '❌ Não encontrado');
      if (foundByFilter) {
        console.log('ID do usuário encontrado:', foundByFilter.id);
      }
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }

    // 4. Verificar a chave de criptografia
    console.log('\n4️⃣ Verificando configuração de criptografia...');
    console.log('Chave de criptografia usada:', ENCRYPTION_KEY);
    console.log('Comprimento da chave:', ENCRYPTION_KEY.length);
    
    // Testar com a chave do arquivo .env
    const envKey = 'faabf8268fbbdc7805d496999420139b05d6b46d08e47018c0cccfd7f5effc4c';
    console.log('Chave do .env:', envKey);
    console.log('Chaves são iguais?', ENCRYPTION_KEY === envKey);

    // 5. Testar criptografia com diferentes chaves
    console.log('\n5️⃣ Testando criptografia com diferentes chaves...');
    
    const testWithKey = (key, description) => {
      try {
        const encrypted = CryptoJS.AES.encrypt(testPhone, key).toString();
        const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
        console.log(`${description}:`);
        console.log(`  Criptografado: ${encrypted}`);
        console.log(`  Descriptografado: ${decrypted}`);
        console.log(`  Sucesso: ${decrypted === testPhone}`);
      } catch (error) {
        console.log(`${description}: ❌ Erro - ${error.message}`);
      }
    };
    
    testWithKey(ENCRYPTION_KEY, 'Chave atual');
    testWithKey(envKey, 'Chave do .env');
    testWithKey('your-256-bit-secret-key-here', 'Chave padrão');

    console.log('\n🎉 Debug concluído!');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar debug
debugEncryption();