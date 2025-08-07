# 🚤 Instalação Rápida na Hostinger VPS

## 📋 Resumo Rápido

### 1. Acessar sua VPS
```bash
ssh root@SEU_IP_VPS
```

### 2. Atualizar e instalar dependências
```bash
apt update && apt upgrade -y
apt install -y curl wget git nano ufw
```

### 3. Configurar firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 4. Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

### 5. Instalar PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 6. Configurar banco de dados
```bash
sudo -u postgres psql
CREATE DATABASE barca_coletiva;
CREATE USER barca_user WITH PASSWORD 'sua_senha_forte';
GRANT ALL PRIVILEGES ON DATABASE barca_coletiva TO barca_user;
ALTER USER barca_user CREATEDB;
\q
```

### 7. Instalar PM2 e Nginx
```bash
npm install -g pm2
pm2 startup
pm2 save

apt install -y nginx
```

### 8. Clonar projeto
```bash
cd /var/www
git clone SEU_REPOSITORIO_GIT barca-coletiva
cd barca-coletiva
npm install
```

### 9. Configurar ambiente
```bash
nano .env
```
```env
DATABASE_URL="postgresql://barca_user:sua_senha_forte@localhost:5432/barca_coletiva"
NEXTAUTH_SECRET="sua_chave_secreta_aleatoria"
NEXTAUTH_URL="https://seu-dominio.com"
JWT_SECRET="sua_chave_jwt_aleatoria"
ENCRYPTION_KEY="sua_chave_de_encriptacao_32bytes"
SOCKET_IO_CORS_ORIGIN="https://seu-dominio.com"
ZAI_API_KEY="sua_chave_z_ai_api"
```

### 10. Configurar banco de dados
```bash
npm install -g prisma
npx prisma generate
npx prisma db push
```

### 11. Build do projeto
```bash
npm run build
```

### 12. Configurar Nginx
```bash
nano /etc/nginx/sites-available/barca-coletiva
```
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;
    
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
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
    
    location /_next/static/ {
        alias /var/www/barca-coletiva/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
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

```bash
ln -s /etc/nginx/sites-available/barca-coletiva /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 13. Instalar SSL
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 14. Iniciar aplicação
```bash
pm2 start npm --name "barca-coletiva" -- start
pm2 save
```

### 15. Acessar
- URL: https://seu-dominio.com
- Admin: admin/@Wad235rt

## 🚀 Comandos Úteis

```bash
# Verificar status
pm2 status
pm2 logs barca-coletiva

# Reiniciar aplicação
pm2 restart barca-coletiva

# Reiniciar Nginx
systemctl restart nginx

# Verificar logs
tail -f /var/log/nginx/error.log
```

## 🎯 Pronto!

Sua aplicação Barca Coletiva está agora instalada e rodando na sua VPS Hostinger!