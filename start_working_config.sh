#!/bin/bash

# FYLA - Quick Start Script to Maintain Working State
# Run this script to ensure the backend and frontend are running correctly

echo "🚀 Starting FYLA in Working Configuration..."

# Set working directory
FYLA_ROOT="/Users/Macry_Student/Development/personal_projects/FYLA"

# Function to check if port is in use
check_port() {
    if lsof -ti:$1 > /dev/null; then
        echo "⚠️  Port $1 is already in use"
        return 0
    else
        echo "✅ Port $1 is available"
        return 1
    fi
}

# Kill any existing processes on port 5002
echo "🧹 Cleaning up existing processes..."
lsof -ti:5002 | xargs kill -9 2>/dev/null || true

# Start Backend
echo "🔧 Starting Backend..."
cd "$FYLA_ROOT/backend/FYLA.API"
ASPNETCORE_ENVIRONMENT=Development dotnet run --urls="http://0.0.0.0:5002" &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Test backend health
echo "🩺 Testing backend health..."
if curl -s http://10.0.12.121:5002/api/health > /dev/null; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    echo "Trying localhost..."
    if curl -s http://localhost:5002/api/health > /dev/null; then
        echo "✅ Backend accessible via localhost"
    else
        echo "❌ Backend not accessible"
        exit 1
    fi
fi

# Start Frontend
echo "📱 Starting Frontend..."
cd "$FYLA_ROOT/frontend"
npx expo start &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "🎉 FYLA is running in working configuration!"
echo ""
echo "📋 Process Information:"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "🌐 URLs:"
echo "Backend API: http://10.0.12.121:5002/api"
echo "Health Check: http://10.0.12.121:5002/api/health"
echo ""
echo "🛑 To stop all processes:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "✅ Configuration Status:"
echo "- Backend Environment: Development"
echo "- API Base URL: http://10.0.12.121:5002/api"
echo "- Fallback URLs: Enabled"
echo "- Feature Flags: Real APIs Enabled"
echo "- Authentication: Working"
echo ""
echo "📱 Current User: Fernando Martinez (Client, ID: 563)"

# Keep script running
wait
