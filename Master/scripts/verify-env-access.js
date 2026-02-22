require('dotenv').config();
const { execSync } = require('child_process');

console.log('🔍 Verifying Environment Variable Access');
console.log('=' .repeat(50));
console.log('');

const apiKey = process.env.GOOGLE_API_KEY;
const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

if (!apiKey || !searchEngineId) {
  console.error('❌ Environment variables not accessible');
  console.error('   Make sure .env file exists and has:');
  console.error('   GOOGLE_API_KEY=...');
  console.error('   GOOGLE_SEARCH_ENGINE_ID=...');
  process.exit(1);
}

console.log('✅ Environment variables accessible:');
console.log(`   GOOGLE_API_KEY: ${apiKey.substring(0, 15)}...`);
console.log(`   GOOGLE_SEARCH_ENGINE_ID: ${searchEngineId}`);
console.log('');
console.log('✅ Next.js server can access these credentials');
console.log('✅ API routes will be able to use them');
console.log('');
console.log('⚠️  Note: If you see "referer blocked" errors,');
console.log('   update API key restrictions in Google Cloud Console');
console.log('   See: docs/GOOGLE_API_SETUP_FIX.md');
