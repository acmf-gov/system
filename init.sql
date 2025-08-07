-- 🚤 Barca Coletiva - Script de Inicialização do Banco de Dados
-- Este script é executado automaticamente quando o container PostgreSQL inicia

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar banco de dados se não existir
SELECT 'CREATE DATABASE barca_coletiva' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'barca_coletiva');

-- Conectar ao banco de dados
\c barca_coletiva;

-- Criar usuário se não existir
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'barca_user') THEN
      
      CREATE ROLE barca_user LOGIN PASSWORD 'barca123';
   END IF;
END
$do;

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE barca_coletiva TO barca_user;
GRANT ALL ON SCHEMA public TO barca_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO barca_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO barca_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO barca_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO barca_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO barca_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO barca_user;

-- Criar usuário admin padrão
INSERT INTO users (id, phone, password, name, email, isVerified, isAdmin, isActive, createdAt, updatedAt) 
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', -- senha: @Wad235rt
    'Administrador',
    'admin@barcacoletiva.com',
    true,
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (phone) DO NOTHING;

-- Inserir dados de exemplo (opcional)
-- Produtos
INSERT INTO products (id, name, description, type, pricePerGram, stock, isActive, createdAt, updatedAt) 
VALUES 
    (
        gen_random_uuid(),
        'Gelo Premium',
        'Gelo de alta qualidade, perfeito para conservação',
        'gelo',
        63.00,
        1000,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Flor Top',
        'Flor de primeira linha, aroma intenso',
        'flor',
        70.00,
        500,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Dry Especial',
        'Dry especial, efeito prolongado',
        'dry',
        75.00,
        300,
        true,
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

-- Criar barca de exemplo
INSERT INTO barges (id, name, description, targetGrams, currentGrams, pricePerGram, status, startDate, endDate, createdAt, updatedAt) 
VALUES (
    gen_random_uuid(),
    'Barca do Dia',
    'Barca coletiva diária com os melhores produtos',
    100,
    0,
    65.00,
    'active',
    NOW(),
    NOW() + INTERVAL '1 day',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Criar endereço de exemplo
INSERT INTO addresses (id, userId, street, number, neighborhood, city, state, zipCode, complement, isDefault, createdAt, updatedAt) 
VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE phone = 'admin'),
    'Rua Principal',
    '123',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    'Apto 1',
    true,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Criar notificações de exemplo
INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt, updatedAt) 
VALUES 
    (
        gen_random_uuid(),
        (SELECT id FROM users WHERE phone = 'admin'),
        'welcome',
        'Bem-vindo!',
        'Seja bem-vindo ao sistema Barca Coletiva!',
        false,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM users WHERE phone = 'admin'),
        'system',
        'Sistema Pronto',
        'Seu sistema está pronto para usar!',
        false,
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

-- Mostrar mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '🚤 Banco de dados Barca Coletiva inicializado com sucesso!';
    RAISE NOTICE '👤 Usuário admin criado: admin / @Wad235rt';
    RAISE NOTICE '📦 Produtos de exemplo inseridos';
    RAISE NOTICE '🚢 Barca de exemplo criada';
    RAISE NOTICE '🏠 Endereço de exemplo criado';
    RAISE NOTICE '🔔 Notificações de exemplo criadas';
END $$;