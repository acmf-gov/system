# 🚤 Barca Coletiva - VPS Deployment Checklist

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### ✅ **System Requirements**
- [ ] VPS with Ubuntu 20.04+ or CentOS 7+
- [ ] 2GB RAM minimum, 4GB recommended
- [ ] 20GB storage minimum
- [ ] Node.js 18+
- [ ] MySQL 8.0+
- [ ] Domain name pointed to VPS IP

### ✅ **Database Configuration**
- [ ] MySQL server running on VPS
- [ ] Database 'dbcenter' created
- [ ] User 'admin' created with password '@Wad235rt'
- [ ] Remote access enabled for MySQL
- [ ] Firewall allows port 3306

### ✅ **Application Files**
- [ ] All project files uploaded to VPS
- [ ] `.env` file configured with production settings
- [ ] `prisma/schema.prisma` updated for MySQL
- [ ] All dependencies installed via `npm install`

---

## 🚀 **DEPLOYMENT STEPS**

### Step 1: VPS Preparation
```bash
# Connect to VPS
ssh user@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL
sudo mysql_secure_installation
```

### Step 2: Database Setup
```bash
# Connect to MySQL
sudo mysql -u root -p

# Execute SQL commands:
CREATE DATABASE dbcenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'admin'@'%' IDENTIFIED BY '@Wad235rt';
GRANT ALL PRIVILEGES ON dbcenter.* TO 'admin'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Configure MySQL for Remote Access
```bash
# Edit MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Change: bind-address = 0.0.0.0
sudo systemctl restart mysql
```

### Step 4: Upload Project Files
```bash
# Create project directory
mkdir -p /var/www/barca-coletiva
cd /var/www/barca-coletiva

# Upload files (choose one method)
# Method 1: Git clone
git clone <your-repo-url> .

# Method 2: SCP upload
scp -r /local/path/* user@vps-ip:/var/www/barca-coletiva/

# Set permissions
sudo chown -R www-data:www-data /var/www/barca-coletiva
sudo chmod -R 755 /var/www/barca-coletiva
```

### Step 5: Install Dependencies
```bash
cd /var/www/barca-coletiva
npm install
```

### Step 6: Configure Environment
```bash
# Create .env file
nano .env
```

**Environment Variables:**
```env
# Database
DATABASE_URL="mysql://admin:@Wad235rt@localhost:3306/dbcenter"

# NextAuth
NEXTAUTH_SECRET="your-secure-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# JWT
JWT_SECRET="your-jwt-secret-here"

# Encryption
ENCRYPTION_KEY="your-encryption-key-here"

# Socket.IO
SOCKET_IO_CORS_ORIGIN="https://your-domain.com"

# Node Environment
NODE_ENV=production
PORT=3000
```

### Step 7: Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Create admin user
node create-admin.js
```

### Step 8: Build Application
```bash
# Build for production
npm run build
```

### Step 9: Install PM2
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
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

### Step 10: Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### Step 11: Install and Configure Nginx
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

### Step 12: Setup SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 13: Configure Firewall
```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3306/tcp  # MySQL (if needed)
sudo ufw enable
```

### Step 14: Setup Backup
```bash
# Create backup script
cat > /var/www/barca-coletiva/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/barca-coletiva"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Backup database
mysqldump -h localhost -u admin -p'@Wad235rt' dbcenter > \$BACKUP_DIR/dbcenter_\$DATE.sql

# Backup files
tar -czf \$BACKUP_DIR/files_\$DATE.tar.gz /var/www/barca-coletiva

# Keep only last 7 days
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /var/www/barca-coletiva/backup.sh

# Add to crontab
echo "0 2 * * * /var/www/barca-coletiva/backup.sh" | sudo crontab -
```

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

### Step 15: Verification
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs barca-coletiva

# Check Nginx status
sudo systemctl status nginx

# Test website
curl -I https://your-domain.com

# Test API endpoints
curl https://your-domain.com/api/health
```

### Step 16: Final Tests
- [ ] Website loads correctly
- [ ] Admin login works (admin/@Wad235rt)
- [ ] User registration works
- [ ] All pages load without errors
- [ ] Real-time features work (chat, notifications)
- [ ] Database operations work
- [ ] SSL certificate is valid
- [ ] Mobile responsiveness works

### Step 17: Monitoring Setup
```bash
# Install monitoring tools (optional)
sudo apt install htop iotop

# Set up log rotation
sudo nano /etc/logrotate.d/barca-coletiva
```

---

## 🎯 **DEPLOYMENT COMPLETE!**

### Access Information
- **Website**: https://your-domain.com
- **Admin Login**: admin / @Wad235rt
- **PM2 Dashboard**: `pm2 monit`
- **Application Logs**: `pm2 logs barca-coletiva`

### Maintenance Commands
```bash
# Restart application
pm2 restart barca-coletiva

# Update application
cd /var/www/barca-coletiva
git pull
npm install
npm run build
pm2 restart barca-coletiva

# Database backup
/var/www/barca-coletiva/backup.sh

# Check system status
pm2 status
sudo systemctl status nginx
```

---

**🚤 Your Barca Coletiva system is now deployed and ready for production!**