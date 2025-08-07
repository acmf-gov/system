const mysql = require('mysql2/promise');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkStatus() {
  console.log('🚤 Barca Coletiva - MySQL Status Check');
  console.log('=====================================\n');
  
  // Check if MySQL client is available
  try {
    await execPromise('which mysql');
    console.log('✅ MySQL client is available');
  } catch (error) {
    console.log('❌ MySQL client is not available');
  }
  
  // Check if Docker is available
  try {
    await execPromise('which docker');
    console.log('✅ Docker is available');
  } catch (error) {
    console.log('❌ Docker is not available');
  }
  
  // Check if MySQL is running on port 3306
  try {
    await execPromise('netstat -tlnp | grep 3306');
    console.log('✅ Port 3306 is in use');
  } catch (error) {
    console.log('❌ Port 3306 is not in use');
  }
  
  // Test database connection
  try {
    console.log('\n🔍 Testing database connection...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'admin',
      password: '@Wad235rt',
      database: 'dbcenter'
    });
    
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES;');
    console.log(`📊 Found ${tables.length} tables in database:`);
    
    if (tables.length > 0) {
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    } else {
      console.log('   No tables found - schema needs to be pushed');
    }
    
    await connection.end();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 To fix this issue:');
      console.log('1. Make sure MySQL server is running');
      console.log('2. Run the setup script: ./setup-mysql.sh');
      console.log('3. Or manually install MySQL and create the database');
    }
  }
  
  // Check Prisma configuration
  console.log('\n📋 Prisma Configuration:');
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
    if (dbUrlMatch) {
      console.log('✅ DATABASE_URL found:', dbUrlMatch[1]);
    } else {
      console.log('❌ DATABASE_URL not found in .env');
    }
  } catch (error) {
    console.log('❌ Could not read .env file');
  }
  
  // Check Prisma schema
  try {
    const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
    if (schemaContent.includes('provider = "mysql"')) {
      console.log('✅ Prisma schema configured for MySQL');
    } else {
      console.log('❌ Prisma schema not configured for MySQL');
    }
  } catch (error) {
    console.log('❌ Could not read Prisma schema');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If MySQL is not running, start it with: ./setup-mysql.sh');
  console.log('2. Once MySQL is running, run: npm run db:push');
  console.log('3. Verify tables were created with: npm run db:generate');
}

checkStatus().catch(console.error);