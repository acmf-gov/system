# 🚤 Barca Coletiva - VPS Deployment Guide

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 7+
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **Node.js**: v18+ 
- **MySQL**: 8.0+

### Before You Start
- ✅ Domain name pointed to VPS IP
- ✅ SSH access to VPS
- ✅ MySQL database credentials (already provided)
- ✅ Project files ready to upload

## 🚀 Step-by-Step Deployment

### Step 1: Connect to VPS
```bash
ssh root@your-vps-ip
```

### Step 2: Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### Step 3: Install Node.js
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install MySQL Server
```bash
# Install MySQL
sudo apt install mysql-server -y

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL
sudo mysql_secure_installation
```

### Step 5: Configure MySQL for Remote Access
```bash
# Edit MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Comment out or change:
# bind-address = 127.0.0.1
# To:
bind-address = 0.0.0.0

# Restart MySQL
sudo systemctl restart mysql
```

### Step 6: Create Database and User
```bash
# Connect to MySQL
sudo mysql -u root -p

# Execute these SQL commands:
CREATE DATABASE dbcenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'admin'@'%' IDENTIFIED BY '@Wad235rt';
GRANT ALL PRIVILEGES ON dbcenter.* TO 'admin'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### Step 7: Configure Firewall
```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3306/tcp  # MySQL
sudo ufw allow 3000/tcp  # Application (if needed)

# Enable firewall
sudo ufw enable
```

### Step 8: Upload Project Files
```bash
# Create project directory
mkdir -p /var/www/barca-coletiva
cd /var/www/barca-coletiva

# Upload files (choose one method)
# Method 1: Using git (if repository is available)
git clone <your-repo-url> .

# Method 2: Using scp
scp -r /path/to/local/project/* root@your-vps-ip:/var/www/barca-coletiva/

# Method 3: Using rsync
rsync -avz /path/to/local/project/ root@your-vps-ip:/var/www/barca-coletiva/
```

### Step 9: Install Dependencies
```bash
cd /var/www/barca-coletiva
npm install
```

### Step 10: Configure Environment
```bash
# Create .env file
nano .env
```

Add these environment variables:
```env
# Database
DATABASE_URL="mysql://admin:@Wad235rt@localhost:3306/dbcenter"

# NextAuth
NEXTAUTH_SECRET="your-secure-secret-here"
NEXTAUTH_URL="http://your-domain.com"

# JWT
JWT_SECRET="your-jwt-secret-here"

# Encryption
ENCRYPTION_KEY="your-encryption-key-here"

# Socket.IO
SOCKET_IO_CORS_ORIGIN="http://your-domain.com"

# Node Environment
NODE_ENV=production
PORT=3000

# Easy Panel Specific
EASY_PANEL=true
```

### Step 11: Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Create admin user
node create-admin.js
```

### Step 12: Build Application
```bash
npm run build
```

### Step 13: Install PM2
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 configuration
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'barca-coletiva',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p logs
```

### Step 14: Start Application
```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 15: Install and Configure Nginx
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
cat > /etc/nginx/sites-available/barca-coletiva << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/barca-coletiva /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 16: Setup SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 17: Final Setup
```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/barca-coletiva
sudo chmod -R 755 /var/www/barca-coletiva

# Create backup script
cat > /var/www/barca-coletiva/backup.sh << EOF
#!/bin/bash
# Backup script for Barca Coletiva

BACKUP_DIR="/var/backups/barca-coletiva"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Backup database
mysqldump -h localhost -u admin -p'@Wad235rt' dbcenter > \$BACKUP_DIR/dbcenter_\$DATE.sql

# Backup files
tar -czf \$BACKUP_DIR/files_\$DATE.tar.gz /var/www/barca-coletiva

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /var/www/barca-coletiva/backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /var/www/barca-coletiva/backup.sh" | sudo crontab -
```

## 🔍 Verification Steps

### Step 1: Check Application Status
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs barca-coletiva

# Check Nginx status
sudo systemctl status nginx
```

### Step 2: Test Application
```bash
# Test HTTP access
curl -I http://your-domain.com

# Test HTTPS access
curl -I https://your-domain.com

# Test API endpoints
curl http://your-domain.com/api/health
```

### Step 3: Test Database Connection
```bash
# Test database connection
mysql -h localhost -u admin -p'@Wad235rt' dbcenter -e "SHOW TABLES;"

# Test admin user creation
mysql -h localhost -u admin -p'@Wad235rt' dbcenter -e "SELECT * FROM users WHERE phone = 'admin';"
```

## 🛠️ Maintenance Commands

### Application Management
```bash
# Restart application
pm2 restart barca-coletiva

# Stop application
pm2 stop barca-coletiva

# Start application
pm2 start barca-coletiva

# Monitor application
pm2 monit
```

### Database Management
```bash
# Backup database
mysqldump -h localhost -u admin -p'@Wad235rt' dbcenter > backup.sql

# Restore database
mysql -h localhost -u admin -p'@Wad235rt' dbcenter < backup.sql

# Access MySQL console
mysql -h localhost -u admin -p'@Wad235rt' dbcenter
```

### Log Management
```bash
# View application logs
pm2 logs barca-coletiva

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -u nginx -f
```

## 🚨 Troubleshooting

### Common Issues

#### Application Not Starting
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs barca-coletiva

# Check Node.js version
node --version

# Check port availability
netstat -tlnp | grep :3000
```

#### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test MySQL connection
mysql -h localhost -u admin -p'@Wad235rt' dbcenter

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

#### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Monitoring
```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Monitor Nginx connections
sudo nginx -T
```

---

## 🎉 **DEPLOYMENT COMPLETE!**

Your Barca Coletiva system is now deployed and ready for production!

### Access Information
- **Website**: https://your-domain.com
- **Admin Login**: admin / @Wad235rt
- **Database**: MySQL on localhost:3306

### Next Steps
1. **Test all features** in the production environment
2. **Set up monitoring** and alerts
3. **Configure backups** and disaster recovery
4. **Optimize performance** based on usage

**🚤 Your Barca Coletiva system is now live!**