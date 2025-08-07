#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('👤 Creating admin user...');
        
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
        
        console.log('✅ Admin user created successfully!');
        console.log('   📱 Phone: admin');
        console.log('   🔑 Password: @Wad235rt');
        console.log('   🆔 User ID:', admin.id);
        
    } catch (error) {
        console.error('❌ Failed to create admin user:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();