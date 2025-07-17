#!/bin/bash

# FYLA Chat System API Test Script
# Tests all chat-related endpoints to verify implementation completeness

echo "🗨️  FYLA Chat System API Test"
echo "==============================="
echo "Timestamp: $(date)"
echo

# Configuration
BASE_URL="https://localhost:5003/api"
HEALTH_URL="https://localhost:5003/health"

# Test user credentials (from seeded data)
CLIENT_EMAIL="emma.johnson@email.com"
CLIENT_PASSWORD="TempPassword123!"
PROVIDER_EMAIL="sophia.grace@fylapro.com"
PROVIDER_PASSWORD="TempPassword123!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make API calls and handle responses
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    local description=$5
    
    echo -e "${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method${NC} $endpoint"
    
    if [ -n "$auth_header" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -k \
            -X $method \
            -H "Content-Type: application/json" \
            -H "$auth_header" \
            -d "$data" \
            "$BASE_URL$endpoint")
    elif [ -n "$auth_header" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -k \
            -X $method \
            -H "Content-Type: application/json" \
            -H "$auth_header" \
            "$BASE_URL$endpoint")
    elif [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -k \
            -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -k \
            -X $method \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    if [ "$http_status" -eq 200 ] || [ "$http_status" -eq 201 ]; then
        echo -e "${GREEN}✅ Success${NC} (HTTP $http_status)"
        echo "$response_body" | head -c 200
        [ ${#response_body} -gt 200 ] && echo "..."
    else
        echo -e "${RED}❌ Failed${NC} (HTTP $http_status)"
        echo "$response_body" | head -c 300
    fi
    echo
    echo "---"
}

# 1. Health Check
echo "🏥 1. Health Check"
test_endpoint "GET" "" "" "" "Server health status"
curl -s -k "$HEALTH_URL" | head -c 100
echo -e "\n---\n"

# 2. Authentication (Get tokens for testing)
echo "🔐 2. Authentication"

echo "Getting client token..."
client_auth_response=$(curl -s -k -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"$CLIENT_PASSWORD\"}" \
    "$BASE_URL/auth/login")

client_token=$(echo "$client_auth_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Getting provider token..."
provider_auth_response=$(curl -s -k -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$PROVIDER_EMAIL\",\"password\":\"$PROVIDER_PASSWORD\"}" \
    "$BASE_URL/auth/login")

provider_token=$(echo "$provider_auth_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$client_token" ]; then
    echo -e "${GREEN}✅ Client authenticated${NC}"
else
    echo -e "${RED}❌ Client authentication failed${NC}"
    echo "$client_auth_response"
fi

if [ -n "$provider_token" ]; then
    echo -e "${GREEN}✅ Provider authenticated${NC}"
else
    echo -e "${RED}❌ Provider authentication failed${NC}"
    echo "$provider_auth_response"
fi

echo "---"
echo

# 3. Chat Endpoints Testing
echo "💬 3. Chat System Endpoints"

if [ -n "$client_token" ]; then
    # Get conversations (as client)
    test_endpoint "GET" "/chat/conversations" "" "Authorization: Bearer $client_token" "Get user conversations (client)"
    
    # Create conversation with provider
    create_response=$(curl -s -k -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $client_token" \
        -d '{"otherUserId":11}' \
        "$BASE_URL/chat/conversations")
    
    conversation_id=$(echo "$create_response" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    
    if [ -n "$conversation_id" ]; then
        echo -e "${GREEN}✅ Conversation created with ID: $conversation_id${NC}"
        
        # Send a message
        test_endpoint "POST" "/chat/messages" "{\"conversationId\":$conversation_id,\"content\":\"Hello, I'd like to book an appointment\"}" "Authorization: Bearer $client_token" "Send message to conversation"
        
        # Get conversation messages
        test_endpoint "GET" "/chat/conversations/$conversation_id/messages" "" "Authorization: Bearer $client_token" "Get conversation messages"
        
        # Mark conversation as read
        test_endpoint "PUT" "/chat/conversations/$conversation_id/read" "" "Authorization: Bearer $client_token" "Mark conversation as read"
    else
        echo -e "${RED}❌ Failed to extract conversation ID${NC}"
        echo "Response: $create_response"
    fi
fi

if [ -n "$provider_token" ]; then
    echo
    echo "Testing from provider perspective..."
    
    # Get conversations (as provider)
    test_endpoint "GET" "/chat/conversations" "" "Authorization: Bearer $provider_token" "Get user conversations (provider)"
    
    # Send response message (use the same conversation ID)
    if [ -n "$conversation_id" ]; then
        test_endpoint "POST" "/chat/messages" "{\"conversationId\":$conversation_id,\"content\":\"Hi! I'd be happy to help you book an appointment\"}" "Authorization: Bearer $provider_token" "Provider response message"
    fi
fi

# 4. WebSocket Hub Testing (Connection test)
echo
echo "🔌 4. WebSocket Chat Hub"
echo "WebSocket URL: ws://192.168.1.185:5002/chathub"
echo "Note: WebSocket requires connection from client application"
echo "---"

# 5. Chat-related Database Tests
echo
echo "📊 5. Database Integration Tests"

if [ -n "$client_token" ]; then
    # Test message history pagination
    if [ -n "$conversation_id" ]; then
        test_endpoint "GET" "/chat/conversations/$conversation_id/messages?page=1&pageSize=10" "" "Authorization: Bearer $client_token" "Message pagination test"
    fi
    
    # Test conversation list with unread counts
    test_endpoint "GET" "/chat/conversations" "" "Authorization: Bearer $client_token" "Conversation list with unread counts"
fi

echo
echo "🎯 Test Summary"
echo "==============="
echo "• Health check: Server status"
echo "• Authentication: Client & Provider tokens"
echo "• Conversations: Create, list, read management"
echo "• Messages: Send, receive, history, pagination"
echo "• WebSocket: Real-time chat hub (requires client connection)"
echo "• Database: Message persistence and conversation state"
echo
echo "Next steps if tests fail:"
echo "1. Ensure backend server is running on port 5002"
echo "2. Verify database has seeded users"
echo "3. Check CORS configuration for frontend access"
echo "4. Test WebSocket connection from React Native app"
echo
echo "Test completed at $(date)"
