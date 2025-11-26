#!/bin/bash

# Enterprise AI Assistant - Desktop App Launcher
# This script builds and runs the desktop application

echo "════════════════════════════════════════════════════════"
echo "  Enterprise AI Assistant - Native Desktop Application"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Building the desktop application..."
echo ""

# Build the application
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "Launching desktop application..."
    echo ""
    
    # Launch the desktop app
    NODE_ENV=development npm run electron .
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
