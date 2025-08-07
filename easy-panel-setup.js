#!/usr/bin/env node

// 🚤 Easy Panel Auto-Setup Script
// Este script roda automaticamente após o npm install no Easy Panel

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚤 Iniciando setup automático para Easy Panel...');

// Função para executar comandos
function runCommand(command, description) {
    try {
        console.log(`📋 ${description}...`);
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} concluído`);
    } catch (error) {
        console.error(`❌ Erro em ${description}:`, error.message);
        process.exit(1);
    }
}

// Função para gerar chaves aleatórias
function generateRandomKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateBase64Key(length = 32) {
    return crypto.randomBytes(length).toString('base64');
}

// Função para criar arquivo .env se não existir
function createEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
        console.log('📄 Arquivo .env já existe, pulando...');
        return;
    }
    
    console.log('📄 Criando arquivo .env...');
    
    const envContent = `# 🚤 Barca Coletiva - Configuração Automática
# Gerado em: ${new Date().toISOString()}

# Database
DATABASE_URL="postgresql://barca_user:${generateBase64Key(12)}@localhost:5432/barca_coletiva"

# NextAuth
NEXTAUTH_SECRET="${generateBase64Key(32)}"
NEXTAUTH_URL="${process.env.EASY_PANEL_DOMAIN || 'http://localhost:3000'}"

# JWT
JWT_SECRET="${generateBase64Key(32)}"

# Encryption
ENCRYPTION_KEY="${generateRandomKey(32)}"

# Socket.IO
SOCKET_IO_CORS_ORIGIN="${process.env.EASY_PANEL_DOMAIN || 'http://localhost:3000'}"

# Z-AI SDK
ZAI_API_KEY="your-z-ai-api-key"

# Node Environment
NODE_ENV=production
PORT=3000

# Easy Panel Specific
EASY_PANEL=true
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env criado com chaves aleatórias');
}

// Função para criar banco de dados se necessário
function setupDatabase() {
    try {
        // Verificar se DATABASE_URL está configurada
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            if (envContent.includes('DATABASE_URL=')) {
                console.log('🗄️ Configurando banco de dados...');
                runCommand('npx prisma db push', 'Push do schema do banco de dados');
                console.log('✅ Banco de dados configurado');
            }
        }
    } catch (error) {
        console.warn('⚠️  Não foi possível configurar o banco de dados automaticamente');
        console.warn('   Verifique se o PostgreSQL está rodando e a DATABASE_URL está correta');
    }
}

// Função para criar usuário admin
function createAdminUser() {
    try {
        console.log('👤 Criando usuário admin...');
        
        const adminScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('@Wad235rt', 10);
        
        const admin = await prisma.user.upsert({
            where: { phone: 'admin' },
            update: {},
            create: {
                phone: 'admin',
                password: hashedPassword,
                name: 'Administrador',
                email: 'admin@barcacoletiva.com',
                isVerified: true,
                isAdmin: true,
                isActive: true,
                referralCode: 'ADMIN'
            }
        });
        
        console.log('✅ Usuário admin criado com sucesso');
        console.log('   📱 Telefone: admin');
        console.log('   🔑 Senha: @Wad235rt');
    } catch (error) {
        console.warn('⚠️  Não foi possível criar usuário admin:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
`;
        
        fs.writeFileSync(path.join(process.cwd(), 'create-admin-temp.js'), adminScript);
        runCommand('node create-admin-temp.js', 'Criação do usuário admin');
        fs.unlinkSync(path.join(process.cwd(), 'create-admin-temp.js'));
        
    } catch (error) {
        console.warn('⚠️  Não foi possível criar usuário admin automaticamente');
    }
}

// Função principal
function main() {
    console.log('🚀 Iniciando setup automático do Barca Coletiva...');
    console.log('==========================================');
    
    // 1. Criar arquivo .env
    createEnvFile();
    
    // 2. Instalar dependências (já foi feito pelo npm install)
    console.log('📦 Dependências já instaladas pelo npm install');
    
    // 3. Gerar Prisma Client
    runCommand('npx prisma generate', 'Geração do Prisma Client');
    
    // 4. Configurar banco de dados
    setupDatabase();
    
    // 5. Build do projeto
    runCommand('npm run build', 'Build do projeto Next.js');
    
    // 6. Criar usuário admin
    createAdminUser();
    
    // 7. Limpar arquivos temporários
    console.log('🧹 Limpando arquivos temporários...');
    try {
        if (fs.existsSync(path.join(process.cwd(), 'create-admin-temp.js'))) {
            fs.unlinkSync(path.join(process.cwd(), 'create-admin-temp.js'));
        }
    } catch (error) {
        // Ignorar erros de limpeza
    }
    
    console.log('==========================================');
    console.log('🎉 SETUP AUTOMÁTICO CONCLUÍDO!');
    console.log('==========================================');
    console.log('');
    console.log('🌐 Seu sistema está pronto para usar!');
    console.log('   URL: http://localhost:3000');
    console.log('   Admin: admin/@Wad235rt');
    console.log('');
    console.log('🔧 Comandos úteis:');
    console.log('   npm start        - Iniciar aplicação');
    console.log('   npm run dev     - Modo desenvolvimento');
    console.log('   pm2 logs        - Ver logs (se usar PM2)');
    console.log('');
    console.log('📁 Arquivos criados:');
    console.log('   .env            - Variáveis de ambiente');
    console.log('   .next/          - Build da aplicação');
    console.log('');
    console.log('🚤 Barca Coletiva está pronta para uso!');
    console.log('==========================================');
}

// Executar setup
if (require.main === module) {
    main();
}

module.exports = { main };