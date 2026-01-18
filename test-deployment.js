// test-deployment.js - Comprehensive Testing Script for Tanzify AI
// Run with: node test-deployment.js

const https = require('https');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://yourdomain.com';
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend.railway.app';

console.log('🚀 Starting Tanzify AI Deployment Tests...\n');

// Test 1: Frontend Loading
function testFrontend() {
  return new Promise((resolve) => {
    console.log('Testing frontend loading...');
    https.get(FRONTEND_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && data.includes('Tanzify AI')) {
          console.log('✅ Frontend: PASS - App loads successfully');
          resolve(true);
        } else {
          console.log('❌ Frontend: FAIL - App not loading properly');
          console.log(`   Status: ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Frontend: FAIL - Cannot connect');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
  });
}

// Test 2: Backend Health
function testBackend() {
  return new Promise((resolve) => {
    console.log('Testing backend health...');
    https.get(`${BACKEND_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Backend: PASS - Health check OK');
        resolve(true);
      } else {
        console.log('❌ Backend: FAIL - Health check failed');
        console.log(`   Status: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Backend: FAIL - Cannot connect');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
  });
}

// Test 3: API Endpoints
async function testAPI() {
  console.log('Testing API endpoints...');
  const endpoints = [
    { path: '/health', description: 'Health Check' },
    { path: '/api/health', description: 'API Health' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint.path}`);
      if (response.ok) {
        console.log(`✅ API ${endpoint.description}: PASS`);
      } else {
        console.log(`❌ API ${endpoint.description}: FAIL - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ API ${endpoint.description}: FAIL - ${error.message}`);
    }
  }
}

// Test 4: Database Connection
function testDatabase() {
  return new Promise((resolve) => {
    console.log('Testing database connection...');
    https.get(`${BACKEND_URL}/api/test-db`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Database: PASS - Connection OK');
          resolve(true);
        } else {
          console.log('❌ Database: FAIL - Connection failed');
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Database: FAIL - Cannot connect');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
  });
}

// Test 5: Environment Variables Check
function testEnvironment() {
  console.log('Checking environment variables...');
  const required = [
    'FRONTEND_URL',
    'BACKEND_URL'
  ];

  let allPresent = true;
  for (const env of required) {
    if (process.env[env]) {
      console.log(`✅ ${env}: Set`);
    } else {
      console.log(`❌ ${env}: Missing`);
      allPresent = false;
    }
  }

  return allPresent;
}

// Test 6: Payment Integration (Basic)
function testPayments() {
  console.log('\n💳 PAYMENT TESTING (Manual):');
  console.log('   📋 Stripe Test Card: 4242 4242 4242 4242');
  console.log('   📋 Razorpay: Use test mode credentials');
  console.log('   🔗 Test URLs:');
  console.log(`      - Frontend: ${FRONTEND_URL}/pricing`);
  console.log('   ✅ Check: Payment success page loads');
  console.log('   ✅ Check: Webhook events received');
}

// Test 7: File Upload (Basic)
function testFileUpload() {
  console.log('\n📁 FILE UPLOAD TESTING (Manual):');
  console.log('   📋 Test File: Small audio file (< 5MB)');
  console.log('   🔗 Upload URL: Frontend upload page');
  console.log('   ✅ Check: File uploads successfully');
  console.log('   ✅ Check: Progress bar works');
  console.log('   ✅ Check: File appears in S3 bucket');
  console.log('   ✅ Check: Transcription starts');
}

// Test 8: Email Service
function testEmail() {
  console.log('\n📧 EMAIL TESTING (Manual):');
  console.log('   📋 Test Scenarios:');
  console.log('      - User registration');
  console.log('      - Payment confirmation');
  console.log('      - Transcription complete');
  console.log('   ✅ Check: Emails are delivered');
  console.log('   ✅ Check: Emails are not in spam');
  console.log('   ✅ Check: Email content is correct');
}

// Test 9: User Authentication
function testAuth() {
  console.log('\n🔐 AUTHENTICATION TESTING (Manual):');
  console.log('   📋 Test Flows:');
  console.log('      - User registration');
  console.log('      - User login');
  console.log('      - Password reset');
  console.log('      - Protected routes');
  console.log('   ✅ Check: Firebase auth works');
  console.log('   ✅ Check: User data saves to Supabase');
}

// Test 10: Performance Check
function testPerformance() {
  return new Promise((resolve) => {
    console.log('Testing performance...');
    const start = Date.now();

    https.get(FRONTEND_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const loadTime = Date.now() - start;
        if (loadTime < 3000) { // 3 seconds
          console.log(`✅ Performance: PASS - ${loadTime}ms load time`);
        } else {
          console.log(`⚠️  Performance: SLOW - ${loadTime}ms load time`);
        }
        resolve(true);
      });
    }).on('error', () => {
      console.log('❌ Performance: FAIL - Cannot measure');
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 TANZIFY AI DEPLOYMENT TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('='.repeat(60));

  // Automated tests
  console.log('\n🔍 AUTOMATED TESTS:');
  await testFrontend();
  await testBackend();
  await testDatabase();
  await testAPI();
  await testPerformance();
  testEnvironment();

  // Manual tests
  console.log('\n📋 MANUAL TESTS REQUIRED:');
  testPayments();
  testFileUpload();
  testEmail();
  testAuth();

  console.log('\n' + '='.repeat(60));
  console.log('✅ AUTOMATED TESTS COMPLETE');
  console.log('📝 Complete the manual tests above');
  console.log('🎯 If all tests pass, your app is ready for production!');
  console.log('='.repeat(60));

  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('Run this script after deployment:');
  console.log('node test-deployment.js');
  console.log('\nSet environment variables:');
  console.log('export FRONTEND_URL=https://yourdomain.com');
  console.log('export BACKEND_URL=https://your-backend.railway.app');
}

// Export for use in other scripts
module.exports = { runTests };

if (require.main === module) {
  runTests().catch(console.error);
}