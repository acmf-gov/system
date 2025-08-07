#!/bin/bash

# Script de backup para Barca Coletiva
# Uso: ./backup.sh

# Configurações
BACKUP_DIR="/backups"
PROJECT_PATH="/var/www/barca-coletiva"
DB_NAME="barca_coletiva"
DB_USER="barca_user"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

echo "Iniciando backup em $DATE"

# Backup do banco de dados
echo "Fazendo backup do banco de dados..."
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup dos arquivos do projeto
echo "Fazendo backup dos arquivos..."
tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" \
    --exclude="$PROJECT_PATH/.next" \
    --exclude="$PROJECT_PATH/node_modules" \
    --exclude="$PROJECT_PATH/.git" \
    "$PROJECT_PATH"

# Backup das configurações
echo "Fazendo backup das configurações..."
tar -czf "$BACKUP_DIR/config_backup_$DATE.tar.gz" \
    /etc/nginx/sites-available/barca-coletiva \
    /etc/letsencrypt/live/ \
    "$PROJECT_PATH/.env" 2>/dev/null || true

# Manter apenas os últimos 7 dias de backup
echo "Limpando backups antigos..."
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

# Compactar backups antigos
echo "Compactando backups..."
find "$BACKUP_DIR" -name "*.sql" -mtime +1 -exec gzip {} \;

echo "Backup concluído em $DATE"
echo "Backups disponíveis em: $BACKUP_DIR"
ls -la "$BACKUP_DIR" | tail -10