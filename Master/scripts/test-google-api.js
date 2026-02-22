#!/usr/bin/env node

/**
 * Test script for Google Custom Search API
 * Tests the API connection and fetches sample jobs
 */

require('dotenv').config()

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID

if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
  console.error('❌ Error: Google API credentials not found in .env file')
  console.error('   Please add:')
  console.error('   GOOGLE_API_KEY=your_api_key')
  console.error('   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id')
  process.exit(1)
}

console.log('✅ Google API credentials found')
console.log(`   API Key: ${GOOGLE_API_KEY.substring(0, 10)}...`)
console.log(`   Search Engine ID: ${GOOGLE_SEARCH_ENGINE_ID.substring(0, 15)}...`)
console.log('')

// Test API call
const testQuery = 'software engineer jobs'
const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(testQuery)}&num=5`

console.log('🔍 Testing Google Custom Search API...')
console.log(`   Query: "${testQuery}"`)
console.log('')

fetch(url)
  .then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`)
    }
    return response.json()
  })
  .then((data) => {
    if (data.error) {
      console.error('❌ API Error:', data.error.message)
      if (data.error.code === 400) {
        console.error('   This usually means the Search Engine ID is incorrect')
      } else if (data.error.code === 403) {
        console.error('   This usually means the API key is invalid or Custom Search API is not enabled')
      }
      process.exit(1)
    }

    if (!data.items || data.items.length === 0) {
      console.log('⚠️  No results returned')
      console.log('   This might be normal if your search engine is new or has limited sites configured')
      process.exit(0)
    }

    console.log(`✅ Success! Found ${data.items.length} results`)
    console.log('')
    console.log('Sample results:')
    console.log('')
    
    data.items.slice(0, 3).forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`)
      console.log(`   Link: ${item.link}`)
      console.log(`   Snippet: ${item.snippet?.substring(0, 100)}...`)
      console.log('')
    })

    console.log('✅ Google API is working correctly!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Restart your Next.js server to pick up the credentials')
    console.log('2. Go to Jobs page → Fetch Jobs tab')
    console.log('3. Enter a search query and click Fetch')
  })
  .catch((error) => {
    console.error('❌ Error testing API:', error.message)
    if (error.message.includes('fetch')) {
      console.error('   Network error. Make sure you have internet connection.')
    }
    process.exit(1)
  })

