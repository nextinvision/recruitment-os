#!/bin/bash
# Bash script to fix Prisma DLL lock issues on Unix systems
# This script kills Node.js processes and cleans up Prisma client

echo "🔍 Checking for running Node.js processes..."

# Find all Node.js processes
NODE_PIDS=$(pgrep -f node || true)

if [ -n "$NODE_PIDS" ]; then
    echo "⚠️  Found Node.js process(es) running"
    echo "🛑 Stopping Node.js processes..."
    
    echo "$NODE_PIDS" | while read -r pid; do
        echo "   Stopping process: $pid"
        kill -9 "$pid" 2>/dev/null || true
    done
    
    # Wait a bit for processes to fully terminate
    sleep 2
    echo "✅ Node.js processes stopped"
else
    echo "✅ No Node.js processes found"
fi

echo "🧹 Cleaning up Prisma client..."

# Remove Prisma client directory
PRISMA_CLIENT_PATH="node_modules/.prisma"
if [ -d "$PRISMA_CLIENT_PATH" ]; then
    rm -rf "$PRISMA_CLIENT_PATH"
    echo "✅ Prisma client directory removed"
else
    echo "ℹ️  Prisma client directory not found (already clean)"
fi

echo "✨ Cleanup complete! You can now run: npm run db:generate"

