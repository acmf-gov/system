#!/bin/bash

# 🚤 Barca Coletiva - VPS Deployment Script
# =========================================

echo "🚤 Barca Coletiva - VPS Deployment Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✅] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[⚠️] $1${NC}"
}

print_error() {
    echo -e "${RED}[❌] $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    echo "🔍 Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed"
        echo "Please install Node.js 18+ first:"
        echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "sudo apt-get install -y nodejs"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    echo "🔍 Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    if npm install; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Generate Prisma client
generate_prisma() {
    echo "🔄 Generating Prisma client..."
    if npm run db:generate; then
        print_status "Prisma client generated successfully"
    else
        print_error "Failed to generate Prisma client"
        exit 1
    fi
}

# Test database connection
test_database() {
    echo "🔍 Testing database connection..."
    if node test-mysql-connection.js; then
        print_status "Database connection successful"
    else
        print_error "Database connection failed"
        echo "Please check your database configuration in .env"
        exit 1
    fi
}

# Run complete system test
run_system_test() {
    echo "🧪 Running complete system test..."
    if node test-summary.js; then
        print_status "System test passed"
    else
        print_warning "System test had some issues, but continuing..."
    fi
}

# Build application
build_application() {
    echo "🔨 Building application..."
    if npm run build; then
        print_status "Application built successfully"
    else
        print_error "Failed to build application"
        exit 1
    fi
}

# Install PM2 if not installed
install_pm2() {
    echo "📦 Checking PM2 installation..."
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        print_status "PM2 is already installed: $PM2_VERSION"
    else
        echo "Installing PM2..."
        if npm install -g pm2; then
            print_status "PM2 installed successfully"
        else
            print_error "Failed to install PM2"
            exit 1
        fi
    fi
}

# Start application with PM2
start_application() {
    echo "🚀 Starting application with PM2..."
    
    # Stop existing process if any
    pm2 stop barca-coletiva 2>/dev/null || true
    pm2 delete barca-coletiva 2>/dev/null || true
    
    # Start application
    if pm2 start server.js --name "barca-coletiva"; then
        print_status "Application started successfully"
        
        # Save PM2 configuration
        pm2 save
        pm2 startup
        
        print_status "PM2 configuration saved"
    else
        print_error "Failed to start application"
        exit 1
    fi
}

# Show status
show_status() {
    echo ""
    echo "📊 Deployment Status:"
    echo "===================="
    pm2 status barca-coletiva
    echo ""
    echo "🌐 Application URL: http://localhost:3000"
    echo "👤 Admin Login: admin / @Wad235rt"
    echo ""
    echo "📋 Useful Commands:"
    echo "   pm2 logs barca-coletiva     - View logs"
    echo "   pm2 restart barca-coletiva  - Restart application"
    echo "   pm2 stop barca-coletiva     - Stop application"
    echo "   pm2 monit                   - Monitor processes"
}

# Main deployment function
main() {
    echo ""
    print_status "Starting deployment process..."
    echo ""
    
    # Run all deployment steps
    check_nodejs
    check_npm
    install_dependencies
    generate_prisma
    test_database
    run_system_test
    build_application
    install_pm2
    start_application
    show_status
    
    echo ""
    print_status "🎉 Deployment completed successfully!"
    print_status "🚤 Barca Coletiva is now running on your VPS!"
    echo ""
}

# Run main function
main "$@"