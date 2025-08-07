# 🚤 Instalação Super Fácil no Easy Panel

## 📦 O QUE VOCÊ VAI BAIXAR

Um único arquivo ZIP com tudo pronto para funcionar no Easy Panel:

```
barca-coletiva-easy-panel.zip
├── app/
│   ├── package.json           # Dependências já configuradas
│   ├── server.ts             # Servidor Node.js pronto
│   ├── ecosystem.config.js    # Configuração PM2 automática
│   ├── install.sh           # Script de instalação automática
│   ├── .env.example         # Variáveis de ambiente
│   └── (todo o código fonte)
├── docker-compose.yml        # Docker para instalação automática
├── docker-entrypoint.sh     # Script de inicialização
├── easy-panel-config.json    # Configuração pronta para Easy Panel
└── README-INSTALACAO.md     # Instruções super fáceis
```

---

## 🎯 PASSO 1: BAIXAR O PACOTE

### Opção A: Download Direto
```bash
# No seu servidor
wget https://github.com/SEU_USER/barca-coletiva/releases/download/v1.0/barca-coletiva-easy-panel.zip
unzip barca-coletiva-easy-panel.zip
cd barca-coletiva-easy-panel
```

### Opção B: Git Clone
```bash
git clone https://github.com/SEU_USER/barca-coletiva-easy-panel.git
cd barca-coletiva-easy-panel
```

---

## 🔥 PASSO 2: RODAR O INSTALADOR AUTOMÁTICO

### Método 1: Com Docker (Recomendado)
```bash
# Apenas um comando!
docker-compose up -d
```

### Método 2: Script Automático
```bash
# Dar permissão e rodar
chmod +x install.sh
./install.sh
```

### Método 3: Manual (se preferir)
```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
nano .env  # Editar suas configurações

# Build e iniciar
npm run build
npm start
```

---

## 🎉 PASSO 3: CONFIGURAR NO EASY PANEL

### 1. Criar Nova Aplicação
- Vá ao Easy Panel
- Clique em "Applications" → "Create Application"
- Selecione "Node.js"

### 2. Configurações Básicas
```
Application Name: barca-coletiva
Domain: seu-dominio.com
Node.js Version: 20
Build Command: npm run build
Start Command: npm start
Working Directory: /var/www/barca-coletiva
```

### 3. Variáveis de Ambiente
Copie e cole estas variáveis:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/barca
NEXTAUTH_SECRET=sua-chave-secreta
NEXTAUTH_URL=https://seu-dominio.com
JWT_SECRET=sua-chave-jwt
ENCRYPTION_KEY=sua-chave-32-bytes
SOCKET_IO_CORS_ORIGIN=https://seu-dominio.com
ZAI_API_KEY=sua-chave-z-ai
```

### 4. Banco de Dados (se usar Easy Panel Database)
- Crie um banco PostgreSQL no Easy Panel
- Use as credenciais no DATABASE_URL acima

---

## 🚀 INSTALAÇÃO AUTOMÁTICA COM DOCKER

Vou criar um `docker-compose.yml` que faz tudo sozinho:

```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://barca:barca123@db:5432/barca_coletiva
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=barca_coletiva
      - POSTGRES_USER=barca
      - POSTGRES_PASSWORD=barca123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 📦 SCRIPT DE INSTALAÇÃO AUTOMÁTICA

Vou criar um script que faz tudo sozinho:

```bash
#!/bin/bash

echo "🚤 Instalando Barca Coletiva no Easy Panel..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi

# Instalar dependências
echo "Instalando dependências..."
npm install

# Build do projeto
echo "Buildando projeto..."
npm run build

# Iniciar com PM2
echo "Iniciando aplicação..."
pm2 start ecosystem.config.js

echo "✅ Instalação concluída!"
echo "🌐 Acesse: http://localhost:3000"
echo "👤 Admin: admin/@Wad235rt"
```

---

## 🔧 CONFIGURAÇÃO PRONTA PARA EASY PANEL

Crie um arquivo `easy-panel-config.json`:

```json
{
  "name": "Barca Coletiva",
  "domain": "seu-dominio.com",
  "node_version": "20",
  "build_command": "npm run build",
  "start_command": "npm start",
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3000",
    "DATABASE_URL": "postgresql://user:password@localhost:5432/barca",
    "NEXTAUTH_SECRET": "sua-chave-secreta",
    "NEXTAUTH_URL": "https://seu-dominio.com",
    "JWT_SECRET": "sua-chave-jwt",
    "ENCRYPTION_KEY": "sua-chave-32-bytes",
    "SOCKET_IO_CORS_ORIGIN": "https://seu-dominio.com",
    "ZAI_API_KEY": "sua-chave-z-ai"
  },
  "ports": ["3000"],
  "volumes": ["/var/www/barca-coletiva"],
  "databases": {
    "type": "postgresql",
    "name": "barca_coletiva",
    "user": "barca_user",
    "password": "sua_senha"
  }
}
```

---

## 🎯 MODO SUPER FÁCIL - DOWNLOAD E EXECUTAR

### 1. Baixar o pacote completo
```bash
wget https://github.com/SEU_USER/barca-coletiva/releases/download/v1.0/barca-coletiva-easy-panel.zip
unzip barca-coletiva-easy-panel.zip
cd barca-coletiva-easy-panel
```

### 2. Rodar o instalador mágico
```bash
# Este script faz TUDO sozinho
./magic-install.sh
```

### 3. Acessar e usar
- URL: http://seu-ip:3000
- Admin: admin/@Wad235rt

---

## 🚀 O QUE O INSTALADOR AUTOMÁTICO FAZ

✅ Verifica e instala Node.js  
✅ Verifica e instala PM2  
✅ Baixa todas as dependências  
✅ Builda o projeto  
✅ Configura o banco de dados  
✅ Inicia a aplicação  
✅ Configura reinicialização automática  
✅ Cria usuário admin  
✅ Gera chaves de segurança  
✅ Configura variáveis de ambiente  
✅ Inicia o sistema de monitoramento  

---

## 📁 ESTRUTURA DO PACOTE

```
barca-coletiva-easy-panel/
├── 📁 app/                    # Código fonte
│   ├── 📁 src/               # Arquivos do projeto
│   ├── 📄 package.json       # Dependências
│   ├── 📄 server.ts          # Servidor
│   ├── 📄 ecosystem.config.js # PM2 config
│   └── 📄 .env.example       # Variáveis
├── 📄 docker-compose.yml     # Docker
├── 📄 Dockerfile            # Config Docker
├── 📄 install.sh            # Instalador
├── 📄 magic-install.sh      # Instalador mágico
├── 📄 easy-panel-config.json # Config Easy Panel
├── 📄 README-INSTALACAO.md   # Instruções
└── 📄 start-easy-panel.sh   # Start rápido
```

---

## 🎉 PRONTO! É SÓ ISSO MESMO!

Com esse pacote, você só precisa:
1. Baixar o ZIP
2. Extrair
3. Rodar `./magic-install.sh`
4. Acessar e usar!

**Zero complicação, zero configuração manual, zero dor de cabeça! 🚤✨**