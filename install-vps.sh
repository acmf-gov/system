#!/bin/bash

# Script de instalação automática para Hostinger VPS
# Uso: ./install-vps.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   log_error "Este script precisa ser executado como root"
   exit 1
fi

# Configurações
DOMAIN=""
DB_PASSWORD=""
PROJECT_PATH="/var/www/barca-coletiva"
DB_NAME="barca_coletiva"
DB_USER="barca_user"

# Função para solicitar informações
get_input() {
    local prompt="$1"
    local variable="$2"
    local default="$3"
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " input
        input="${input:-$default}"
    else
        read -p "$prompt: " input
    fi
    
    eval "$variable=\"$input\""
}

# Banner
echo "=========================================="
echo "  🚤 Instalação Automática - Barca Coletiva"
echo "=========================================="
echo

# Solicitar informações
get_input "Digite o domínio (ex: exemplo.com)" DOMAIN
get_input "Digite a senha do banco de dados" DB_PASSWORD "$(openssl rand -base64 12)"
get_input "Digite o caminho do projeto" PROJECT_PATH "/var/www/barca-coletiva"

log_info "Iniciando instalação com as seguintes configurações:"
echo "  Domínio: $DOMAIN"
echo "  Caminho do projeto: $PROJECT_PATH"
echo "  Banco de dados: $DB_NAME"
echo "  Usuário do banco: $DB_USER"
echo

# Aguardar confirmação
read -p "Continuar com a instalação? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Instalação cancelada"
    exit 1
fi

# Passo 1: Atualizar sistema
log_info "Atualizando sistema..."
apt update && apt upgrade -y
log_success "Sistema atualizado"

# Passo 2: Instalar ferramentas essenciais
log_info "Instalando ferramentas essenciais..."
apt install -y curl wget git nano ufw
log_success "Ferramentas essenciais instaladas"

# Passo 3: Configurar firewall
log_info "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log_success "Firewall configurado"

# Passo 4: Instalar Node.js
log_info "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
log_success "Node.js instalado: $(node --version)"

# Passo 5: Instalar PostgreSQL
log_info "Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Configurar PostgreSQL
log_info "Configurando PostgreSQL..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF
log_success "PostgreSQL configurado"

# Passo 6: Instalar PM2
log_info "Instalando PM2..."
npm install -g pm2
pm2 startup
pm2 save
log_success "PM2 instalado"

# Passo 7: Instalar Nginx
log_info "Instalando Nginx..."
apt install -y nginx
log_success "Nginx instalado"

# Passo 8: Clonar projeto
log_info "Clonando projeto..."
mkdir -p $(dirname "$PROJECT_PATH")
git clone https://github.com/seu-usuario/barca-coletiva.git "$PROJECT_PATH" 2>/dev/null || {
    log_warning "Repositório não encontrado, criando diretório vazio"
    mkdir -p "$PROJECT_PATH"
}
cd "$PROJECT_PATH"
chown -R $USER:$USER .
log_success "Projeto clonado/criado"

# Passo 9: Instalar dependências
log_info "Instalando dependências do projeto..."
npm install
log_success "Dependências instaladas"

# Passo 10: Configurar variáveis de ambiente
log_info "Configurando variáveis de ambiente..."
cat > .env << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://$DOMAIN"

# JWT
JWT_SECRET="$(openssl rand -base64 32)"

# Encryption
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Socket.IO
SOCKET_IO_CORS_ORIGIN="https://$DOMAIN"

# Z-AI SDK
ZAI_API_KEY="your-z-ai-api-key"
EOF
log_success "Variáveis de ambiente configuradas"

# Passo 11: Configurar banco de dados
log_info "Configurando banco de dados..."
npm install -g prisma
npx prisma generate
npx prisma db push
log_success "Banco de dados configurado"

# Passo 12: Build do projeto
log_info "Build do projeto..."
npm run build
log_success "Build concluído"

# Passo 13: Configurar Nginx
log_info "Configurando Nginx..."
cat > /etc/nginx/sites-available/barca-coletiva << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location /_next/static/ {
        alias $PROJECT_PATH/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -s /etc/nginx/sites-available/barca-coletiva /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
log_success "Nginx configurado"

# Passo 14: Instalar SSL
log_info "Instalando SSL com Let's Encrypt..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN -d www.$DOMAIN --email admin@$DOMAIN --non-interactive --agree-tos
log_success "SSL instalado"

# Passo 15: Configurar PM2
log_info "Configurando PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'barca-coletiva',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_PATH',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/barca-error.log',
    out_file: '/var/log/pm2/barca-out.log',
    log_file: '/var/log/pm2/barca-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save
log_success "PM2 configurado"

# Passo 16: Configurar backup
log_info "Configurando backup automático..."
mkdir -p /backups
cat > backup.sh << EOF
#!/bin/bash

BACKUP_DIR="/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup do banco de dados
pg_dump -U $DB_USER -h localhost $DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup dos arquivos
tar -czf \$BACKUP_DIR/files_backup_\$DATE.tar.gz $PROJECT_PATH

# Manter apenas os últimos 7 dias
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído em \$DATE"
EOF

chmod +x backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_PATH/backup.sh") | crontab -
log_success "Backup configurado"

# Passo 17: Finalizar
log_info "Reiniciando serviços..."
systemctl restart nginx
pm2 restart barca-coletiva

log_success "Instalação concluída!"
echo
echo "=========================================="
echo "  🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=========================================="
echo
echo "📋 Informações importantes:"
echo "  🌐 URL: https://$DOMAIN"
echo "  👤 Admin: admin/@Wad235rt"
echo "  🗄️ Banco de dados: $DB_NAME"
echo "  👤 Usuário DB: $DB_USER"
echo "  🔑 Senha DB: $DB_PASSWORD"
echo "  📂 Caminho do projeto: $PROJECT_PATH"
echo
echo "🔧 Comandos úteis:"
echo "  pm2 status           # Verificar status da aplicação"
echo "  pm2 logs barca-coletiva  # Verificar logs"
echo "  systemctl status nginx  # Verificar status do Nginx"
echo "  tail -f /var/log/nginx/error.log  # Logs do Nginx"
echo
echo "🚀 Acesse sua aplicação em: https://$DOMAIN"
echo "=========================================="
