// 🚤 Atualizar Esquema do Banco de Dados - Barca Coletiva
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDatabaseSchema() {
  try {
    console.log('🚤 Atualizando esquema do banco de dados...\n');

    // Verificar se as colunas já existem
    console.log('1️⃣ Verificando colunas existentes...');
    
    // Tentar criar um usuário com os novos campos para ver se eles existem
    try {
      const testUser = await prisma.user.create({
        data: {
          phone: 'test_temp_user',
          password: 'temp_password',
          phoneEncrypted: 'temp_encrypted',
          phoneHash: 'temp_hash',
          isActive: true
        }
      });
      
      // Se funcionar, as colunas já existem, então excluímos o usuário de teste
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      
      console.log('✅ Colunas já existem no banco de dados');
      return;
    } catch (error) {
      if (error.message.includes('no such column')) {
        console.log('❌ Colunas não existem, precisamos criá-las');
      } else {
        console.log('❌ Erro ao verificar colunas:', error.message);
        return;
      }
    }

    // Como não podemos executar SQL diretamente com Prisma para alterar tabela,
    // vamos usar uma abordagem alternativa: criar uma nova tabela e migrar os dados
    
    console.log('\n2️⃣ Criando script de migração manual...');
    
    // O ideal seria executar estes comandos SQL diretamente:
    const sqlCommands = [
      'ALTER TABLE users ADD COLUMN phoneEncrypted TEXT;',
      'ALTER TABLE users ADD COLUMN phoneHash TEXT;',
      'CREATE UNIQUE INDEX users_phoneHash_key ON users(phoneHash);',
      'UPDATE users SET phoneHash = phone WHERE phoneHash IS NULL;'
    ];
    
    console.log('Comandos SQL que precisam ser executados:');
    sqlCommands.forEach((cmd, index) => {
      console.log(`${index + 1}. ${cmd}`);
    });
    
    console.log('\n⚠️  Como não podemos executar SQL diretamente via Prisma sem migrações,');
    console.log('   você precisará executar estes comandos manualmente no SQLite:');
    console.log('\n   sqlite3 prisma/dev.db');
    console.log('   > ALTER TABLE users ADD COLUMN phoneEncrypted TEXT;');
    console.log('   > ALTER TABLE users ADD COLUMN phoneHash TEXT;');
    console.log('   > CREATE UNIQUE INDEX users_phoneHash_key ON users(phoneHash);');
    console.log('   > .exit');
    
    // Vamos tentar uma abordagem alternativa: verificar se podemos usar o Prisma migrate
    console.log('\n3️⃣ Tentando criar migração com Prisma...');
    
    try {
      // Verificar se há migrações pendentes
      const { execSync } = require('child_process');
      execSync('npx prisma migrate dev --name add-phone-encryption --create-only', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migração criada com sucesso');
    } catch (error) {
      console.log('❌ Erro ao criar migração:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar atualização
updateDatabaseSchema();