const mysql = require('mysql2/promise');

async function checkTables() {
  try {
    console.log('🚤 Barca Coletiva - Database Tables Check');
    console.log('======================================\n');
    
    const connection = await mysql.createConnection({
      host: '168.231.127.189',
      port: 9897,
      user: 'admin',
      password: '@Wad235rt',
      database: 'dbcenter'
    });
    
    console.log('✅ MySQL connection successful!');
    
    // Check existing tables
    const [tables] = await connection.execute('SHOW TABLES;');
    console.log(`📋 Found ${tables.length} tables in database:`);
    
    if (tables.length > 0) {
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    } else {
      console.log('   No tables found - schema needs to be pushed');
    }
    
    // Check if we need to push the schema
    const expectedTables = [
      'users', 'addresses', 'products', 'barges', 'orders',
      'order_items', 'payments', 'deliveries', 'notifications',
      'chat_rooms', 'chat_members', 'chat_messages', 'barge_products'
    ];
    
    const existingTableNames = tables.map(table => Object.values(table)[0]);
    const missingTables = expectedTables.filter(table => !existingTableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️ Missing tables: ${missingTables.join(', ')}`);
      console.log('🔄 Need to push schema to create missing tables...');
      
      // Close connection and push schema
      await connection.end();
      
      console.log('📤 Pushing Prisma schema to database...');
      const { execSync } = require('child_process');
      try {
        execSync('npm run db:push', { stdio: 'inherit' });
        console.log('✅ Schema pushed successfully!');
        
        // Verify tables were created
        const newConnection = await mysql.createConnection({
          host: '168.231.127.189',
          port: 9897,
          user: 'admin',
          password: '@Wad235rt',
          database: 'dbcenter'
        });
        
        const [newTables] = await newConnection.execute('SHOW TABLES;');
        console.log(`📋 Now have ${newTables.length} tables:`);
        newTables.forEach(table => {
          console.log(`   - ${Object.values(table)[0]}`);
        });
        
        await newConnection.end();
        
      } catch (error) {
        console.error('❌ Failed to push schema:', error.message);
      }
    } else {
      console.log('\n✅ All expected tables exist!');
      await connection.end();
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkTables();