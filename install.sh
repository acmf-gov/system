#!/bin/bash

# 🚤 Barca Coletiva - Instalador Automático para Easy Panel
# Uso: ./install.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo "=========================================="
echo "  🚤 Barca Coletiva - Instalador Automático"
echo "=========================================="
echo

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   log_error "Este script precisa ser executado como root"
   exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_info "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
    log_success "Node.js instalado"
else
    log_success "Node.js já está instalado: $(node --version)"
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    log_info "Instalando PM2..."
    npm install -g pm2
    pm2 startup
    pm2 save
    log_success "PM2 instalado"
else
    log_success "PM2 já está instalado"
fi

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    log_info "Instalando PostgreSQL..."
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    
    # Configurar banco de dados
    log_info "Configurando banco de dados..."
    sudo -u postgres psql << EOF
CREATE DATABASE barca_coletiva;
CREATE USER barca_user WITH PASSWORD 'barca123';
GRANT ALL PRIVILEGES ON DATABASE barca_coletiva TO barca_user;
ALTER USER barca_user CREATEDB;
EOF
    log_success "PostgreSQL instalado e configurado"
else
    log_success "PostgreSQL já está instalado"
fi

# Instalar dependências
log_info "Instalando dependências do projeto..."
npm install
log_success "Dependências instaladas"

# Configurar variáveis de ambiente
log_info "Configurando variáveis de ambiente..."
if [ ! -f .env ]; then
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://barca_user:barca123@localhost:5432/barca_coletiva"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="$(openssl rand -base64 32)"

# Encryption
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Socket.IO
SOCKET_IO_CORS_ORIGIN="http://localhost:3000"

# Z-AI SDK
ZAI_API_KEY="your-z-ai-api-key"
EOF
    log_success "Arquivo .env criado"
else
    log_success "Arquivo .env já existe"
fi

# Configurar banco de dados
log_info "Configurando banco de dados..."
npx prisma generate
npx prisma db push
log_success "Banco de dados configurado"

# Build do projeto
log_info "Buildando projeto..."
npm run build
log_success "Build concluído"

# Iniciar aplicação com PM2
log_info "Iniciando aplicação..."
if pm2 describe barca-coletiva > /dev/null 2>&1; then
    pm2 restart barca-coletiva
else
    pm2 start ecosystem.config.js
fi
pm2 save
log_success "Aplicação iniciada"

# Criar usuário admin
log_info "Criando usuário admin..."
node create-admin.js
log_success "Usuário admin criado"

# Configurar firewall
log_info "Configurando firewall..."
ufw allow 3000/tcp
ufw --force enable
log_success "Firewall configurado"

# Exibir informações finais
echo
echo "=========================================="
echo "  🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=========================================="
echo
echo "📋 Informações de acesso:"
echo "  🌐 URL: http://localhost:3000"
echo "  👤 Admin: admin/@Wad235rt"
echo "  🔑 Senha: @Wad235rt"
echo
echo "🔧 Comandos úteis:"
echo "  pm2 status           # Verificar status"
echo "  pm2 logs barca-coletiva  # Verificar logs"
echo "  pm2 restart barca-coletiva  # Reiniciar aplicação"
echo "  pm2 stop barca-coletiva    # Parar aplicação"
echo
echo "📁 Arquivos importantes:"
echo "  .env                # Variáveis de ambiente"
echo "  ecosystem.config.js # Configuração PM2"
echo "  logs/               # Logs da aplicação"
echo
echo "🚀 Acesse sua aplicação: http://localhost:3000"
echo "=========================================="

# Esperar 5 segundos e abrir o navegador
sleep 5
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
fi