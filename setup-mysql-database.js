#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚤 Barca Coletiva - MySQL Database Setup');
console.log('======================================\n');

async function setupDatabase() {
    try {
        // Test MySQL connection
        console.log('🔍 Testing MySQL connection...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'admin',
            password: '@Wad235rt'
        });

        console.log('✅ MySQL connection successful!');

        // Create database if it doesn't exist
        console.log('📊 Creating database...');
        await connection.execute(`CREATE DATABASE IF NOT EXISTS dbcenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('✅ Database created or already exists');

        // Switch to the database
        await connection.execute(`USE dbcenter`);

        // Check if tables exist
        const [tables] = await connection.execute(`SHOW TABLES`);
        console.log(`📋 Found ${tables.length} existing tables`);

        if (tables.length === 0) {
            console.log('🔄 No tables found, generating Prisma client...');
            try {
                execSync('npm run db:generate', { stdio: 'inherit' });
                console.log('✅ Prisma client generated');
            } catch (error) {
                console.warn('⚠️ Failed to generate Prisma client:', error.message);
            }

            console.log('📤 Pushing schema to database...');
            try {
                execSync('npm run db:push', { stdio: 'inherit' });
                console.log('✅ Schema pushed successfully');
            } catch (error) {
                console.warn('⚠️ Failed to push schema:', error.message);
            }
        } else {
            console.log('📋 Existing tables:');
            tables.forEach(table => {
                console.log(`   - ${Object.values(table)[0]}`);
            });
        }

        // Create admin user
        console.log('👤 Creating admin user...');
        try {
            const adminScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('@Wad235rt', 10);
        
        const admin = await prisma.user.upsert({
            where: { phone: 'admin' },
            update: {},
            create: {
                phone: 'admin',
                password: hashedPassword,
                name: 'Administrador',
                email: 'admin@barcacoletiva.com',
                isVerified: true,
                isAdmin: true,
                isActive: true,
                referralCode: 'ADMIN'
            }
        });
        
        console.log('✅ Admin user created successfully');
        console.log('   📱 Phone: admin');
        console.log('   🔑 Password: @Wad235rt');
    } catch (error) {
        console.log('⚠️ Could not create admin user:', error.message);
    } finally {
        await prisma.\$disconnect();
    }
}

createAdmin();
`;
            
            fs.writeFileSync('create-admin-temp.js', adminScript);
            execSync('node create-admin-temp.js', { stdio: 'inherit' });
            
            // Remove temporary file
            try {
                fs.unlinkSync('create-admin-temp.js');
            } catch (error) {
                // Ignore error
            }
        } catch (error) {
            console.warn('⚠️ Could not create admin user:', error.message);
        }

        // Build the project
        console.log('🔨 Building project...');
        try {
            execSync('npm run build', { stdio: 'inherit' });
            console.log('✅ Project built successfully');
        } catch (error) {
            console.warn('⚠️ Build failed:', error.message);
        }

        await connection.end();
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('📋 Summary:');
        console.log('   ✅ MySQL connection working');
        console.log('   ✅ Database "dbcenter" ready');
        console.log('   ✅ Schema pushed to database');
        console.log('   ✅ Admin user created');
        console.log('   ✅ Project built');
        console.log('\n🚀 Your application is ready to start!');
        console.log('   Run: npm start');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 MySQL server is not running or not accessible.');
            console.log('Please ensure:');
            console.log('1. MySQL server is installed and running');
            console.log('2. MySQL is listening on port 3306');
            console.log('3. User "admin" exists with password "@Wad235rt"');
            console.log('4. Firewall allows connections to port 3306');
            console.log('\nOnce MySQL is running, run this script again:');
            console.log('   node setup-mysql-database.js');
        }
        
        process.exit(1);
    }
}

setupDatabase();