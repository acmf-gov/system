# 🚤 Barca Coletiva - MySQL Setup Instructions

## 📋 Current Status
✅ **Configuration Complete** - All files are configured for MySQL
❌ **MySQL Server Required** - Database server needs to be started

## 🎯 Quick Start Guide

### Option 1: Docker Setup (Recommended)
```bash
# Start MySQL using Docker
docker-compose -f docker-compose.mysql.yml up -d

# Wait 30 seconds for MySQL to start, then run:
node complete-setup.js
```

### Option 2: Native MySQL Setup
```bash
# Install MySQL Server
sudo apt-get update
sudo apt-get install mysql-server

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database and user
sudo mysql -u root -p
```
```sql
CREATE DATABASE dbcenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'admin'@'localhost' IDENTIFIED BY '@Wad235rt';
GRANT ALL PRIVILEGES ON dbcenter.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Run complete setup
node complete-setup.js
```

### Option 3: Manual Setup
```bash
# Test connection
node test-mysql-connection.js

# Generate Prisma client
npm run db:generate

# Push schema
npm run db:push

# Build project
npm run build

# Create admin user
node create-admin.js

# Start application
npm start
```

## 🔧 Configuration Details

### Database Connection
- **Host**: localhost
- **Port**: 3306
- **Database**: dbcenter
- **User**: admin
- **Password**: @Wad235rt
- **URL**: mysql://admin:@Wad235rt@localhost:3306/dbcenter

### Application Access
- **URL**: http://localhost:3000
- **Admin User**: admin
- **Admin Password**: @Wad235rt

## 📊 Database Schema
The system will create the following tables:
- `users` - User accounts and profiles
- `addresses` - User delivery addresses
- `products` - Product catalog (gelo, flor, dry)
- `barges` - Collective purchase groups
- `orders` - Customer orders
- `order_items` - Order line items
- `payments` - Payment records
- `deliveries` - Delivery tracking
- `notifications` - User notifications
- `chat_rooms` - Chat rooms
- `chat_members` - Chat participants
- `chat_messages` - Chat messages
- `barge_products` - Product availability per barge

## 🛠️ Available Scripts

### Setup Scripts
- `complete-setup.js` - Complete automated setup
- `setup-mysql-database.js` - Database setup only
- `test-mysql-connection.js` - Test MySQL connection
- `check-mysql-status.js` - System status check
- `create-admin.js` - Create admin user

### Docker Files
- `docker-compose.mysql.yml` - Docker MySQL setup

### Documentation
- `MYSQL_SETUP_STATUS.md` - Detailed status report
- `mysql-setup-guide.md` - Manual setup guide

## 🚀 After Setup

Once MySQL is running and setup is complete:

1. **Start the application**:
   ```bash
   npm start
   ```

2. **Access the application**:
   - Open http://localhost:3000
   - Login with admin/@Wad235rt

3. **Development mode**:
   ```bash
   npm run dev
   ```

## 🔍 Troubleshooting

### Common Issues

**Connection Refused**
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL if needed
sudo systemctl start mysql
```

**Port Already in Use**
```bash
# Check what's using port 3306
sudo netstat -tlnp | grep 3306
```

**Permission Denied**
```bash
# Check MySQL user permissions
sudo mysql -u root -p
SHOW GRANTS FOR 'admin'@'localhost';
```

### Testing Commands
```bash
# Test MySQL connection
node test-mysql-connection.js

# Check system status
node check-mysql-status.js

# Verify database tables
mysql -h localhost -u admin -p@Wad235rt dbcenter -e "SHOW TABLES;"
```

## 📞 Support

If you encounter any issues:
1. Check the status with `node check-mysql-status.js`
2. Review the troubleshooting section
3. Ensure MySQL server is running and accessible
4. Verify database credentials are correct

---

**Ready when you are! Just start your MySQL server and run the setup script.** 🚤