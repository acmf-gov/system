# 🚤 INSTALAÇÃO SUPER FÁCIL - Barca Coletiva

## 🎯 O QUE VOCÊ PRECISA

- **Um servidor** (Easy Panel, VPS, ou até sua máquina local)
- **Docker** (opcional, mas recomendado)
- **5 minutos** do seu tempo

---

## 🔥 MÉTODO 1: DOCKER (RECOMENDADO) - 1 COMANDO!

### Passo 1: Baixar o projeto
```bash
git clone https://github.com/SEU_USER/barca-coletiva.git
cd barca-coletiva
```

### Passo 2: Rodar o instalador mágico
```bash
chmod +x start-easy-panel.sh
./start-easy-panel.sh
```

### Passo 3: Escolher a opção 1 (Docker)
```
1) 🐳 Iniciar com Docker (Recomendado)
```

### Passo 4: Acessar e usar!
- **URL**: http://localhost:3000
- **Admin**: admin/@Wad235rt

**PRONTO! É SÓ ISSO! 🎉**

---

## 🔧 MÉTODO 2: SEM DOCKER - NODE.js LOCAL

### Passo 1: Baixar o projeto
```bash
git clone https://github.com/SEU_USER/barca-coletiva.git
cd barca-coletiva
```

### Passo 2: Rodar o instalador mágico
```bash
chmod +x magic-install.sh
./magic-install.sh
```

### Passo 3: Acessar e usar!
- **URL**: http://localhost:3000
- **Admin**: admin/@Wad235rt

**TAMBÉM PRONTO! 🚀**

---

## 🎨 MÉTODO 3: EASY PANEL DIRETO

### Passo 1: No Easy Panel
1. Clique em "Applications" → "Create Application"
2. Selecione "Node.js"

### Passo 2: Configuração básica
```
Application Name: barca-coletiva
Domain: seu-dominio.com
Node.js Version: 20
Build Command: npm run build
Start Command: npm start
Working Directory: /var/www/barca-coletiva
```

### Passo 3: Variáveis de ambiente
Copie e cole:
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

### Passo 4: Deploy
Clique em "Deploy" e aguarde!

---

## 📦 O QUE O PACOTE JÁ INCLUI

✅ **Tudo pronto para funcionar:**
- 🚀 Servidor Node.js configurado
- 🗄️ Banco de dados PostgreSQL
- 🔐 Sistema de autenticação completo
- 💬 Chat em tempo real com Socket.IO
- 🗺️ Mapas interativos
- 📊 Relatórios e estatísticas
- 👥 Sistema de indicações
- 🔒 Criptografia de dados
- 📱 Interface mobile-friendly
- 🎨 Design moderno e responsivo

---

## 🛠️ COMANDOS ÚTEIS

### Para Docker:
```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Remover tudo
docker-compose down -v
```

### Para Node.js Local:
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart barca-coletiva

# Parar
pm2 stop barca-coletiva

# Monitorar
pm2 monit
```

---

## 🔧 CONFIGURAÇÃO RÁPIDA

### Editar variáveis de ambiente:
```bash
nano .env
```

### Principais variáveis:
```env
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/banco

# Segurança
NEXTAUTH_SECRET=sua-chave-secreta
JWT_SECRET=sua-chave-jwt
ENCRYPTION_KEY=sua-chave-32-bytes

# URL da aplicação
NEXTAUTH_URL=https://seu-dominio.com
SOCKET_IO_CORS_ORIGIN=https://seu-dominio.com
```

---

## 🎉 DEPOIS DA INSTALAÇÃO

### 1. Acessar o sistema:
- **URL**: http://localhost:3000 (ou seu domínio)
- **Admin**: admin/@Wad235rt

### 2. Configurar seu perfil:
- Adicione seu nome e email
- Configure seu endereço
- Personalize suas preferências

### 3. Começar a usar:
- Crie barcas coletivas
- Adicione produtos
- Convide usuários
- Acompanhe as entregas

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### Não consegue acessar?
```bash
# Verificar se está rodando
pm2 status
# ou
docker-compose ps

# Verificar logs
pm2 logs
# ou
docker-compose logs
```

### Erro de banco de dados?
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -U usuario -h localhost -d banco
```

### Porta já está em uso?
```bash
# Verificar processos na porta 3000
netstat -tulpn | grep :3000

# Matar processo
sudo kill -9 PID
```

---

## 📁 ESTRUTURA DO PROJETO

```
barca-coletiva/
├── 📁 src/                    # Código fonte
│   ├── 📁 app/               # Páginas Next.js
│   ├── 📁 components/        # Componentes React
│   ├── 📁 lib/              # Bibliotecas e utilitários
│   └── 📁 hooks/            # Hooks personalizados
├── 📄 package.json           # Dependências
├── 📄 server.ts             # Servidor Node.js
├── 📄 ecosystem.config.js    # Configuração PM2
├── 📄 docker-compose.yml     # Docker
├── 📄 Dockerfile            # Config Docker
├── 📄 .env.example          # Variáveis de ambiente
├── 📄 magic-install.sh      # Instalador automático
├── 📄 start-easy-panel.sh   # Start fácil
└── 📄 README-INSTALACAO.md  # Este arquivo
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Personalize** o sistema com suas cores e logo
2. **Configure** o banco de dados para produção
3. **Adicione** seus produtos e preços
4. **Convide** seus primeiros usuários
5. **Comece** a usar!

---

## 🚀 VOCÊ ESTÁ PRONTO!

Parabéns! Você acabou de instalar o sistema **Barca Coletiva** da forma mais fácil possível. 

**Agora é só acessar e começar a usar! 🚤✨**

### Suporte:
- 📧 Email: suporte@barcacoletiva.com
- 💬 Chat: https://discord.gg/barcacoletiva
- 📖 Docs: https://docs.barcacoletiva.com

---

**Feito com ❤️ para a comunidade canábica brasileira** 🇧🇷🚤