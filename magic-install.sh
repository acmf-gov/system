#!/bin/bash

# 🚤 Instalador Mágico - Barca Coletiva para Easy Panel
# Uso: ./magic-install.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funções
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Banner
echo "████████████████████████████████████████████████████████"
echo "█                                                      █"
echo "█            🚤 BARCA COLETIVA - EASY PANEL            █"
echo "█                INSTALADOR MÁGICO v1.0               █"
echo "█                                                      █"
echo "████████████████████████████████████████████████████████"
echo

# Verificar se está como root
if [[ $EUID -eq 0 ]]; then
   log_warning "Executando como root. Isso pode causar problemas."
   read -p "Continuar mesmo assim? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Configurações
PROJECT_NAME="barca-coletiva"
PROJECT_DIR="$(pwd)"
NODE_VERSION="20"
PORT="3000"

log_info "Iniciando instalação mágica..."
log_info "Diretório: $PROJECT_DIR"
log_info "Node.js: $NODE_VERSION"
log_info "Porta: $PORT"
echo

# Aguardar confirmação
read -p "🚀 Começar instalação automática? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    log_info "Instalação cancelada"
    exit 0
fi

# Passo 1: Verificar Node.js
log_step "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    log_info "Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "Node.js instalado: $(node --version)"
else
    NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$NODE_CURRENT" != "$NODE_VERSION" ]]; then
        log_warning "Node.js versão $NODE_CURRENT encontrado, atualizando para $NODE_VERSION..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
        log_success "Node.js atualizado: $(node --version)"
    else
        log_success "Node.js já está instalado: $(node --version)"
    fi
fi

# Passo 2: Verificar PM2
log_step "Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    log_info "PM2 não encontrado. Instalando..."
    npm install -g pm2
    pm2 startup
    pm2 save
    log_success "PM2 instalado"
else
    log_success "PM2 já está instalado: $(pm2 --version)"
fi

# Passo 3: Verificar e instalar dependências
log_step "Instalando dependências do projeto..."
if [[ ! -f "package.json" ]]; then
    log_error "package.json não encontrado. Execute este script no diretório do projeto."
    exit 1
fi

npm install
log_success "Dependências instaladas"

# Passo 4: Configurar variáveis de ambiente
log_step "Configurando variáveis de ambiente..."
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        log_info "Arquivo .env criado a partir de .env.example"
    else
        log_info "Criando arquivo .env..."
        cat > .env << EOF
# Database
DATABASE_URL="postgresql://barca_user:$(openssl rand -base64 12)@localhost:5432/barca_coletiva"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:$PORT"

# JWT
JWT_SECRET="$(openssl rand -base64 32)"

# Encryption
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Socket.IO
SOCKET_IO_CORS_ORIGIN="http://localhost:$PORT"

# Z-AI SDK
ZAI_API_KEY="your-z-ai-api-key"

# Node Environment
NODE_ENV=production
PORT=$PORT
EOF
        log_success "Arquivo .env criado com chaves aleatórias"
    fi
else
    log_success "Arquivo .env já existe"
fi

# Passo 5: Build do projeto
log_step "Buildando o projeto..."
npm run build
log_success "Projeto buildado com sucesso"

# Passo 6: Verificar e criar arquivo de configuração PM2
log_step "Configurando PM2..."
if [[ ! -f "ecosystem.config.js" ]]; then
    log_info "Criando arquivo ecosystem.config.js..."
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: '/var/log/pm2/$PROJECT_NAME-error.log',
    out_file: '/var/log/pm2/$PROJECT_NAME-out.log',
    log_file: '/var/log/pm2/$PROJECT_NAME-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    merge_logs: true,
    source_map_support: true,
    node_args: '--max-old-space-size=1024'
  }]
};
EOF
    log_success "Arquivo ecosystem.config.js criado"
else
    log_success "Arquivo ecosystem.config.js já existe"
fi

# Passo 7: Iniciar aplicação
log_step "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js
pm2 save
log_success "Aplicação iniciada"

# Passo 8: Verificar status
log_step "Verificando status da aplicação..."
sleep 3
if pm2 info $PROJECT_NAME > /dev/null 2>&1; then
    log_success "Aplicação está rodando!"
    pm2 status $PROJECT_NAME
else
    log_error "Falha ao iniciar aplicação"
    pm2 logs $PROJECT_NAME
    exit 1
fi

# Passo 9: Criar scripts úteis
log_step "Criando scripts de gerenciamento..."
cat > start.sh << EOF
#!/bin/bash
echo "🚤 Iniciando Barca Coletiva..."
pm2 start $PROJECT_NAME
pm2 save
echo "✅ Aplicação iniciada!"
EOF

cat > stop.sh << EOF
#!/bin/bash
echo "🛑 Parando Barca Coletiva..."
pm2 stop $PROJECT_NAME
echo "✅ Aplicação parada!"
EOF

cat > restart.sh << EOF
#!/bin/bash
echo "🔄 Reiniciando Barca Coletiva..."
pm2 restart $PROJECT_NAME
echo "✅ Aplicação reiniciada!"
EOF

cat > logs.sh << EOF
#!/bin/bash
echo "📋 Logs da Barca Coletiva..."
pm2 logs $PROJECT_NAME
EOF

cat > status.sh << EOF
#!/bin/bash
echo "📊 Status da Barca Coletiva..."
pm2 status $PROJECT_NAME
EOF

chmod +x *.sh
log_success "Scripts de gerenciamento criados"

# Passo 10: Mostrar informações finais
echo
echo "████████████████████████████████████████████████████████"
echo "█                                                      █"
echo "█              🎉 INSTALAÇÃO CONCLUÍDA!               █"
echo "█                                                      █"
echo "████████████████████████████████████████████████████████"
echo
echo -e "${GREEN}🌐 URL da Aplicação:${NC} http://localhost:$PORT"
echo -e "${GREEN}👤 Usuário Admin:${NC} admin/@Wad235rt"
echo -e "${GREEN}📂 Diretório:${NC} $PROJECT_DIR"
echo
echo -e "${CYAN}🔧 Comandos Úteis:${NC}"
echo "  ./start.sh     - Iniciar aplicação"
echo "  ./stop.sh      - Parar aplicação"
echo "  ./restart.sh   - Reiniciar aplicação"
echo "  ./logs.sh      - Ver logs"
echo "  ./status.sh    - Ver status"
echo "  pm2 monit      - Monitoramento em tempo real"
echo
echo -e "${YELLOW}📋 Para Easy Panel:${NC}"
echo "  - Build Command: npm run build"
echo "  - Start Command: npm start"
echo "  - Port: $PORT"
echo "  - Environment: NODE_ENV=production"
echo
echo -e "${PURPLE}🚀 Sua Barca Coletiva está no ar! Aproveite!${NC}"
echo "████████████████████████████████████████████████████████"

# Mostrar status final
pm2 status $PROJECT_NAME