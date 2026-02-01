/**
 * Test script to verify login flow and token verification
 * Run with: node test-login.js
 */

const jwt = require('jsonwebtoken');

// Use native fetch in Node.js 18+ or node-fetch for older versions
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (e) {
  console.error('❌ fetch is not available. Install node-fetch: npm install node-fetch@2');
  process.exit(1);
}

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Test credentials
const TEST_EMAIL = 'admin@recruitment.com';
const TEST_PASSWORD = 'admin123';

async function testLogin() {
  console.log('='.repeat(60));
  console.log('🔐 Testing Login Flow');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Login
    console.log('📤 Step 1: Sending login request...');
    console.log(`   URL: ${BASE_URL}/api/auth/login`);
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log('');

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    console.log(`   Status: ${loginResponse.status} ${loginResponse.statusText}`);
    console.log('');

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ Login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   User Role: ${loginData.user.role}`);
    console.log(`   Token length: ${loginData.token.length}`);
    console.log(`   Token (first 50 chars): ${loginData.token.substring(0, 50)}...`);
    console.log('');

    // Step 2: Verify Token
    console.log('🔍 Step 2: Verifying token...');
    console.log(`   JWT_SECRET exists: ${!!JWT_SECRET}`);
    console.log(`   JWT_SECRET length: ${JWT_SECRET.length}`);
    console.log(`   Token length: ${loginData.token.length}`);
    console.log('');

    try {
      const decoded = jwt.verify(loginData.token, JWT_SECRET);
      console.log('✅ Token verified successfully!');
      console.log('   Decoded payload:');
      console.log(`     - userId: ${decoded.userId}`);
      console.log(`     - email: ${decoded.email}`);
      console.log(`     - role: ${decoded.role}`);
      console.log('');
    } catch (error) {
      console.error('❌ Token verification failed!');
      console.error(`   Error type: ${error.name}`);
      console.error(`   Error message: ${error.message}`);
      
      if (error instanceof jwt.JsonWebTokenError) {
        console.error('   This is a JWT error - token format or signature is invalid');
      } else if (error instanceof jwt.TokenExpiredError) {
        console.error(`   Token expired at: ${error.expiredAt}`);
      } else if (error instanceof jwt.NotBeforeError) {
        console.error(`   Token not active until: ${error.date}`);
      }
      console.log('');
      return;
    }

    // Step 3: Test token extraction
    console.log('🔍 Step 3: Testing token extraction from header...');
    const authHeader = `Bearer ${loginData.token}`;
    console.log(`   Auth header (first 50 chars): ${authHeader.substring(0, 50)}...`);
    
    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Auth header does not start with "Bearer "');
      return;
    }
    
    const extractedToken = authHeader.substring(7);
    console.log(`   Extracted token length: ${extractedToken.length}`);
    console.log(`   Tokens match: ${extractedToken === loginData.token}`);
    console.log('');

    // Step 4: Verify extracted token
    console.log('🔍 Step 4: Verifying extracted token...');
    try {
      const decodedExtracted = jwt.verify(extractedToken, JWT_SECRET);
      console.log('✅ Extracted token verified successfully!');
      console.log(`   User ID: ${decodedExtracted.userId}`);
      console.log('');
    } catch (error) {
      console.error('❌ Extracted token verification failed!');
      console.error(`   Error: ${error.message}`);
      console.log('');
      return;
    }

    // Step 5: Test with /api/auth/me endpoint
    console.log('🔍 Step 5: Testing /api/auth/me endpoint...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${meResponse.status} ${meResponse.statusText}`);
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /api/auth/me successful!');
      console.log(`   User: ${meData.firstName} ${meData.lastName}`);
      console.log(`   Email: ${meData.email}`);
      console.log(`   Role: ${meData.role}`);
      console.log('');
    } else {
      const error = await meResponse.json();
      console.error('❌ /api/auth/me failed:', error);
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLogin();

