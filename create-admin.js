const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('@Wad235rt', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { phone: 'admin' },
      update: {},
      create: {
        phone: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        email: 'admin@barca.com',
        isAdmin: true,
        isActive: true,
        isVerified: true
      }
    })

    console.log('Admin user created successfully:', {
      id: adminUser.id,
      phone: adminUser.phone,
      name: adminUser.name,
      isAdmin: adminUser.isAdmin
    })

  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()