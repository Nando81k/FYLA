#!/bin/bash

echo "🚀 Starting FYLA Backend Server..."
echo "📁 Changing to backend/FYLA.API directory..."

cd /Users/Macry_Student/Development/personal_projects/FYLA/backend/FYLA.API

echo "🔧 Setting environment to Development..."
export ASPNETCORE_ENVIRONMENT=Development

echo "📦 Building project..."
dotnet build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🌐 Starting server on ports 5002 (HTTP) and 5003 (HTTPS)..."
    echo "🔍 Environment: Development (HTTPS redirection disabled)"
    echo "📱 React Native should now be able to connect to HTTP endpoints"
    echo ""
    
    dotnet run
else
    echo "❌ Build failed!"
    exit 1
fi
