#!/bin/bash

# Production Build Script for Recruitment OS Extension
# Usage: ./build-production.sh https://api.yourdomain.com

set -e

API_URL="${1:-https://api.yourdomain.com}"

if [ -z "$1" ]; then
  echo "Usage: ./build-production.sh <API_URL>"
  echo "Example: ./build-production.sh https://api.yourdomain.com"
  exit 1
fi

echo "Building extension for production with API URL: $API_URL"

# Update constants.ts with production URL (both async and sync versions)
sed -i.bak "s|const buildTimeUrl = '.*'|const buildTimeUrl = '$API_URL'|g" src/shared/constants.ts
sed -i.bak "s|return 'http://localhost:3000'|return '$API_URL'|g" src/shared/constants.ts

# Build the extension
npm run build

# Restore original file
mv src/shared/constants.ts.bak src/shared/constants.ts

echo "Build complete! Extension is ready in dist/ directory"
echo "Package it with: zip -r recruitment-os-extension.zip dist/ manifest.json icons/"

