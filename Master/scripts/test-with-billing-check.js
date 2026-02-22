#!/usr/bin/env node

/**
 * Test API with billing/quota check
 * Sometimes APIs require billing to be enabled
 */

require('dotenv').config();
const fetch = require('node-fetch');

const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

console.log('🔍 Testing Google Custom Search API');
console.log('Checking for billing/quota issues...');
console.log('');

const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=software+engineer+jobs&num=3`;

fetch(url)
  .then(async res => {
    const data = await res.json();
    
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log('');
    
    if (data.error) {
      console.log('❌ Error Response:');
      console.log(JSON.stringify(data.error, null, 2));
      console.log('');
      
      // Check for specific error types
      if (data.error.message.includes('billing') || data.error.message.includes('quota')) {
        console.log('🔧 Issue: Billing or Quota');
        console.log('   Custom Search API might require billing to be enabled');
        console.log('   Go to: https://console.cloud.google.com/billing');
        console.log('   Make sure billing is enabled for your project');
      } else if (data.error.message.includes('not enabled') || data.error.message.includes('does not have')) {
        console.log('🔧 Issue: API Still Not Enabled');
        console.log('   Even though you enabled it, it might not be active yet');
        console.log('   Try:');
        console.log('   1. Wait 5-10 minutes');
        console.log('   2. Disable and re-enable the API');
        console.log('   3. Check: https://console.cloud.google.com/apis/dashboard');
        console.log('      Look for "Custom Search API" in enabled APIs');
      } else if (data.error.message.includes('referer') || data.error.message.includes('blocked')) {
        console.log('🔧 Issue: API Key Restrictions');
        console.log('   Restrictions might still be blocking requests');
        console.log('   Double-check:');
        console.log('   - Application restrictions: None');
        console.log('   - API restrictions: Custom Search API selected');
        console.log('   - Click Save and wait 2-3 minutes');
      }
    } else if (data.items) {
      console.log('✅ SUCCESS! API is working!');
      console.log(`Found ${data.items.length} results`);
      console.log('');
      data.items.forEach((item, i) => {
        console.log(`${i+1}. ${item.title}`);
      });
    } else {
      console.log('⚠️  No error but also no results');
      console.log('   This might be normal if search engine is new');
    }
  })
  .catch(err => {
    console.error('Network error:', err.message);
  });


