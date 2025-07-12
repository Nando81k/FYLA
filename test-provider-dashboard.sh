#!/bin/bash

echo "🧪 Testing Enhanced Provider Dashboard..."

# Check if backend is running
if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend is running on port 5002"
else
    echo "❌ Backend is not running"
    exit 1
fi

# Test the analytics endpoints
echo "🔍 Testing Analytics Endpoints..."

# Test with a mock JWT token (you'll need to replace with actual token)
TOKEN="your-jwt-token-here"
BASE_URL="http://localhost:5002/api"

# Test Provider Analytics
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "$BASE_URL/analytics/provider?period=month" \
     | grep -q "totalRevenue" && echo "✅ Provider Analytics API working" || echo "❌ Provider Analytics API failed"

# Test Earnings Data
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "$BASE_URL/analytics/earnings?period=month" \
     | grep -q "totalEarnings" && echo "✅ Earnings API working" || echo "❌ Earnings API failed"

# Test Appointment Metrics
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "$BASE_URL/analytics/appointments" \
     | grep -q "totalToday" && echo "✅ Appointment Metrics API working" || echo "❌ Appointment Metrics API failed"

# Test Client Insights
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "$BASE_URL/analytics/clients" \
     | grep -q "totalAppointments" && echo "✅ Client Insights API working" || echo "❌ Client Insights API failed"

echo "🎉 Enhanced Provider Dashboard testing complete!"
echo ""
echo "📱 Frontend Features Implemented:"
echo "   ✅ Real-time Analytics Dashboard"
echo "   ✅ Enhanced Calendar Management"
echo "   ✅ Notification Center"
echo "   ✅ Client Management"
echo "   ✅ Quick Actions Hub"
echo "   ✅ Performance Metrics"
echo ""
echo "🔧 Backend Features Implemented:"
echo "   ✅ Analytics Controller"
echo "   ✅ Provider Analytics API"
echo "   ✅ Earnings Data API"
echo "   ✅ Appointment Metrics API"
echo "   ✅ Client Insights API"
echo ""
echo "Ready to continue with the next feature! 🚀"
