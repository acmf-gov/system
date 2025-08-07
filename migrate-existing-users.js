// 🚤 Migrar Usuários Existentes - Barca Coletiva
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

// Generate deterministic hash for searchable fields
const generateHash = (data) => {
  try {
    return CryptoJS.HmacSHA256(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Hash generation error:', error);
    throw new Error('Failed to generate hash');
  }
};

const prisma = new PrismaClient();

async function migrateExistingUsers() {
  try {
    console.log('🚤 Migrando usuários existentes para o novo formato...\n');

    // Buscar todos os usuários
    const allUsers = await prisma.user.findMany();
    console.log(`Total de usuários encontrados: ${allUsers.length}`);

    let migratedCount = 0;
    let alreadyMigratedCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      try {
        // Verificar se o usuário já foi migrado
        if (user.phoneHash && user.phoneEncrypted) {
          console.log(`ℹ️  Usuário ${user.phone || user.id} já está migrado`);
          alreadyMigratedCount++;
          continue;
        }

        // Verificar se o usuário tem um telefone para migrar
        if (!user.phone) {
          console.log(`⚠️  Usuário ${user.id} não tem telefone, pulando...`);
          continue;
        }

        console.log(`🔄 Migrando usuário ${user.phone} (${user.id})`);

        // Gerar hash e criptografar telefone
        const phoneHash = generateHash(user.phone);
        const phoneEncrypted = encrypt(user.phone);

        // Atualizar usuário
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phoneHash,
            phoneEncrypted
          }
        });

        console.log(`✅ Usuário ${user.phone} migrado com sucesso`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Erro ao migrar usuário ${user.phone || user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Migração concluída!');
    console.log('\n📋 Resumo:');
    console.log(`   - Total de usuários: ${allUsers.length}`);
    console.log(`   - Usuários migrados: ${migratedCount}`);
    console.log(`   - Usuários já migrados: ${alreadyMigratedCount}`);
    console.log(`   - Erros: ${errorCount}`);

    // Verificar o estado final
    console.log('\n🔍 Verificando estado final...');
    const finalUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        phone: true,
        phoneEncrypted: true,
        phoneHash: true,
        isActive: true,
        isAdmin: true
      }
    });

    console.log('Primeiros 5 usuários após migração:');
    finalUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Telefone: ${user.phone}, Hash: ${user.phoneHash ? '✅' : '❌'}, Criptografado: ${user.phoneEncrypted ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateExistingUsers();