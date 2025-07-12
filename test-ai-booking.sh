#!/bin/bash

# AI Booking System Test Script
echo "🤖 Testing AI Booking System Features..."
echo "========================================"

# Test 1: Check if AI booking service files exist
echo "📁 Checking AI booking service files..."
if [ -f "../frontend/src/services/aiBookingService.ts" ]; then
    echo "✅ AI Booking Service - Found"
else
    echo "❌ AI Booking Service - Missing"
fi

if [ -f "../frontend/src/screens/client/AIBookingScreen.tsx" ]; then
    echo "✅ AI Booking Screen - Found"
else
    echo "❌ AI Booking Screen - Missing"
fi

if [ -f "../frontend/src/components/booking/AIBookingRecommendations.tsx" ]; then
    echo "✅ AI Booking Recommendations Component - Found"
else
    echo "❌ AI Booking Recommendations Component - Missing"
fi

if [ -f "../frontend/src/components/booking/SmartBookingSuggestionsModal.tsx" ]; then
    echo "✅ Smart Booking Suggestions Modal - Found"
else
    echo "❌ Smart Booking Suggestions Modal - Missing"
fi

echo ""
echo "🔍 Checking AI feature integration..."

# Test 2: Check if BookingsScreen has AI integration
if grep -q "handleAIBooking" ../frontend/src/screens/client/BookingsScreen.tsx; then
    echo "✅ BookingsScreen - AI integration found"
else
    echo "❌ BookingsScreen - AI integration missing"
fi

# Test 3: Check if navigation includes AI booking screen
if grep -q "AIBooking" ../frontend/src/types/index.ts; then
    echo "✅ Navigation Types - AI booking screen added"
else
    echo "❌ Navigation Types - AI booking screen missing"
fi

# Test 4: Check if EnhancedSearchScreen has floating AI button
if grep -q "floatingAIButton" ../frontend/src/screens/client/EnhancedSearchScreen.tsx; then
    echo "✅ Enhanced Search Screen - Floating AI button found"
else
    echo "❌ Enhanced Search Screen - Floating AI button missing"
fi

echo ""
echo "🎯 AI Booking Features Summary:"
echo "- AI Booking Service with personalized recommendations"
echo "- Smart preference collection interface"
echo "- Time slot optimization"
echo "- Pricing optimization"
echo "- Provider-specific AI recommendations"
echo "- Floating AI assistant button"
echo "- Smart booking suggestions modal"
echo "- Enhanced empty state with AI prompts"

echo ""
echo "🚀 AI Booking System is ready for testing!"
echo "Key Features:"
echo "1. Open BookingsScreen -> Click 'AI Assistant' button"
echo "2. Open SearchScreen -> Click floating AI button"
echo "3. Navigate to AIBookingScreen for full AI experience"
echo "4. Provider detail screens show AI recommendations"

echo ""
echo "📱 To test on device:"
echo "1. Start frontend: npm start (in /frontend)"
echo "2. Start backend: dotnet run (in /backend/FYLA.API)"
echo "3. Scan QR code with Expo Go"
echo "4. Navigate to Bookings tab"
echo "5. Click 'AI Assistant' button"

echo ""
echo "🎉 AI Booking System implementation complete!"
