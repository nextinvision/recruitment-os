#!/bin/bash

# Build script for Chrome Extension

echo "Building Chrome Extension..."

# Clean dist directory
rm -rf dist

# Build popup (React)
echo "Building popup..."
npm run build:popup

# Build background scripts
echo "Building background scripts..."
npm run build:background

# Build content scripts
echo "Building content scripts..."
npm run build:content

echo "Build complete! Files are in dist/ directory"

