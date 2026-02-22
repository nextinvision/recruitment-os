#!/bin/bash
# Fix permissions for Next.js static files
# This ensures files are readable by the web server

cd /root/recruitment-os/Master

if [ -d ".next/static" ]; then
    # Set directory permissions
    find .next/static -type d -exec chmod 755 {} \;
    
    # Set file permissions
    find .next/static -type f -exec chmod 644 {} \;
    
    echo "Permissions fixed for .next/static directory"
else
    echo ".next/static directory not found"
fi

