# MySQL Database Setup Guide

## Current Status
❌ MySQL server is not running or accessible on localhost:3306

## Database Configuration
- **Host**: localhost
- **Port**: 3306
- **User**: admin
- **Password**: @Wad235rt
- **Database**: dbcenter
- **Connection URL**: mysql://admin:@Wad235rt@localhost:3306/dbcenter

## Prerequisites
1. MySQL server must be installed and running
2. Database user must be created with proper permissions
3. Database must be created

## Setup Steps

### 1. Install MySQL Server
```bash
# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-server

# For CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld

# For macOS (using Homebrew)
brew install mysql
brew services start mysql
```

### 2. Secure MySQL Installation
```bash
sudo mysql_secure_installation
```

### 3. Create Database and User
```sql
-- Connect to MySQL as root
sudo mysql -u root -p

-- Create database
CREATE DATABASE dbcenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user and grant privileges
CREATE USER 'admin'@'localhost' IDENTIFIED BY '@Wad235rt';
GRANT ALL PRIVILEGES ON dbcenter.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 4. Verify MySQL Service
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL if not running
sudo systemctl start mysql

# Enable MySQL to start on boot
sudo systemctl enable mysql
```

### 5. Test Connection
```bash
# Test connection
mysql -h localhost -u admin -p@Wad235rt -e "SHOW DATABASES;"

# Expected output should include "dbcenter"
```

## Alternative: Docker Setup
If you prefer using Docker, here's a docker-compose configuration:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: mysql_dbcenter
    environment:
      MYSQL_ROOT_PASSWORD: @Wad235rt
      MYSQL_DATABASE: dbcenter
      MYSQL_USER: admin
      MYSQL_PASSWORD: @Wad235rt
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

Start with:
```bash
docker-compose up -d
```

## Next Steps
Once MySQL is running and accessible, run:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Verify tables were created
mysql -h localhost -u admin -p@Wad235rt dbcenter -e "SHOW TABLES;"
```

## Troubleshooting
- **Connection refused**: MySQL server is not running
- **Access denied**: Check username/password and permissions
- **Unknown database**: Database 'dbcenter' doesn't exist
- **Port already in use**: Another service is using port 3306