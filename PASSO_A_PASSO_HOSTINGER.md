# 🚤 PASSO A PASSO - Instalação na Hostinger VPS

## 📋 O QUE VOCÊ PRECISA

1. **VPS na Hostinger** com Ubuntu 22.04+
2. **Acesso root** ao servidor
3. **Domínio** apontado para o IP da VPS
4. **Paciência** - cerca de 30 minutos

---

## 🔥 PASSO A PASSO RÁPIDO (COPIAR E COLAR)

### 1. Acessar sua VPS
```bash
ssh root@SEU_IP_VPS
```

### 2. Preparar o servidor
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar ferramentas básicas
apt install -y curl wget git nano ufw

# Configurar firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 3. Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
node --version  # Deve mostrar v20.x.x
```

### 4. Instalar PostgreSQL
```bash
# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Configurar banco de dados
sudo -u postgres psql
```
```sql
CREATE DATABASE barca_coletiva;
CREATE USER barca_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE barca_coletiva TO barca_user;
ALTER USER barca_user CREATEDB;
\q
```

### 5. Instalar PM2 e Nginx
```bash
# Instalar PM2
npm install -g pm2
pm2 startup
pm2 save

# Instalar Nginx
apt install -y nginx
```

### 6. Baixar o projeto
```bash
cd /var/www
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git barca-coletiva
cd barca-coletiva
npm install
```

### 7. Configurar ambiente
```bash
# Criar arquivo .env
nano .env
```
```env
DATABASE_URL="postgresql://barca_user:sua_senha_aqui@localhost:5432/barca_coletiva"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://seu-dominio.com"
JWT_SECRET="$(openssl rand -base64 32)"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
SOCKET_IO_CORS_ORIGIN="https://seu-dominio.com"
ZAI_API_KEY="sua-chave-z-ai-api"
```

### 8. Configurar banco de dados
```bash
# Instalar Prisma
npm install -g prisma

# Gerar cliente e configurar banco
npx prisma generate
npx prisma db push
```

### 9. Build do projeto
```bash
npm run build
```

### 10. Configurar Nginx
```bash
# Criar configuração do site
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
# Habilitar site
ln -s /etc/nginx/sites-available/barca-coletiva /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 11. Instalar SSL
```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 12. Iniciar aplicação
```bash
# Iniciar com PM2
pm2 start npm --name "barca-coletiva" -- start
pm2 save

# Verificar status
pm2 status
```

---

## 🎉 PRONTO! SEU SISTEMA ESTÁ NO AR

### Acessar sua aplicação:
- **URL**: https://seu-dominio.com
- **Admin**: admin/@Wad235rt

### Comandos úteis:
```bash
# Verificar status da aplicação
pm2 status

# Verificar logs
pm2 logs barca-coletiva

# Reiniciar aplicação
pm2 restart barca-coletiva

# Reiniciar Nginx
systemctl restart nginx

# Verificar logs do Nginx
tail -f /var/log/nginx/error.log
```

---

## 🔧 SOLUÇÃO DE PROBLEMAS

### Se a aplicação não iniciar:
```bash
# Verificar logs de erro
pm2 logs barca-coletiva

# Verificar se a porta 3000 está livre
netstat -tulpn | grep :3000

# Verificar variáveis de ambiente
cat .env
```

### Se o SSL não funcionar:
```bash
# Verificar status do certificado
certbot certificates

# Renovar certificado
certbot renew --dry-run
```

### Se o banco de dados não conectar:
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
psql -U barca_user -h localhost -d barca_coletiva
```

---

## 📁 ARQUIVOS CRIADOS

1. **HOSTINGER_VPS_INSTALL.md** - Guia completo detalhado
2. **INSTALL_VPS_QUICK.md** - Guia rápido
3. **install-vps.sh** - Script de instalação automática
4. **ecosystem.config.js** - Configuração do PM2
5. **backup.sh** - Script de backup automático
6. **PASSO_A_PASSO_HOSTINGER.md** - Este arquivo

---

## 🚀 DICAS FINAIS

1. **Backup**: Faça backup regularmente usando o script `backup.sh`
2. **Monitoramento**: Use `pm2 monit` para monitorar em tempo real
3. **Atualizações**: Mantenha o sistema atualizado com `apt update && apt upgrade`
4. **Segurança**: Mantenha o firewall sempre ativo
5. **Performance**: Monitore o uso de memória e CPU com `htop`

**Parabéns! Seu sistema Barca Coletiva está agora no ar na sua VPS Hostinger! 🚤🎉**