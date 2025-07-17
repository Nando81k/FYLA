#!/bin/bash

# FYLA Analytics Debugging Script
# Tests all analytics endpoints to verify functionality

echo "🔍 FYLA Analytics Debug - Testing All Endpoints"
echo "=============================================="

BASE_URL="http://192.168.1.201:5002/api"

# Get fresh token
echo "🔐 Getting authentication token..."
AUTH_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"isabella.romano@fylapro.com","password":"TempPassword123!"}' \
    "${BASE_URL}/auth/login")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:50}..."

# Test all analytics endpoints
echo -e "\n📊 Testing Analytics Endpoints"
echo "================================"

echo -e "\n1. Provider Analytics (Month):"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/provider?period=month"

echo -e "\n\n2. Provider Analytics (Week):"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/provider?period=week"

echo -e "\n\n3. Earnings Data:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/earnings?period=month"

echo -e "\n\n4. Appointment Metrics:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/appointments"

echo -e "\n\n5. Provider Client Insights:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/client-insights"

# Test potential endpoints the frontend might be calling
echo -e "\n\n🔍 Testing Potential Frontend Endpoints"
echo "======================================="

echo -e "\n6. Dashboard Analytics:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/dashboard" 

echo -e "\n\n7. Summary Analytics:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/summary"

echo -e "\n\n8. Metrics Analytics:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/metrics"

# Test what the dashboard screen might be calling
echo -e "\n\n🏠 Testing Dashboard Potential Calls"
echo "===================================="

echo -e "\n9. Multiple Calls (Dashboard Load Pattern):"
echo "Provider Analytics:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/provider?period=month" | head -100

echo -e "\nEarnings:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/earnings?period=month" | head -100

echo -e "\nAppointments:"
curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/analytics/appointments" | head -100

echo -e "\n\n✅ Analytics Debug Complete!"
echo "All available endpoints tested with authentication."
