# Guia de Implantação - Barca Coletiva

## Visão Geral

Este guia cobre a implantação completa do sistema Barca Coletiva na Hostinger usando diferentes métodos: painel de controle, aplicativo e terminal via SSH.

## Pré-requisitos

- Conta na Hostinger com acesso a:
  - Painel de controle (hPanel)
  - Acesso SSH
  - Banco de dados MySQL ou SQLite
  - Node.js (versão 18+)
- Domínio configurado
- Certificado SSL (disponível gratuitamente na Hostinger)

## Método 1: Usando o Painel de Controle (hPanel)

### 1. Preparar o Projeto

```bash
# No seu computador local
npm run build
```

### 2. Fazer Upload dos Arquivos

1. Acesse o hPanel da Hostinger
2. Vá para "Gerenciador de Arquivos" → "Public_HTML"
3. Crie uma nova pasta para seu projeto (ex: `barca-app`)
4. Faça upload dos seguintes arquivos e pastas:
   - `package.json`
   - `package-lock.json`
   - `.next/` (pasta gerada pelo build)
   - `public/`
   - `prisma/`
   - `db/` (se usando SQLite)
   - `server.ts`
   - `.env.production`

### 3. Configurar Variáveis de Ambiente

Crie o arquivo `.env.production` com:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
NEXTAUTH_SECRET="sua-chave-secreta-do-nextauth"

# Encryption
ENCRYPTION_KEY="sua-chave-de-criptografia-de-256-bits"

# App URLs
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
NEXT_PUBLIC_SOCKET_URL="https://seu-dominio.com"

# Node Environment
NODE_ENV="production"
```

### 4. Configurar o Banco de Dados

#### Opção A: SQLite (Recomendado para começar)

1. No Gerenciador de Arquivos, crie a pasta `db`
2. Faça upload do arquivo `custom.db` ou crie um novo

#### Opção B: MySQL

1. No hPanel, vá para "Bancos de Dados" → "MySQL Database"
2. Crie um novo banco de dados
3. Atualize o `.env.production`:
```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
```

### 5. Instalar Dependências

1. No hPanel, vá para "Terminal" ou "SSH"
2. Navegue até a pasta do projeto:
```bash
cd public_html/barca-app
```

3. Instale as dependências:
```bash
npm install --production
```

### 6. Configurar o Prisma

```bash
npx prisma generate
npx prisma db push
```

### 7. Configurar o Servidor

Crie um arquivo `start.sh`:

```bash
#!/bin/bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm start
```

Dê permissão de execução:
```bash
chmod +x start.sh
```

### 8. Configurar o Cron Job (para reinicialização automática)

1. No hPanel, vá para "Cron Jobs"
2. Adicione um novo cron job:
```bash
* * * * * cd /home/seu-usuario/public_html/barca-app && pgrep -f "node server.ts" > /dev/null || npm start
```

## Método 2: Usando o Aplicativo Hostinger

### 1. Preparar o Repositório

```bash
# No seu computador local
git init
git add .
git commit -m "Initial commit"
```

### 2. Configurar o Git na Hostinger

1. No hPanel, vá para "Git" → "Create New Repository"
2. Siga as instruções para configurar o repositório remoto

### 3. Enviar o Código

```bash
git remote add hostinger ssh://usuario@servidor:/home/usuario/repositorio.git
git push hostinger main
```

### 4. Configurar o Build Automático

1. No painel Git, configure o script de build:
```bash
npm install
npm run build
npx prisma generate
npx prisma db push
```

## Método 3: Usando Terminal/SSH

### 1. Conectar via SSH

```bash
ssh usuario@seu-servidor.com
```

### 2. Preparar o Ambiente

```bash
# Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 (Process Manager)
sudo npm install -g pm2
```

### 3. Clonar ou Fazer Upload do Projeto

#### Opção A: Clonar do Git

```bash
cd /home/seu-usuario
git clone https://github.com/seu-usuario/barca-coletiva.git
cd barca-coletiva
```

#### Opção B: Upload Manual

1. Use SCP ou SFTP para enviar os arquivos:
```bash
scp -r /caminho/local/projeto usuario@servidor:/home/seu-usuario/barca-coletiva
```

### 4. Configurar o Projeto

```bash
cd /home/seu-usuario/barca-coletiva

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.production
# Edite o .env.production com suas configurações

# Gerar Prisma Client
npx prisma generate

# Push do schema do banco
npx prisma db push

