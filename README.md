# 🚀 Barcas - Plataforma de Compras Coletivas

Uma aplicação profissional para coordenação de compras coletivas ("barcas") com chat em tempo real e criptografia ponta a ponta (E2EE). Desenvolvida com Next.js, TypeScript e Docker para deploy fácil via Easypanel.

## ✨ Funcionalidades

### 🎯 Core Features
- **🔐 Autenticação Segura**: Sistema de login/registro com NextAuth.js
- **💬 Chat em Tempo Real**: Chat criptografado ponta a ponta para o canal "Uberlândia"
- **📊 Gestão de Barcas**: CRUD completo para administradores
- **🤝 Participação de Clientes**: Interface intuitiva para participar das barcas
- **📱 Mobile-First**: Design totalmente responsivo para celular, tablet e desktop
- **🐳 Dockerizado**: Container completo com auto-instalação para Easypanel

### 🔒 Segurança
- **🔐 E2EE (End-to-End Encryption)**: Mensagens criptografadas no cliente com TweetNaCl
- **🛡️ Validação de Inputs**: Schema validation com Zod
- **🔑 Gerenciamento de Chaves**: Chaves assimétricas geradas no navegador
- **📋 Rate Limiting**: Proteção contra abuso de API

## 🚀 Tecnologias Utilizadas

### Frontend
- **⚡ Next.js 15** - React framework com App Router
- **📘 TypeScript** - Type-safe JavaScript
- **🎨 Tailwind CSS** - Utility-first CSS framework
- **🧩 shadcn/ui** - Componentes acessíveis baseados em Radix UI
- **🎣 React Hook Form + Zod** - Forms e validação
- **🔄 TanStack Query** - Data fetching
- **🐻 Zustand** - State management

### Backend
- **🗄️ MySQL** - Banco de dados relacional
- **🔧 Prisma** - ORM type-safe
- **🔐 NextAuth.js** - Autenticação
- **🌐 Socket.IO** - Real-time communication
- **🔐 TweetNaCl** - Criptografia

### Infraestrutura
- **🐳 Docker** - Containerização
- **📦 Docker Compose** - Orquestração
- **🚀 Easypanel** - Deploy simplificado

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── barcas/            # Barcas management
│   └── page.tsx           # Dashboard
├── components/            # React components
│   ├── chat/              # Chat components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
│   ├── auth/              # Auth configuration
│   ├── crypto.ts          # Encryption utilities
│   ├── db.ts              # Database client
│   └── socket.ts          # WebSocket setup
└── types/                 # TypeScript definitions
```

## 🚀 Quick Start (Desenvolvimento)

### Pré-requisitos
- Node.js 18+
- MySQL (ou Docker)

### Instalação
```bash
# Clonar o repositório
git clone <repository-url>
cd barcas

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Gerar Prisma client
npm run db:generate

# Rodar migrations
npm run db:push

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 🐳 Deploy com Docker (Produção)

### Variáveis de Ambiente Obrigatórias

```bash
# Database
DATABASE_URL=mysql://mysql:5952271568d18b127edb@system_db-cu:3306/system

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Node Environment
NODE_ENV=production
```

### Deploy com Docker Compose

```bash
# Build e iniciar todos os serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f app

# Parar serviços
docker-compose down
```

### Deploy com Easypanel

1. **Fazer push do repositório para GitHub**
2. **Configurar Easypanel**:
   - Criar novo application
   - Selecionar "Docker Compose"
   - Conectar repositório GitHub
   - Configurar variáveis de ambiente
3. **Deploy automático** será acionado

#### Configuração Easypanel

```yaml
# Variáveis de Ambiente (Environment Variables)
DATABASE_URL=mysql://mysql:5952271568d18b127edb@system_db-cu:3306/system
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-here
NODE_ENV=production

# Portas
- 3000:3000

# Volumes (opcional)
- ./uploads:/app/uploads
```

## 🔧 Configuração do Banco de Dados

### Schema Principal

