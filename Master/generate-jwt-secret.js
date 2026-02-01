/**
 * Generate a secure JWT secret key
 * Run with: node generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a 64-byte (512-bit) random secret
const secret = crypto.randomBytes(64).toString('hex');

console.log('='.repeat(60));
console.log('🔐 Generated JWT Secret Key');
console.log('='.repeat(60));
console.log('');
console.log('Add this to your .env file:');
console.log('');
console.log(`JWT_SECRET="${secret}"`);
console.log('');
console.log('='.repeat(60));
console.log(`Length: ${secret.length} characters`);
console.log('='.repeat(60));

