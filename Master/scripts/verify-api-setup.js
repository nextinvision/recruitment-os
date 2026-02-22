#!/usr/bin/env node

/**
 * Comprehensive API verification script
 * Checks API key, project, and restrictions
 */

require('dotenv').config();
const fetch = require('node-fetch');

const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

console.log('🔍 Comprehensive Google API Verification');
console.log('=' .repeat(70));
console.log('');

if (!API_KEY || !SEARCH_ENGINE_ID) {
  console.error('❌ Credentials missing from .env');
  process.exit(1);
}

console.log('✅ Credentials found in .env');
console.log(`   API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`   Search Engine ID: ${SEARCH_ENGINE_ID}`);
console.log('');

// Test 1: Check if API key is valid (try a simple API call)
console.log('Test 1: Validating API Key...');
const testUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=test&num=1`;

fetch(testUrl)
  .then(async res => {
    const data = await res.json();
    
    console.log(`   Status: ${res.status} ${res.statusText}`);
    
    if (data.error) {
      console.log('');
      console.log('❌ API Error Detected:');
      console.log(`   Code: ${data.error.code}`);
      console.log(`   Message: ${data.error.message}`);
      console.log('');
      
      if (data.error.code === 403) {
        if (data.error.message.includes('does not have the access') || 
            data.error.message.includes('not enabled')) {
          console.log('🔧 Issue: Custom Search API Not Enabled');
          console.log('');
          console.log('   The API key exists but Custom Search API is not enabled');
          console.log('   for the project this API key belongs to.');
          console.log('');
          console.log('   Steps to fix:');
          console.log('   1. Go to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com');
          console.log('   2. Make sure you\'re in the CORRECT project (check top bar)');
          console.log('   3. Click "Enable" button');
          console.log('   4. Wait for confirmation');
          console.log('');
          console.log('   OR: The API key might belong to a different project.');
          console.log('   Check: https://console.cloud.google.com/apis/credentials');
          console.log('   Find your API key and note which project it belongs to.');
          console.log('   Then enable Custom Search API in THAT project.');
        } else if (data.error.message.includes('referer') || 
                   data.error.message.includes('blocked')) {
          console.log('🔧 Issue: API Key Restrictions');
          console.log('');
          console.log('   The API key has restrictions blocking server-side requests.');
          console.log('');
          console.log('   Steps to fix:');
          console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
          console.log('   2. Click on your API key');
          console.log('   3. Under "Application restrictions":');
          console.log('      - Select "None" (for server-side use), OR');
          console.log('      - Select "IP addresses" and add: 88.222.245.158');
          console.log('   4. Under "API restrictions":');
          console.log('      - Select "Restrict key"');
          console.log('      - Check "Custom Search API"');
          console.log('   5. Click "Save"');
          console.log('   6. Wait 2-3 minutes for changes to propagate');
        } else {
          console.log('🔧 Issue: API Key Configuration');
          console.log('   Check API key restrictions and project settings');
        }
      } else if (data.error.code === 400) {
        console.log('🔧 Issue: Invalid Request');
        console.log('   Check Search Engine ID is correct');
      }
      
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   1. Verify API is enabled in the correct project');
      console.log('   2. Check API key restrictions');
      console.log('   3. Wait a few minutes after making changes');
      console.log('   4. Test again');
      
      process.exit(1);
    }
    
    if (data.items && data.items.length > 0) {
      console.log('');
      console.log('✅ SUCCESS! API is working correctly!');
      console.log('');
      console.log(`   Found ${data.items.length} result(s)`);
      console.log(`   Sample: ${data.items[0].title}`);
      console.log('');
      console.log('✅ Everything is configured correctly!');
      console.log('✅ You can now use the fetch feature on your website!');
      console.log('');
      console.log('📋 Test on website:');
      console.log('   1. Go to: https://careeristpro.cloud/jobs');
      console.log('   2. Click "Fetch Jobs" tab');
      console.log('   3. Enter query and click "Fetch"');
    } else {
      console.log('');
      console.log('⚠️  API call succeeded but no results');
      console.log('   This is OK - your search engine might be new');
      console.log('   or have limited sites configured');
      console.log('');
      console.log('✅ API is working! Try adding more job sites to your search engine.');
    }
  })
  .catch(err => {
    console.error('❌ Network Error:', err.message);
    console.error('   Check your internet connection');
    process.exit(1);
  });


