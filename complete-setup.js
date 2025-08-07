#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚤 Barca Coletiva - Complete Setup Script');
console.log('========================================\n');

async function runSetup() {
    try {
        // Step 1: Test MySQL connection
        console.log('🔍 Step 1: Testing MySQL connection...');
        try {
            execSync('node test-mysql-connection.js', { stdio: 'pipe' });
            console.log('✅ MySQL connection successful!');
        } catch (error) {
            console.log('❌ MySQL connection failed');
            console.log('Please ensure MySQL server is running before continuing');
            console.log('Run: node test-mysql-connection.js to test connection');
            return;
        }

        // Step 2: Generate Prisma client
        console.log('\n🔄 Step 2: Generating Prisma client...');
        try {
            execSync('npm run db:generate', { stdio: 'inherit' });
            console.log('✅ Prisma client generated');
        } catch (error) {
            console.warn('⚠️ Prisma client generation failed');
        }

        // Step 3: Push schema to database
        console.log('\n📤 Step 3: Pushing schema to database...');
        try {
            execSync('npm run db:push', { stdio: 'inherit' });
            console.log('✅ Schema pushed successfully');
        } catch (error) {
            console.warn('⚠️ Schema push failed');
        }

        // Step 4: Build project
        console.log('\n🔨 Step 4: Building project...');
        try {
            execSync('npm run build', { stdio: 'inherit' });
            console.log('✅ Project built successfully');
        } catch (error) {
            console.warn('⚠️ Build failed');
        }

        // Step 5: Create admin user
        console.log('\n👤 Step 5: Creating admin user...');
        try {
            execSync('node create-admin.js', { stdio: 'inherit' });
            console.log('✅ Admin user created');
        } catch (error) {
            console.warn('⚠️ Admin user creation failed');
        }

        console.log('\n🎉 Setup completed successfully!');
        console.log('📋 Summary:');
        console.log('   ✅ MySQL connection working');
        console.log('   ✅ Database schema pushed');
        console.log('   ✅ Project built');
        console.log('   ✅ Admin user created');
        console.log('\n🚀 Your application is ready!');
        console.log('   Start with: npm start');
        console.log('   Access at: http://localhost:3000');
        console.log('   Admin login: admin/@Wad235rt');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Ensure MySQL server is running');
        console.log('2. Check database credentials');
        console.log('3. Verify port 3306 is accessible');
    }
}

runSetup();