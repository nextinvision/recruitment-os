#!/bin/bash

# Test the job fetch API endpoint
# This simulates what the frontend does

echo "Testing Job Fetch API Endpoint..."
echo ""

# Get a test token (you'll need to replace this with an actual token from login)
# For now, we'll test without auth to see if the endpoint is accessible

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "⚠️  Could not get auth token. Testing endpoint structure..."
  echo ""
fi

echo "Testing POST /api/jobs/fetch..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/jobs/fetch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN:-test}" \
  -d '{
    "query": "software engineer",
    "location": "",
    "source": "GOOGLE",
    "limit": 5
  }')

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "success"; then
  echo "✅ API endpoint is working!"
else
  echo "⚠️  Check the response above for errors"
fi

