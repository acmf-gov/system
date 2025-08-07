# 🚤 Guia de Instalação na Hostinger VPS

## 📋 Pré-requisitos

- VPS na Hostinger com Ubuntu 22.04 ou superior
- Acesso root ou sudo ao servidor
- Domínio apontado para o IP da VPS
- Conhecimento básico de linha de comando

---

## 🔧 Passo 1: Acessar sua VPS

### 1.1 Conectar via SSH
```bash
ssh root@SEU_IP_VPS
```

### 1.2 Atualizar o sistema
```bash
apt update && apt upgrade -y
```

### 1.3 Instalar ferramentas essenciais
```bash
apt install -y curl wget git nano ufw
```

---

## 🔒 Passo 2: Configurar Segurança

### 2.1 Configurar Firewall
```bash
# Permitir SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Para desenvolvimento (opcional)

# Habilitar firewall
ufw enable
```

### 2.2 Criar usuário para deploy (recomendado)
```bash
adduser deploy
usermod -aG sudo deploy
```

### 2.3 Configurar SSH sem senha (opcional)
```bash
# Na sua máquina local
ssh-copy-id deploy@SEU_IP_VPS
```

---

## 📦 Passo 3: Instalar Node.js e NPM

### 3.1 Instalar Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

### 3.2 Verificar instalação
```bash
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x
```

---

## 🗄️ Passo 4: Instalar Banco de Dados

### 4.1 Instalar PostgreSQL (recomendado para produção)
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 4.2 Configurar PostgreSQL
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco de dados e usuário
CREATE DATABASE barca_coletiva;
CREATE USER barca_user WITH PASSWORD 'sua_senha_forte';
GRANT ALL PRIVILEGES ON DATABASE barca_coletiva TO barca_user;
ALTER USER barca_user CREATEDB;

# Sair do PostgreSQL
\q
```

### 4.3 Configurar acesso remoto (opcional)
```bash
nano /etc/postgresql/14/main/postgresql.conf
```
Descomente e altere:
```
listen_addresses = '*'
```

```bash
nano /etc/postgresql/14/main/pg_hba.conf
```
Adicione no final:
```
host    all             all             0.0.0.0/0               md5
```

```bash
systemctl restart postgresql
```

---

## 🚀 Passo 5: Instalar PM2 (Process Manager)

### 5.1 Instalar PM2 globalmente
```bash
npm install -g pm2
```

### 5.2 Configurar PM2 para iniciar com o sistema
```bash
pm2 startup
pm2 save
```

---

## 📂 Passo 6: Clonar e Configurar o Projeto

### 6.1 Clonar o repositório
```bash
cd /var/www
git clone SEU_REPOSITORIO_GIT barca-coletiva
cd barca-coletiva
chown -R deploy:deploy .
```

### 6.2 Instalar dependências
```bash
npm install
```

### 6.3 Configurar variáveis de ambiente
```bash
nano .env
```

Adicione as seguintes variáveis:
```env
# Database
DATABASE_URL="postgresql://barca_user:sua_senha_forte@localhost:5432/barca_coletiva"

# NextAuth
NEXTAUTH_SECRET="sua_chave_secreta_aleatoria"
NEXTAUTH_URL="https://seu-dominio.com"

# JWT
JWT_SECRET="sua_chave_jwt_aleatoria"

# Encryption
ENCRYPTION_KEY="sua_chave_de_encriptacao_32bytes"

# Socket.IO
SOCKET_IO_CORS_ORIGIN="https://seu-dominio.com"

# Z-AI SDK
ZAI_API_KEY="sua_chave_z_ai_api"
```

### 6.4 Gerar chaves aleatórias
```bash
# Gerar NEXTAUTH_SECRET
openssl rand -base64 32

# Gerar JWT_SECRET
openssl rand -base64 32

# Gerar ENCRYPTION_KEY (32 bytes)
openssl rand -hex 32
```

---

## 🔧 Passo 7: Configurar Banco de Dados

### 7.1 Instalar Prisma CLI
```bash
npm install -g prisma
```

### 7.2 Gerar Prisma Client
```bash
npx prisma generate
```

### 7.3 Rodar migrações
```bash
npx prisma db push
```

### 7.4 Criar usuário admin
```bash
npx prisma db seed
```

---

## 🏗️ Passo 8: Build do Projeto

### 8.1 Build do Next.js
```bash
npm run build
```

### 8.2 Verificar build
```bash
ls -la .next/
```

---

## 🌐 Passo 9: Configurar Nginx

### 9.1 Instalar Nginx
```bash
apt install -y nginx
```

### 9.2 Configurar site
```bash
nano /etc/nginx/sites-available/barca-coletiva
```

Adicione o seguinte conteúdo:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /_next/static/ {
        alias /var/www/barca-coletiva/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 9.3 Habilitar site
```bash
ln -s /etc/nginx/sites-available/barca-coletiva /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 🔒 Passo 10: Configurar SSL com Let's Encrypt

