#!/bin/bash

echo "🚤 Barca Coletiva - MySQL Setup Script"
echo "======================================"

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker found - using Docker setup"
    
    # Stop existing container if running
    docker stop mysql_dbcenter 2>/dev/null || true
    docker rm mysql_dbcenter 2>/dev/null || true
    
    # Start MySQL container
    echo "🐳 Starting MySQL container..."
    docker-compose -f docker-compose.mysql.yml up -d
    
    # Wait for MySQL to be ready
    echo "⏳ Waiting for MySQL to be ready..."
    for i in {1..30}; do
        if docker exec mysql_dbcenter mysqladmin ping -h localhost --silent; then
            echo "✅ MySQL is ready!"
            break
        fi
        echo "Waiting... ($i/30)"
        sleep 2
    done
    
    # Test connection
    echo "🔍 Testing connection..."
    if docker exec mysql_dbcenter mysql -u admin -p@Wad235rt dbcenter -e "SHOW DATABASES;" &>/dev/null; then
        echo "✅ MySQL connection successful!"
        echo "📊 Database 'dbcenter' is ready"
        
        # Generate Prisma client and push schema
        echo "🔄 Generating Prisma client..."
        npm run db:generate
        
        echo "📤 Pushing schema to database..."
        npm run db:push
        
        echo "✅ Setup complete! Your MySQL database is ready."
    else
        echo "❌ MySQL connection failed"
        exit 1
    fi
    
elif command -v mysql &> /dev/null; then
    echo "✅ MySQL client found - using native setup"
    
    # Check if MySQL server is running
    if ! systemctl is-active --quiet mysql; then
        echo "🚀 Starting MySQL server..."
        sudo systemctl start mysql
        sleep 5
    fi
    
    # Create database and user
    echo "📊 Creating database and user..."
    sudo mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS dbcenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY '@Wad235rt';
GRANT ALL PRIVILEGES ON dbcenter.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Test connection
    echo "🔍 Testing connection..."
    if mysql -h localhost -u admin -p@Wad235rt dbcenter -e "SHOW DATABASES;" &>/dev/null; then
        echo "✅ MySQL connection successful!"
        
        # Generate Prisma client and push schema
        echo "🔄 Generating Prisma client..."
        npm run db:generate
        
        echo "📤 Pushing schema to database..."
        npm run db:push
        
        echo "✅ Setup complete! Your MySQL database is ready."
    else
        echo "❌ MySQL connection failed"
        exit 1
    fi
    
else
    echo "❌ Neither Docker nor MySQL client found"
    echo "Please install either:"
    echo "1. Docker and Docker Compose, or"
    echo "2. MySQL Server"
    echo ""
    echo "For Docker installation:"
    echo "  - Ubuntu: sudo apt install docker.io docker-compose"
    echo "  - CentOS: sudo yum install docker docker-compose"
    echo ""
    echo "For MySQL installation:"
    echo "  - Ubuntu: sudo apt install mysql-server"
    echo "  - CentOS: sudo yum install mysql-server"
    exit 1
fi

echo ""
echo "🎉 MySQL setup completed successfully!"
echo "📋 Connection details:"
echo "   Host: localhost"
echo "   Port: 3306"
echo "   User: admin"
echo "   Password: @Wad235rt"
echo "   Database: dbcenter"