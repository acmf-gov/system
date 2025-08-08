#!/bin/bash

# 🚤 Start Script para Easy Panel - Super Fácil!
# Uso: ./start-easy-panel.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo "████████████████████████████████████████████████████████"
echo "█                                                      █"
echo "█            🚤 BARCA COLETIVA - EASY PANEL            █"
echo "█                  START SUPER FÁCIL                  █"
echo "█                                                      █"
echo "████████████████████████████████████████████████████████"
echo

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

# Verificar Docker
log_step "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado. Por favor, instale o Docker primeiro."
    echo "📖 Guia: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    echo "📖 Guia: https://docs.docker.com/compose/install/"
    exit 1
fi

log_success "Docker e Docker Compose estão instalados"

# Verificar arquivos necessários
log_step "Verificando arquivos necessários..."
required_files=("docker-compose.yml" "Dockerfile" "package.json")
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        log_error "Arquivo necessário não encontrado: $file"
        exit 1
    fi
done
log_success "Todos os arquivos necessários estão presentes"

# Menu de opções
echo
echo -e "${CYAN}🎯 Escolha uma opção:${NC}"
echo "1) 🐳 Iniciar com Docker (Recomendado)"
echo "2) 🔧 Iniciar sem Docker (Node.js local)"
echo "3) 🛑 Parar serviços"
echo "4) 🔄 Reiniciar serviços"
echo "5) 📊 Ver status"
echo "6) 📋 Ver logs"
echo "7) 🗑️ Limpar tudo"
echo "0) ❌ Sair"
echo

read -p "Digite sua opção (0-7): " option

case $option in
    1)
        log_step "Iniciando com Docker..."
        docker-compose down 2>/dev/null || true
        docker-compose up -d --build
        
        log_success "Serviços iniciados com Docker!"
        echo
        echo -e "${GREEN}🌐 Aplicação disponível em:${NC} http://localhost:3000"
        echo -e "${GREEN}👤 Usuário Admin:${NC} admin/@Wad235rt"
        echo -e "${GREEN}🗄️ Banco de dados:${NC} localhost:5432"
        echo
        echo -e "${CYAN}🔧 Comandos úteis:${NC}"
        echo "  docker-compose ps     - Ver status dos containers"
        echo "  docker-compose logs   - Ver logs"
        echo "  docker-compose down   - Parar serviços"
        ;;
        
    2)
        log_step "Iniciando sem Docker..."
        if ! command -v node &> /dev/null; then
            log_error "Node.js não está instalado. Por favor, instale o Node.js primeiro."
            exit 1
        fi
        
        # Verificar PM2
        if ! command -v pm2 &> /dev/null; then
            log_info "Instalando PM2..."
            npm install -g pm2
            pm2 startup
            pm2 save
        fi
        
        # Instalar dependências
        log_info "Instalando dependências..."
        npm install
        
        # Build
        log_info "Buildando projeto..."
        npm run build
        
        # Iniciar com PM2
        log_info "Iniciando aplicação..."
        pm2 start ecosystem.config.js || pm2 start npm --name "barca-coletiva" -- start
        pm2 save
        
        log_success "Aplicação iniciada sem Docker!"
        echo
        echo -e "${GREEN}🌐 Aplicação disponível em:${NC} http://localhost:3000"
        echo -e "${GREEN}👤 Usuário Admin:${NC} admin/@Wad235rt"
        echo
        echo -e "${CYAN}🔧 Comandos úteis:${NC}"
        echo "  pm2 status          - Ver status"
        echo "  pm2 logs            - Ver logs"
        echo "  pm2 restart         - Reiniciar"
        echo "  pm2 stop            - Parar"
        ;;
        
    3)
        log_step "Parando serviços..."
        docker-compose down 2>/dev/null || true
        pm2 stop barca-coletiva 2>/dev/null || true
        pm2 delete barca-coletiva 2>/dev/null || true
        log_success "Serviços parados!"
        ;;
        
    4)
        log_step "Reiniciando serviços..."
        docker-compose restart 2>/dev/null || true
        pm2 restart barca-coletiva 2>/dev/null || true
        log_success "Serviços reiniciados!"
        ;;
        
    5)
        log_step "Verificando status..."
        echo
        echo -e "${CYAN}🐳 Docker Containers:${NC}"
        docker-compose ps 2>/dev/null || echo "Nenhum container Docker rodando"
        echo
        echo -e "${CYAN}🚀 PM2 Processos:${NC}"
        pm2 status 2>/dev/null || echo "Nenhum processo PM2 rodando"
        ;;
        
    6)
        log_step "Mostrando logs..."
        echo
        echo -e "${CYAN}🐳 Docker Logs:${NC}"
        docker-compose logs --tail=50 2>/dev/null || echo "Nenhum container Docker"
        echo
        echo -e "${CYAN}🚀 PM2 Logs:${NC}"
        pm2 logs --lines 50 2>/dev/null || echo "Nenhum processo PM2"
        ;;
        
    7)
        log_warning "⚠️  Isso vai parar todos os serviços e remover containers, volumes e imagens!"
        read -p "Tem certeza? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_step "Limpando tudo..."
            docker-compose down -v --remove-orphans 2>/dev/null || true
            pm2 delete all 2>/dev/null || true
            docker system prune -f 2>/dev/null || true
            log_success "Tudo limpo!"
        else
            log_info "Operação cancelada"
        fi
        ;;
        
    0)
        log_info "Saindo..."
        exit 0
        ;;
        
    *)
        log_error "Opção inválida: $option"
        exit 1
        ;;
esac

echo
echo "████████████████████████████████████████████████████████"
echo "█                                                      █"
echo "█              🎉 OPERAÇÃO CONCLUÍDA!                 █"
echo "█                                                      █"
echo "████████████████████████████████████████████████████████"
echo