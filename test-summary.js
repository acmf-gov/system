const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function runCompleteTest() {
  console.log('🚤 Barca Coletiva - Complete System Test');
  console.log('======================================\n');
  
  const testResults = {
    database: false,
    authentication: false,
    userManagement: false,
    productManagement: false,
    addressManagement: false,
    bargeManagement: false,
    orderManagement: false,
    overall: false
  };
  
  try {
    // Test 1: Database Connection
    console.log('🔍 Test 1: Database Connection');
    console.log('================================');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    testResults.database = true;
    
    // Test 2: Authentication System
    console.log('\n🔐 Test 2: Authentication System');
    console.log('==================================');
    const admin = await prisma.user.findUnique({
      where: { phone: 'admin' }
    });
    
    if (admin) {
      const isPasswordValid = await bcrypt.compare('@Wad235rt', admin.password);
      if (isPasswordValid) {
        console.log('✅ Admin authentication working');
        testResults.authentication = true;
      } else {
        console.log('❌ Admin password validation failed');
      }
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Test 3: User Management
    console.log('\n👤 Test 3: User Management');
    console.log('============================');
    const testUser = await prisma.user.create({
      data: {
        phone: 'test' + Date.now(),
        password: await bcrypt.hash('test123', 10),
        name: 'Test User',
        email: 'test@example.com',
        isVerified: true,
        isAdmin: false,
        isActive: true,
      }
    });
    
    const foundUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    
    if (foundUser) {
      console.log('✅ User creation and retrieval working');
      testResults.userManagement = true;
    } else {
      console.log('❌ User management failed');
    }
    
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    
    // Test 4: Product Management
    console.log('\n📦 Test 4: Product Management');
    console.log('===============================');
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test description',
        type: 'gelo',
        pricePerGram: 10.50,
        stock: 1000,
        isActive: true,
      }
    });
    
    const foundProduct = await prisma.product.findUnique({
      where: { id: testProduct.id }
    });
    
    if (foundProduct) {
      console.log('✅ Product creation and retrieval working');
      testResults.productManagement = true;
    } else {
      console.log('❌ Product management failed');
    }
    
    await prisma.product.delete({
      where: { id: testProduct.id }
    });
    
    // Test 5: Address Management
    console.log('\n🏠 Test 5: Address Management');
    console.log('===============================');
    const testAddress = await prisma.address.create({
      data: {
        userId: admin.id,
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345-678',
        isDefault: true,
      }
    });
    
    const foundAddress = await prisma.address.findUnique({
      where: { id: testAddress.id }
    });
    
    if (foundAddress) {
      console.log('✅ Address creation and retrieval working');
      testResults.addressManagement = true;
    } else {
      console.log('❌ Address management failed');
    }
    
    await prisma.address.delete({
      where: { id: testAddress.id }
    });
    
    // Test 6: Barge Management
    console.log('\n🚤 Test 6: Barge Management');
    console.log('============================');
    const testBarge = await prisma.barge.create({
      data: {
        name: 'Test Barge',
        description: 'Test barge description',
        targetGrams: 1000,
        currentGrams: 0,
        pricePerGram: 10.50,
        status: 'active',
        startDate: new Date(),
      }
    });
    
    const foundBarge = await prisma.barge.findUnique({
      where: { id: testBarge.id }
    });
    
    if (foundBarge) {
      console.log('✅ Barge creation and retrieval working');
      testResults.bargeManagement = true;
    } else {
      console.log('❌ Barge management failed');
    }
    
    await prisma.barge.delete({
      where: { id: testBarge.id }
    });
    
    // Test 7: Order Management
    console.log('\n📋 Test 7: Order Management');
    console.log('============================');
    const testBargeForOrder = await prisma.barge.create({
      data: {
        name: 'Test Barge for Order',
        description: 'Test barge for order',
        targetGrams: 1000,
        currentGrams: 0,
        pricePerGram: 10.50,
        status: 'active',
        startDate: new Date(),
      }
    });
    
    const testAddressForOrder = await prisma.address.create({
      data: {
        userId: admin.id,
        street: 'Test Street for Order',
        number: '456',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345-678',
        isDefault: true,
      }
    });
    
    const testOrder = await prisma.order.create({
      data: {
        userId: admin.id,
        bargeId: testBargeForOrder.id,
        addressId: testAddressForOrder.id,
        totalGrams: 100,
        totalPrice: 1050.00,
        status: 'pending',
      }
    });
    
    const foundOrder = await prisma.order.findUnique({
      where: { id: testOrder.id }
    });
    
    if (foundOrder) {
      console.log('✅ Order creation and retrieval working');
      testResults.orderManagement = true;
    } else {
      console.log('❌ Order management failed');
    }
    
    // Clean up
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    await prisma.barge.delete({
      where: { id: testBargeForOrder.id }
    });
    await prisma.address.delete({
      where: { id: testAddressForOrder.id }
    });
    
    await prisma.$disconnect();
    
    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    Object.entries(testResults).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      const testName = test.charAt(0).toUpperCase() + test.slice(1).replace(/([A-Z])/g, ' $1');
      console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ System is ready for VPS deployment!');
      testResults.overall = true;
    } else {
      console.log('\n⚠️ Some tests failed. Review the results above.');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    await prisma.$disconnect();
    return testResults;
  }
}

// Run the test
runCompleteTest().then((results) => {
  console.log('\n🚀 Test execution completed');
  process.exit(results.overall ? 0 : 1);
}).catch((error) => {
  console.error('💥 Test runner crashed:', error.message);
  process.exit(1);
});