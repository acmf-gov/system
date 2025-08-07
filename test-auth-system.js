const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testAuthSystem() {
  try {
    console.log('🚤 Barca Coletiva - Authentication System Test');
    console.log('============================================\n');
    
    const connection = await mysql.createConnection({
      host: '168.231.127.189',
      port: 9897,
      user: 'admin',
      password: '@Wad235rt',
      database: 'dbcenter'
    });
    
    console.log('✅ MySQL connection successful!');
    
    // Check for admin user
    const [users] = await connection.execute('SELECT * FROM users WHERE phone = ?', ['admin']);
    
    if (users.length === 0) {
      console.log('👤 Admin user not found, creating one...');
      
      const hashedPassword = await bcrypt.hash('@Wad235rt', 10);
      
      await connection.execute(`
        INSERT INTO users (
          id, phone, password, name, email, isVerified, isAdmin, isActive, 
          referralCode, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'admin-' + Date.now(),
        'admin',
        hashedPassword,
        'Administrador',
        'admin@barcacoletiva.com',
        true,
        true,
        true,
        'ADMIN'
      ]);
      
      console.log('✅ Admin user created successfully!');
      console.log('   📱 Phone: admin');
      console.log('   🔑 Password: @Wad235rt');
      
    } else {
      console.log('👤 Admin user found:');
      const admin = users[0];
      console.log(`   🆔 ID: ${admin.id}`);
      console.log(`   📱 Phone: ${admin.phone}`);
      console.log(`   👤 Name: ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔐 Is Admin: ${admin.isAdmin}`);
      console.log(`   ✅ Is Active: ${admin.isActive}`);
      console.log(`   🔒 Is Verified: ${admin.isVerified}`);
      
      // Test password verification
      const isPasswordValid = await bcrypt.compare('@Wad235rt', admin.password);
      console.log(`   🔑 Password Valid: ${isPasswordValid}`);
    }
    
    // Check total users count
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`\n📊 Total users in database: ${userCount[0].count}`);
    
    // Check other tables counts
    const [tableCounts] = await connection.execute(`
      SELECT 
        'addresses' as table_name, COUNT(*) as count FROM addresses
      UNION SELECT 'products', COUNT(*) FROM products
      UNION SELECT 'barges', COUNT(*) FROM barges
      UNION SELECT 'orders', COUNT(*) FROM orders
      UNION SELECT 'deliveries', COUNT(*) FROM deliveries
    `);
    
    console.log('\n📋 Table counts:');
    tableCounts.forEach(table => {
      console.log(`   ${table.table_name}: ${table.count} records`);
    });
    
    await connection.end();
    
    console.log('\n✅ Authentication system test completed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

testAuthSystem();