# Build do projeto
npm run build
```

### 5. Configurar PM2

Crie o arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'barca-coletiva',
    script: 'server.ts',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
```

Inicie a aplicação:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6. Configurar Nginx (Proxy Reverso)

Crie o arquivo de configuração:
```bash
sudo nano /etc/nginx/sites-available/barca-coletiva
```

Adicione o conteúdo:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
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
}
```

Habilite o site:
```bash
sudo ln -s /etc/nginx/sites-available/barca-coletiva /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Configurar SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## Configurações Adicionais

### Configurar o Socket.IO para Produção

No arquivo `server.ts`, adicione:

```typescript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://seu-dominio.com'] 
      : ['http://localhost:3000'],
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
})
```

### Backup Automático

Crie um script de backup `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/seu-usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/seu-usuario/barca-coletiva"

mkdir -p $BACKUP_DIR

# Backup do banco de dados
if [ -f "$APP_DIR/db/custom.db" ]; then
    cp "$APP_DIR/db/custom.db" "$BACKUP_DIR/custom_db_$DATE.db"
fi

# Backup dos arquivos
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" -C /home/seu-usuario barca-coletiva

# Manter apenas os últimos 7 dias de backup
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

Adicione ao crontab:
```bash
0 2 * * * /home/seu-usuario/backup.sh
```

### Monitoramento e Logs

Configure o logrotate para gerenciar os logs:
```bash
sudo nano /etc/logrotate.d/barca-coletiva
```

Adicione:
```
/home/seu-usuario/.pm2/logs/barca-coletiva-*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 seu-usuario seu-usuario
}
```

## Testes Pós-Implantação

### 1. Verificar se a Aplicação Está Rodando

```bash
pm2 status
pm2 logs barca-coletiva
```

### 2. Testar Funcionalidades

- [ ] Acessar o site: `https://seu-dominio.com`
- [ ] Fazer login como admin: `admin` / `@Wad235rt`
- [ ] Criar um novo usuário
- [ ] Testar o sistema de indicações
- [ ] Criar uma barca
- [ ] Testar o chat em tempo real
- [ ] Verificar o mapa de entregas
- [ ] Acessar os relatórios

### 3. Verificar Conexões

```bash
# Verificar se o Node.js está rodando na porta 3000
netstat -tlnp | grep :3000

# Verificar se o Nginx está rodando
sudo systemctl status nginx

# Verificar se o SSL está funcionando
openssl s_client -connect seu-dominio.com:443 -servername seu-dominio.com
```

## Solução de Problemas Comuns

### 1. Aplicação Não Inicia

```bash
# Verificar logs
pm2 logs barca-coletiva

# Reiniciar a aplicação
pm2 restart barca-coletiva

# Verificar variáveis de ambiente
pm2 env barca-coletiva
```

### 2. Erros de Banco de Dados

```bash
# Regenerar Prisma Client
npx prisma generate

# Verificar conexão com o banco
npx prisma db push
```

### 3. Problemas com Socket.IO

Verifique se o proxy reverso está configurado corretamente para WebSockets:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

### 4. Erros de Permissão

```bash
# Verificar permissões dos arquivos
ls -la /home/seu-usuario/barca-coletiva

# Corrigir permissões
chmod -R 755 /home/seu-usuario/barca-coletiva
chown -R seu-usuario:seu-usuario /home/seu-usuario/barca-coletiva
```

## Manutenção Contínua

### Atualizações

```bash
# Fazer pull das atualizações
git pull origin main

# Instalar novas dependências
npm install

# Rebuild do projeto
npm run build

# Reiniciar a aplicação
pm2 restart barca-coletiva
```

### Monitoramento

```bash
# Verificar uso de recursos
pm2 monit

# Verificar logs em tempo real
pm2 logs barca-coletiva --lines 100
```

### Backup e Restauração

```bash
# Backup manual
./backup.sh

# Restaurar banco de dados
cp /home/seu-usuario/backups/custom_db_YYYYMMDD_HHMMSS.db /home/seu-usuario/barca-coletiva/db/custom.db
```

## Contato e Suporte

Em caso de problemas, verifique:
1. Os logs da aplicação (`pm2 logs`)
2. Os logs do Nginx (`sudo tail -f /var/log/nginx/error.log`)
3. A documentação oficial do Next.js e Prisma
4. O suporte da Hostinger

---

**Nota:** Este guia assume que você tem acesso root ou sudo ao servidor. Em ambientes compartilhados da Hostinger, algumas etapas podem precisar de adaptação.