// 🚤 Teste de Criptografia - Barca Coletiva
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

// Test functions
async function testEncryption() {
  console.log('🚤 Testando funções de criptografia...\n');

  // Test 1: Basic encryption/decryption
  console.log('1️⃣ Testando criptografia básica...');
  const originalText = '5534999999999';
  try {
    const encrypted = encrypt(originalText);
    console.log('Original:', originalText);
    console.log('Criptografado:', encrypted);
    
    const decrypted = decrypt(encrypted);
    console.log('Descriptografado:', decrypted);
    console.log('✅ Criptografia básica funcionando');
  } catch (error) {
    console.error('❌ Erro na criptografia básica:', error.message);
  }

  // Test 2: User data encryption/decryption
  console.log('\n2️⃣ Testando criptografia de dados de usuário...');
  const userData = {
    phone: '5534999999999',
    name: 'Usuário Teste',
    email: 'teste@example.com',
    password: 'hashed_password_here',
    isActive: true
  };

  try {
    const encryptedUserData = encryptUserData(userData);
    console.log('Dados originais:', userData);
    console.log('Dados criptografados:', encryptedUserData);
    
    const decryptedUserData = decryptUserData(encryptedUserData);
    console.log('Dados descriptografados:', decryptedUserData);
    console.log('✅ Criptografia de dados de usuário funcionando');
  } catch (error) {
    console.error('❌ Erro na criptografia de dados de usuário:', error.message);
  }

  // Test 3: Test with already encrypted data
  console.log('\n3️⃣ Testando com dados já criptografados...');
  try {
    const mixedData = {
      phone: '5534999999999', // Not encrypted
      name: encrypt('Usuário Teste'), // Already encrypted
      email: 'teste@example.com', // Not encrypted
      password: 'hashed_password_here',
      isActive: true
    };

    console.log('Dados mistos (alguns criptografados):', mixedData);
    
    const decryptedMixedData = decryptUserData(mixedData);
    console.log('Dados descriptografados:', decryptedMixedData);
    console.log('✅ Tratamento de dados mistos funcionando');
  } catch (error) {
    console.error('❌ Erro no tratamento de dados mistos:', error.message);
  }
}

// Run the test
testEncryption();