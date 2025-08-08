// 🚤 Testar Usuários Migrados - Barca Coletiva
const http = require('http');

// Testar login com usuário admin
function testAdminLogin() {
  const postData = JSON.stringify({
    phone: 'admin',
    password: '@Wad235rt'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);

    res.setEncoding('utf8');
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('✅ Admin Login Response:', parsedData.message);
        console.log('   User:', parsedData.user.phone, '(Admin:', parsedData.user.isAdmin + ')');
      } catch (error) {
        console.log('❌ Admin Login Error:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Admin Login Request Error:', e.message);
  });

  req.write(postData);
  req.end();
}

// Testar login com usuário migrado (formato antigo)
function testMigratedUserLogin() {
  const postData = JSON.stringify({
    phone: '5534999999999',
    password: 'test123'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);

    res.setEncoding('utf8');
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('✅ Migrated User Login Response:', parsedData.message);
        console.log('   User:', parsedData.user.phone, '(Active:', parsedData.user.isActive + ')');
      } catch (error) {
        console.log('❌ Migrated User Login Error:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Migrated User Login Request Error:', e.message);
  });

  req.write(postData);
  req.end();
}

// Testar login com usuário recém-criado
function testNewUserLogin() {
  const postData = JSON.stringify({
    phone: '5534988888888',
    password: 'test456'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);

    res.setEncoding('utf8');
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('✅ New User Login Response:', parsedData.message);
        console.log('   User:', parsedData.user.phone, '(Active:', parsedData.user.isActive + ')');
      } catch (error) {
        console.log('❌ New User Login Error:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ New User Login Request Error:', e.message);
  });

  req.write(postData);
  req.end();
}

// Testar login com senha incorreta
function testWrongPassword() {
  const postData = JSON.stringify({
    phone: '5534999999999',
    password: 'wrongpassword'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);

    res.setEncoding('utf8');
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('✅ Wrong Password Test Response:', parsedData.error);
      } catch (error) {
        console.log('❌ Wrong Password Test Error:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Wrong Password Test Request Error:', e.message);
  });

  req.write(postData);
  req.end();
}

// Testar login com usuário inexistente
function testNonExistentUser() {
  const postData = JSON.stringify({
    phone: '5534111111111',
    password: 'anypassword'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);

    res.setEncoding('utf8');
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('✅ Non-existent User Test Response:', parsedData.error);
      } catch (error) {
        console.log('❌ Non-existent User Test Error:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Non-existent User Test Request Error:', e.message);
  });

  req.write(postData);
  req.end();
}

// Executar testes
console.log('🚤 Testando usuários migrados...\n');

console.log('1️⃣ Testando login do Admin (usuário migrado)...');
testAdminLogin();

setTimeout(() => {
  console.log('\n2️⃣ Testando login de usuário migrado (formato antigo)...');
  testMigratedUserLogin();
}, 1000);

setTimeout(() => {
  console.log('\n3️⃣ Testando login de usuário novo (formato novo)...');
  testNewUserLogin();
}, 2000);

setTimeout(() => {
  console.log('\n4️⃣ Testando login com senha incorreta...');
  testWrongPassword();
}, 3000);

setTimeout(() => {
  console.log('\n5️⃣ Testando login com usuário inexistente...');
  testNonExistentUser();
}, 4000);

setTimeout(() => {
  console.log('\n🎉 Testes concluídos!');
}, 5000);