#!/bin/bash

# Google Custom Search Engine Setup Helper Script
# This script helps verify your Google Search API setup

echo "=========================================="
echo "Google Custom Search Engine Setup Checker"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file first."
    exit 1
fi

# Load environment variables
source .env 2>/dev/null || true

# Check for Google API Key
echo "Checking Google API credentials..."
echo ""

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ GOOGLE_API_KEY not found in .env"
    echo "   Please add: GOOGLE_API_KEY=your_api_key"
else
    echo "✅ GOOGLE_API_KEY is set"
fi

if [ -z "$GOOGLE_SEARCH_ENGINE_ID" ]; then
    echo "❌ GOOGLE_SEARCH_ENGINE_ID not found in .env"
    echo "   Please add: GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id"
else
    echo "✅ GOOGLE_SEARCH_ENGINE_ID is set"
fi

echo ""
echo "=========================================="
echo "Testing API Connection..."
echo "=========================================="
echo ""

if [ -z "$GOOGLE_API_KEY" ] || [ -z "$GOOGLE_SEARCH_ENGINE_ID" ]; then
    echo "⚠️  Cannot test - credentials missing"
    exit 1
fi

# Test API call
TEST_QUERY="software engineer jobs"
echo "Testing with query: '$TEST_QUERY'"
echo ""

RESPONSE=$(curl -s "https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${TEST_QUERY}&num=1" 2>&1)

if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ API Error:"
    echo "$RESPONSE" | grep -o '"message":"[^"]*"' | head -1
    echo ""
    echo "Common issues:"
    echo "  - API key is invalid"
    echo "  - Custom Search API not enabled"
    echo "  - Search Engine ID is incorrect"
    echo "  - API key restrictions blocking the request"
else
    echo "✅ API connection successful!"
    echo ""
    echo "Sample result:"
    echo "$RESPONSE" | grep -o '"title":"[^"]*"' | head -1
    echo "$RESPONSE" | grep -o '"link":"[^"]*"' | head -1
fi

echo ""
echo "=========================================="
echo "Setup Instructions:"
echo "=========================================="
echo ""
echo "1. Go to: https://programmablesearchengine.google.com/"
echo "2. Create a new search engine"
echo "3. Add job sites (see docs/GOOGLE_SEARCH_ENGINE_SETUP.md)"
echo "4. Get your Search Engine ID"
echo "5. Enable Custom Search API in Google Cloud Console"
echo "6. Create an API key"
echo "7. Add both to .env file"
echo ""
echo "For detailed instructions, see:"
echo "  - docs/GOOGLE_SEARCH_ENGINE_SETUP.md"
echo "  - docs/GOOGLE_JOB_API_INTEGRATION.md"
echo ""

