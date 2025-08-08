// 🚤 Teste de API - Barca Coletiva
const http = require('http');

// Testar login
function testLogin() {
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
    console.log('Headers:', res.headers);

    res.setEncoding('utf8');
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('Response:', parsedData);
      } catch (error) {
        console.log('Raw Response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Problem with request:', e.message);
  });

  // Write data to request body
  req.write(postData);
  req.end();
}

// Testar registro
function testRegister() {
  const postData = JSON.stringify({
    phone: '5534988888888',
    password: 'test456',
    name: 'Usuário API Teste'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    res.setEncoding('utf8');
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('Response:', parsedData);
      } catch (error) {
        console.log('Raw Response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Problem with request:', e.message);
  });

  // Write data to request body
  req.write(postData);
  req.end();
}

// Testar health check
function testHealth() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    res.setEncoding('utf8');
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('Response:', parsedData);
      } catch (error) {
        console.log('Raw Response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Problem with request:', e.message);
  });

  req.end();
}

// Executar testes
console.log('🚤 Testando API do Barca Coletiva...\n');

console.log('1️⃣ Testando Health Check...');
testHealth();

setTimeout(() => {
  console.log('\n2️⃣ Testando Login...');
  testLogin();
}, 1000);

setTimeout(() => {
  console.log('\n3️⃣ Testando Registro...');
  testRegister();
}, 2000);