### 10.1 Instalar Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 10.2 Obter certificado SSL
```bash
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 10.3 Configurar renovação automática
```bash
systemctl status certbot.timer
```

---

## 🚀 Passo 11: Iniciar Aplicação com PM2

### 11.1 Criar arquivo de configuração PM2
```bash
nano ecosystem.config.js
```

Adicione o seguinte conteúdo:
```javascript
module.exports = {
  apps: [{
    name: 'barca-coletiva',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/barca-coletiva',
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
```

### 11.2 Iniciar aplicação
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 11.3 Verificar status
```bash
pm2 status
pm2 logs barca-coletiva
```

---

## 📊 Passo 12: Monitoramento e Manutenção

### 12.1 Configurar log rotation
```bash
nano /etc/logrotate.d/pm2-barca-coletiva
```

Adicione:
```
/var/log/pm2/barca-*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
}
```

### 12.2 Monitorar recursos
```bash
# Verificar uso de memória
free -h

# Verificar uso de disco
df -h

# Verificar processos em execução
htop
```

### 12.3 Backup automático
```bash
# Criar script de backup
nano /var/www/barca-coletiva/backup.sh
```

Adicione:
```bash
#!/bin/bash

# Variáveis
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="barca_coletiva"
DB_USER="barca_user"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/barca-coletiva

# Manter apenas os últimos 7 dias de backup
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído em $DATE"
```

```bash
chmod +x /var/www/barca-coletiva/backup.sh

# Adicionar ao crontab
crontab -e
```

Adicione:
```
0 2 * * * /var/www/barca-coletiva/backup.sh
```

---

## 🔧 Passo 13: Comandos Úteis

### 13.1 Gerenciar aplicação
```bash
# Iniciar aplicação
pm2 start barca-coletiva

# Parar aplicação
pm2 stop barca-coletiva

# Reiniciar aplicação
pm2 restart barca-coletiva

# Remover aplicação
pm2 delete barca-coletiva

# Verificar logs
pm2 logs barca-coletiva

# Monitorar em tempo real
pm2 monit
```

### 13.2 Gerenciar banco de dados
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Fazer backup manual
pg_dump -U barca_user -h localhost barca_coletiva > backup.sql

# Restaurar backup
psql -U barca_user -h localhost barca_coletiva < backup.sql
```

### 13.3 Gerenciar Nginx
```bash
# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# Verificar status
systemctl status nginx
```

---

## 🚨 Passo 14: Solução de Problemas

### 14.1 Verificar logs
```bash
# Logs da aplicação
pm2 logs barca-coletiva

# Logs do Nginx
tail -f /var/log/nginx/error.log

# Logs do sistema
journalctl -u nginx -f
```

### 14.2 Verificar portas
```bash
# Verificar portas em uso
netstat -tulpn

# Verificar se a porta 3000 está ativa
ss -tulpn | grep :3000
```

### 14.3 Reiniciar serviços
```bash
# Reiniciar PM2
pm2 restart all

# Reiniciar Nginx
systemctl restart nginx

# Reiniciar PostgreSQL
systemctl restart postgresql
```

---

## 🎉 Passo 15: Acesso Final

### 15.1 Acessar a aplicação
- URL: https://seu-dominio.com
- Admin: admin/@Wad235rt

### 15.2 Verificar tudo funcionando
- [x] Página de login carrega
- [x] Registro de novos usuários funciona
- [x] Login do admin funciona
- [x] Dashboard carrega corretamente
- [x] Chat em tempo real funciona
- [x] Mapas de entrega funcionam
- [x] Relatórios geram corretamente
- [x] Sistema de indicações funciona

---

## 📞 Suporte

Caso tenha problemas durante a instalação, verifique:
1. Todos os passos foram seguidos na ordem correta
2. As variáveis de ambiente estão configuradas corretamente
3. O firewall está permitindo as portas necessárias
4. O domínio está apontado corretamente para o IP da VPS

Para suporte adicional, consulte os logs específicos de cada serviço.