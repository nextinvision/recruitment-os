#!/usr/bin/env node

/**
 * Detailed API test to identify the exact issue
 */

require('dotenv').config();
const fetch = require('node-fetch');

const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

console.log('🔍 Detailed Google API Test');
console.log('=' .repeat(60));
console.log('');

if (!API_KEY || !SEARCH_ENGINE_ID) {
  console.error('❌ Credentials missing from .env');
  process.exit(1);
}

console.log('✅ Credentials found');
console.log(`   API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`   Search Engine ID: ${SEARCH_ENGINE_ID}`);
console.log('');

const query = 'software engineer jobs';
const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=3`;

console.log('📡 Making API request...');
console.log(`   URL: ${url.substring(0, 80)}...`);
console.log('');

fetch(url)
  .then(async res => {
    const data = await res.json();
    
    console.log(`📊 Response Status: ${res.status} ${res.statusText}`);
    console.log('');
    
    if (data.error) {
      console.error('❌ API Error Detected:');
      console.error(`   Code: ${data.error.code}`);
      console.error(`   Message: ${data.error.message}`);
      console.error('');
      
      if (data.error.code === 403) {
        if (data.error.message.includes('referer')) {
          console.error('🔧 Issue: API Key Restrictions');
          console.error('   → The API key still has referrer restrictions');
          console.error('   → Go to: https://console.cloud.google.com/apis/credentials');
          console.error('   → Click your API key');
          console.error('   → Under "Application restrictions", select "None"');
          console.error('   → Click "Save"');
          console.error('   → Wait 2-3 minutes for changes to propagate');
        } else if (data.error.message.includes('access') || data.error.message.includes('not enabled')) {
          console.error('🔧 Issue: Custom Search API Not Enabled');
          console.error('   → The Custom Search API is not enabled for this project');
          console.error('   → Go to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com');
          console.error('   → Click "Enable" button');
          console.error('   → Wait for it to enable (takes a few seconds)');
        } else {
          console.error('🔧 Issue: API Key Permissions');
          console.error('   → Check API key restrictions in Google Cloud Console');
          console.error('   → Ensure Custom Search API is enabled');
        }
      }
      
      process.exit(1);
    }
    
    if (data.items && data.items.length > 0) {
      console.log('✅ SUCCESS! API is working correctly!');
      console.log('');
      console.log(`📋 Found ${data.items.length} results:`);
      console.log('');
      data.items.forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   ${item.link}`);
        console.log('');
      });
      console.log('✅ Everything is configured correctly!');
      console.log('✅ You can now use the fetch feature on your website!');
    } else {
      console.log('⚠️  API call succeeded but no results returned');
      console.log('   This might be normal if:');
      console.log('   - Your search engine is new');
      console.log('   - You haven\'t added many job sites yet');
      console.log('   - The search query doesn\'t match indexed content');
      console.log('');
      console.log('✅ API is working, but try a different query or add more sites');
    }
  })
  .catch(err => {
    console.error('❌ Network Error:', err.message);
    console.error('   Check your internet connection');
    process.exit(1);
  });

