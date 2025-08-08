const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing MySQL connection...');
    console.log('Host: 168.231.127.189');
    console.log('Port: 9897');
    console.log('User: admin');
    console.log('Database: dbcenter');
    
    const connection = await mysql.createConnection({
      host: '168.231.127.189',
      port: 9897,
      user: 'admin',
      password: '@Wad235rt',
      database: 'dbcenter'
    });
    
    console.log('✅ MySQL connection successful!');
    
    const [rows] = await connection.execute('SHOW DATABASES;');
    console.log('Available databases:', rows.map(row => row.Database));
    
    await connection.end();
  } catch (error) {
    console.error('❌ MySQL connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error number:', error.errno);
    console.error('SQL state:', error.sqlState);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 The MySQL server is not running or not accessible.');
      console.log('Please make sure:');
      console.log('1. MySQL server is running and accessible externally');
      console.log('2. The server is listening on port 9897');
      console.log('3. The user "admin" has proper permissions');
      console.log('4. The database "dbcenter" exists');
      console.log('5. Firewall allows external connections to port 9897');
    }
  }
}

testConnection();