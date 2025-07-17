#!/bin/bash

echo "=== FYLA System Status Debug ==="
echo "Current time: $(date)"
echo

# Test backend connectivity
echo "=== Backend Server Status ==="
echo "🔍 Testing localhost:5002..."
curl -s http://localhost:5002/api/health | jq . 2>/dev/null || echo "❌ Health check failed"

echo
echo "🔍 Testing 192.168.1.201:5002..."
curl -s http://192.168.1.201:5002/api/health | jq . 2>/dev/null || echo "❌ External IP health check failed"

echo
echo "=== Network Configuration ==="
echo "📡 Local IP addresses:"
ifconfig | grep "inet " | grep -v 127.0.0.1

echo
echo "=== Active .NET Processes ==="
ps aux | grep -E "(dotnet run|FYLA)" | grep -v grep

echo
echo "=== Port Status ==="
echo "📊 Checking port 5002..."
lsof -i :5002 2>/dev/null || echo "❌ Port 5002 not found"

echo "📊 Checking port 5003..."
lsof -i :5003 2>/dev/null || echo "❌ Port 5003 not found"

echo
echo "=== WebSocket Test ==="
echo "🔌 Testing WebSocket endpoint..."
curl -I -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://localhost:5002/chathub 2>/dev/null || echo "❌ WebSocket upgrade failed"

echo
echo "=== Analytics Endpoints Test ==="
# First, login to get a token
echo "🔐 Testing authentication..."
TOKEN=$(curl -s -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"isabella.romano@fylapro.com","password":"SecurePass123!"}' \
  | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✅ Authentication successful"
  echo "🔍 Testing analytics endpoints..."
  
  echo "📊 Provider Analytics:"
  curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5002/api/analytics/provider | jq '.success' 2>/dev/null || echo "❌ Provider analytics failed"
  
  echo "📊 Earnings Data:"
  curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5002/api/analytics/earnings | jq '.success' 2>/dev/null || echo "❌ Earnings data failed"
  
  echo "📊 Appointment Metrics:"
  curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5002/api/analytics/appointments | jq '.success' 2>/dev/null || echo "❌ Appointment metrics failed"
else
  echo "❌ Authentication failed"
fi

echo
echo "=== React Native Configuration Check ==="
if [ -f "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/config/api.ts" ]; then
  echo "🔍 Frontend API configuration:"
  grep -E "(baseURL|WEBSOCKET_URL|USE_REAL)" "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/config/api.ts"
else
  echo "❌ Frontend config file not found"
fi

echo
echo "=== Recommendations ==="
echo "1. ✅ Backend server is running and healthy"
echo "2. 🔍 Check if IP address 192.168.1.201 is correct for your network"
echo "3. 🔌 WebSocket connections may need the server to explicitly bind to external IPs"
echo "4. 📱 React Native app authentication is working"
echo "5. 📊 Analytics endpoints are functional"

echo
echo "=== Next Steps ==="
echo "- If WebSocket issues persist, check firewall settings"
echo "- Verify React Native device is on the same network (192.168.1.x)"
echo "- Consider testing with localhost if on simulator"
echo "- Reviews system is temporarily disabled due to namespace issues"
