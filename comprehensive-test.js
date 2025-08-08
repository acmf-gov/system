#!/usr/bin/env node

// 🚤 Barca Coletiva - Comprehensive System Test
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const testResults = [];

// Test utility functions
function logTest(testName, passed, details = '') {
  const result = {
    test: testName,
    status: passed ? '✅ PASS' : '❌ FAIL',
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  console.log(`${result.status} ${testName}${details ? ' - ' + details : ''}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    logTest('Health Check', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    logTest('Health Check', false, error.message);
  }
}

async function testLogin() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: {
        phone: 'admin',
        password: '@Wad235rt'
      }
    });
    
    const passed = response.status === 200 && response.data.user && response.data.token;
    logTest('User Login', passed, `Status: ${response.status}`);
    
    if (passed) {
      global.authToken = response.data.token;
      global.userId = response.data.user.id;
    }
  } catch (error) {
    logTest('User Login', false, error.message);
  }
}

async function testGetBarges() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/barges`);
    logTest('Get Barges', response.status === 200, `Status: ${response.status}, Count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
  } catch (error) {
    logTest('Get Barges', false, error.message);
  }
}

async function testCreateBarge() {
  try {
    const bargeData = {
      name: `Test Barge ${Date.now()}`,
      description: 'Test barge created by automated test',
      targetGrams: 1000,
      pricePerGram: 65.50
    };
    
    const response = await makeRequest(`${BASE_URL}/api/barges`, {
      method: 'POST',
      body: bargeData
    });
    
    const passed = response.status === 201 && response.data.id;
    logTest('Create Barge', passed, `Status: ${response.status}, ID: ${response.data.id || 'N/A'}`);
    
    if (passed) {
      global.testBargeId = response.data.id;
    }
  } catch (error) {
    logTest('Create Barge', false, error.message);
  }
}

async function testGetAddresses() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/addresses`);
    logTest('Get Addresses', response.status === 200, `Status: ${response.status}, Count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
  } catch (error) {
    logTest('Get Addresses', false, error.message);
  }
}

async function testCreateAddress() {
  try {
    const addressData = {
      street: 'Rua Teste Automatizado',
      number: '123',
      neighborhood: 'Bairro Teste',
      city: 'Cidade Teste',
      state: 'SP',
      zipCode: '12345-678'
    };
    
    const response = await makeRequest(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      body: addressData
    });
    
    const passed = response.status === 201 && response.data.id;
    logTest('Create Address', passed, `Status: ${response.status}, ID: ${response.data.id || 'N/A'}`);
    
    if (passed) {
      global.testAddressId = response.data.id;
    }
  } catch (error) {
    logTest('Create Address', false, error.message);
  }
}

async function testGetChatRooms() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/chat/rooms`);
    logTest('Get Chat Rooms', response.status === 200, `Status: ${response.status}, Count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
  } catch (error) {
    logTest('Get Chat Rooms', false, error.message);
  }
}

async function testCreateChatRoom() {
  try {
    const roomData = {
      name: `Test Room ${Date.now()}`,
      description: 'Test chat room created by automated test'
    };
    
    const response = await makeRequest(`${BASE_URL}/api/chat/rooms`, {
      method: 'POST',
      body: roomData
    });
    
    const passed = response.status === 201 && response.data.id;
    logTest('Create Chat Room', passed, `Status: ${response.status}, ID: ${response.data.id || 'N/A'}`);
    
    if (passed) {
      global.testChatRoomId = response.data.id;
    }
  } catch (error) {
    logTest('Create Chat Room', false, error.message);
  }
}

async function testMainPage() {
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    const passed = response.status === 200 && typeof response.data === 'string' && response.data.includes('Barca Coletiva');
    logTest('Main Page', passed, `Status: ${response.status}`);
  } catch (error) {
    logTest('Main Page', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚤 Iniciando testes completos do Barca Coletiva...');
  console.log('📋 Base URL:', BASE_URL);
  console.log('='.repeat(50));
  
  // Run all tests
  await testHealthCheck();
  await testLogin();
  await testGetBarges();
  await testCreateBarge();
  await testGetAddresses();
  await testCreateAddress();
  await testGetChatRooms();
  await testCreateChatRoom();
  await testMainPage();
  
  // Summary
  console.log('='.repeat(50));
  console.log('📊 RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  
  const passed = testResults.filter(r => r.status.includes('PASS')).length;
  const failed = testResults.filter(r => r.status.includes('FAIL')).length;
  const total = testResults.length;
  
  console.log(`✅ Testes passados: ${passed}`);
  console.log(`❌ Testes falhos: ${failed}`);
  console.log(`📊 Total de testes: ${total}`);
  console.log(`🎯 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ DETALHES DOS FALHOS:');
    testResults.filter(r => r.status.includes('FAIL')).forEach(result => {
      console.log(`  - ${result.test}: ${result.details}`);
    });
  }
  
  console.log('\n🎉 Testes concluídos!');
  
  // Save results to file
  const fs = require('fs');
  const reportPath = '/home/z/my-project/test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      passed,
      failed,
      total,
      successRate: ((passed / total) * 100).toFixed(1)
    },
    results: testResults,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`📄 Relatório salvo em: ${reportPath}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Start testing
runAllTests().catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});