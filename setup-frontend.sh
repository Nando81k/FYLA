#!/bin/bash

echo "🚀 Setting up FYLA Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or later."
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g @expo/cli
fi

# Navigate to frontend directory
cd frontend

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Fix package compatibility for Expo 53
echo "🔧 Fixing package compatibility for Expo 53..."
npx expo install --fix

# Install additional React Native packages
echo "📦 Installing additional React Native packages..."
npm install @react-native-async-storage/async-storage --legacy-peer-deps

# Check if this is an upgrade and clear cache if needed
if [ -d ".expo" ]; then
    echo "🧹 Clearing Expo cache for version upgrade..."
    rm -rf .expo
fi

# Clear npm and metro cache
echo "🧹 Clearing npm and metro cache..."
npm cache clean --force
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
fi

echo "✅ Frontend setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. cd frontend"
echo "2. npx expo start --clear"
echo "3. Press 'i' for iOS simulator or 'a' for Android emulator"
echo ""
echo "💡 If you still encounter issues, try:"
echo "   - Make sure you're in the frontend directory"
echo "   - rm -rf node_modules && npm install --legacy-peer-deps"
echo "   - npx expo start --clear"
echo ""
echo "📖 Check docs/SETUP.md for detailed setup instructions"
