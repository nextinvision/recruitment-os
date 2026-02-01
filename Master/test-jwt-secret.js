/**
 * Test script to check JWT_SECRET consistency
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('='.repeat(60));
console.log('🔍 JWT_SECRET Consistency Check');
console.log('='.repeat(60));
console.log('');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

console.log('JWT_SECRET from process.env:');
console.log(`  - Exists: ${!!process.env.JWT_SECRET}`);
console.log(`  - Length: ${JWT_SECRET.length}`);
console.log(`  - Value (first 20 chars): ${JWT_SECRET.substring(0, 20)}...`);
console.log('');

// Test token generation and verification with same secret
console.log('Testing token generation and verification...');
const testPayload = {
  userId: 'test-user-id',
  email: 'test@example.com',
  role: 'ADMIN'
};

try {
  // Generate token
  const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '7d' });
  console.log(`✅ Token generated (length: ${token.length})`);
  console.log('');

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token verified successfully!');
  console.log(`   Decoded: ${JSON.stringify(decoded, null, 2)}`);
  console.log('');

  // Test with different secret (should fail)
  console.log('Testing with wrong secret (should fail)...');
  try {
    jwt.verify(token, 'wrong-secret');
    console.error('❌ ERROR: Token verified with wrong secret!');
  } catch (error) {
    console.log('✅ Correctly rejected token with wrong secret');
    console.log(`   Error: ${error.message}`);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('✅ JWT_SECRET is consistent!');
  console.log('='.repeat(60));

} catch (error) {
  console.error('❌ Error:', error.message);
}

