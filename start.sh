#!/bin/bash

# 🚤 Barca Coletiva - Script de Inicialização
echo "🚤 Iniciando Barca Coletiva..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado!"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📋 Criando arquivo .env padrão..."
    cat > .env << EOF
# 🚤 Barca Coletiva - Configuração Automática
# Gerado em: $(date)

# Database
DATABASE_URL="mysql://admin:@Wad235rt@168.231.127.189:9897/dbcenter"

# NextAuth
NEXTAUTH_SECRET="HEnSg+mLMLQcmg38I6Hvw6C+6DX6SfcPQEqazSP2mtc="
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="WEbRSBLzYL10j/BaHCx1OLYimCVHSBWVqiR5aihK/Zo="

# Encryption
ENCRYPTION_KEY="faabf8268fbbdc7805d496999420139b05d6b46d08e47018c0cccfd7f5effc4c"

# Socket.IO
SOCKET_IO_CORS_ORIGIN="http://localhost:3000"

# Z-AI SDK
ZAI_API_KEY="your-z-ai-api-key"

# Node Environment
NODE_ENV=production
PORT=3000

# Easy Panel Specific
EASY_PANEL=true
EOF
    echo "✅ Arquivo .env criado!"
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se o banco de dados está acessível
echo "🔧 Verificando conexão com o banco de dados..."
if ! npm run db:push > /dev/null 2>&1; then
    echo "⚠️  Aviso: Não foi possível verificar o banco de dados. Continuando mesmo assim..."
fi

# Iniciar o servidor
echo "🚀 Iniciando servidor..."
NODE_ENV=production node server.js