```sql
-- Users (Usuários)
CREATE TABLE users (
  id VARCHAR(191) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  name VARCHAR(191),
  password VARCHAR(191) NOT NULL,
  isAdmin BOOLEAN DEFAULT FALSE,
  publicKey TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Barcas (Compras coletivas)
CREATE TABLE barcas (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  type VARCHAR(191) NOT NULL,
  pricePerGram DECIMAL(10,2) NOT NULL,
  targetQuantityGrams INT NOT NULL,
  totalOrderedGrams INT DEFAULT 0,
  status ENUM('OPEN', 'CLOSED', 'COMPLETED') DEFAULT 'OPEN',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders (Pedidos)
CREATE TABLE orders (
  id VARCHAR(191) PRIMARY KEY,
  barcaId VARCHAR(191) NOT NULL,
  userId VARCHAR(191),
  quantityGrams INT NOT NULL,
  clientName VARCHAR(191) NOT NULL,
  phone VARCHAR(191) NOT NULL,
  address TEXT NOT NULL,
  neighborhood VARCHAR(191) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (barcaId) REFERENCES barcas(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Messages (Mensagens do chat)
CREATE TABLE messages (
  id VARCHAR(191) PRIMARY KEY,
  senderId VARCHAR(191) NOT NULL,
  barcaId VARCHAR(191),
  ciphertext LONGTEXT NOT NULL,
  nonce VARCHAR(191) NOT NULL,
  meta JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(id),
  FOREIGN KEY (barcaId) REFERENCES barcas(id)
);
```

## 🔐 Criptografia Ponta a Ponta (E2EE)

### Como Funciona

1. **Geração de Chaves**: Ao primeiro acesso, cada usuário gera um par de chaves assimétricas (X25519) no navegador
2. **Armazenamento Seguro**: A chave privada nunca sai do navegador, apenas a chave pública é enviada ao servidor
3. **Criptografia de Mensagens**:
   - Gera uma chave simétrica aleatória para cada mensagem
   - Criptografa o conteúdo com a chave simétrica
   - Criptografa a chave simétrica para cada destinatário usando suas chaves públicas
4. **Descriptografia**: Cada destinatário usa sua chave privada para descriptografar a chave simétrica e depois a mensagem

### Segurança

- 🔒 Mensagens armazenadas criptografadas no servidor
- 🔑 Chaves privadas nunca são enviadas ao servidor
- 🛡️ Forward secrecy com chaves efêmeras
- ✅ Autenticação forte de usuários

## 📱 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Barcas
- `GET /api/barcas` - Listar todas as barcas
- `POST /api/barcas` - Criar nova barca (admin)
- `GET /api/barcas/[id]` - Detalhes da barca
- `PUT /api/barcas/[id]` - Atualizar barca (admin)
- `DELETE /api/barcas/[id]` - Deletar barca (admin)
- `POST /api/barcas/[id]/orders` - Participar da barca

### Chat
- `GET /api/messages` - Listar mensagens
- `POST /api/messages` - Enviar mensagem criptografada
- `GET /api/users/public-keys` - Obter chaves públicas dos usuários

## 🧪 Testes

```bash
# Rodar testes unitários
npm test

# Testes E2E (se configurado)
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📊 Monitoramento e Logs

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Logs
```bash
# Docker logs
docker-compose logs -f app

# Application logs
docker exec -it barcas_app tail -f /app/logs/app.log
```

## 🔧 Manutenção

### Atualizações
```bash
# Atualizar dependências
npm update

# Rebuild Docker
docker-compose build --no-cache
docker-compose up -d
```

### Backup
```bash
# Backup do banco de dados
docker exec system_db-cu mysqldump -u mysql -p5952271568d18b127edb system > backup.sql

# Restore
docker exec -i system_db-cu mysql -u mysql -p5952271568d18b127edb system < backup.sql
```

## 🤝 Contribuição

1. Faça fork do projeto
2. Crie uma feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## ⚠️ Importante

**Uso legal exclusivo.** Este sistema foi desenvolvido para facilitar compras coletivas legais. Qualquer uso ilegal não é permitido e resultará no imediato término do suporte.

## 🚀 Suporte

Para suporte técnico ou dúvidas:

- 📧 Email: support@barcas.com
- 📖 Documentação: [Wiki](https://github.com/your-repo/wiki)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

Built with ❤️ para compras coletivas eficientes e seguras.
