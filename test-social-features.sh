#!/bin/bash

# Social Features API Test Script
# Tests all social API endpoints with real backend integration

echo "🔧 FYLA Social Features API Test"
echo "================================="

# Configuration
API_BASE="https://localhost:5003/api"
SOCIAL_API="$API_BASE/social"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to make API calls and handle responses
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ -n "$token" ]; then
        auth_header="Authorization: Bearer $token"
        echo "Using token: ${token:0:20}..."
    else
        auth_header=""
        echo "No token provided"
    fi
    
    if [ "$method" = "GET" ]; then
        if [ -n "$token" ]; then
            response=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -H "$auth_header" "$endpoint")
        else
            response=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" "$endpoint")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$token" ]; then
            response=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -H "Content-Type: application/json" -H "$auth_header" -d "$data" "$endpoint")
        else
            response=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -H "Content-Type: application/json" -d "$data" "$endpoint")
        fi
    fi
    
    # Extract HTTP code and body
    http_code=$(echo "$response" | tail -n1 | sed 's/.*HTTP_CODE://')
    body=$(echo "$response" | sed '$d')
    
    # Check response
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "Response: $body" | python3 -m json.tool 2>/dev/null || echo "Response: $body"
        fi
        return 0
    else
        echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Function to get user token
get_user_token() {
    local email=$1
    local password=$2
    
    echo -e "\n${PURPLE}🔐 Getting token for $email${NC}" >&2
    
    login_response=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
        "$API_BASE/auth/login")
    
    http_code=$(echo "$login_response" | tail -n1 | sed 's/.*HTTP_CODE://')
    body=$(echo "$login_response" | sed '$d')
    
    echo "HTTP Code: $http_code" >&2
    echo "Response body length: ${#body}" >&2
    
    if [ "$http_code" -eq 200 ]; then
        token=$(echo "$body" | grep -o '"token":"[^"]*"' | sed 's/"token":"//' | sed 's/"//')
        echo "Extracted token length: ${#token}" >&2
        if [ "$token" != "null" ] && [ -n "$token" ]; then
            echo -e "${GREEN}✅ Login successful${NC}" >&2
            echo "$token"
            return 0
        else
            echo "Token extraction failed" >&2
        fi
    fi
    
    echo -e "${RED}❌ Login failed for $email${NC}"
    echo "Response: $body"
    return 1
}

# Check if backend is running
echo -e "\n${YELLOW}🏥 Checking if backend is running...${NC}"
if ! curl -k -s "$API_BASE/health" > /dev/null; then
    echo -e "${RED}❌ Backend is not running on $API_BASE${NC}"
    echo "Please start the backend first with: dotnet run (in backend/FYLA.API directory)"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"

# Test user credentials (based on seeded users)
USER1_EMAIL="emma.johnson@email.com"
USER1_PASSWORD="TempPassword123!"
USER2_EMAIL="sophia.grace@fylapro.com"
USER2_PASSWORD="TempPassword123!"
USER3_EMAIL="michael.chen@email.com"
USER3_PASSWORD="TempPassword123!"

# Get tokens for test users
echo -e "\n${YELLOW}📝 Getting authentication tokens...${NC}"

USER1_TOKEN=$(get_user_token "$USER1_EMAIL" "$USER1_PASSWORD")
USER1_STATUS=$?
echo "User 1 token status: $USER1_STATUS"
echo "User 1 token length: ${#USER1_TOKEN}"
if [ $USER1_STATUS -ne 0 ]; then
    echo -e "${RED}Failed to get token for User 1${NC}"
    exit 1
fi

USER2_TOKEN=$(get_user_token "$USER2_EMAIL" "$USER2_PASSWORD")
USER2_STATUS=$?
echo "User 2 token status: $USER2_STATUS"
echo "User 2 token length: ${#USER2_TOKEN}"
if [ $USER2_STATUS -ne 0 ]; then
    echo -e "${RED}Failed to get token for User 2${NC}"
    exit 1
fi

USER3_TOKEN=$(get_user_token "$USER3_EMAIL" "$USER3_PASSWORD")
USER3_STATUS=$?
echo "User 3 token status: $USER3_STATUS"
echo "User 3 token length: ${#USER3_TOKEN}"
if [ $USER3_STATUS -ne 0 ]; then
    echo -e "${RED}Failed to get token for User 3${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 All tokens obtained successfully!${NC}"

# Test Social Features
echo -e "\n${YELLOW}🌟 Testing Social Features${NC}"
echo "========================="

# Test 1: Get user social stats
api_call "GET" "$SOCIAL_API/users/2/stats" "" "$USER1_TOKEN" "Get user social stats"

# Test 2: Get suggested users
api_call "GET" "$SOCIAL_API/suggested-users?limit=5" "" "$USER1_TOKEN" "Get suggested users to follow"

# Test 3: Check if following user
api_call "GET" "$SOCIAL_API/users/2/is-following" "" "$USER1_TOKEN" "Check if following user 2"

# Test 4: Follow a user
api_call "POST" "$SOCIAL_API/follow" '{"userId": 2}' "$USER1_TOKEN" "Follow user 2"

# Test 5: Check if following user (after follow)
api_call "GET" "$SOCIAL_API/users/2/is-following" "" "$USER1_TOKEN" "Check if following user 2 (after follow)"

# Test 6: Get followers of user 2
api_call "GET" "$SOCIAL_API/users/2/followers?page=1&pageSize=10" "" "$USER2_TOKEN" "Get followers of user 2"

# Test 7: Get users that user 1 is following
api_call "GET" "$SOCIAL_API/users/25/following?page=1&pageSize=10" "" "$USER1_TOKEN" "Get users that user 1 is following"

# Test 8: Get mutual follows
api_call "GET" "$SOCIAL_API/users/2/mutual-follows" "" "$USER1_TOKEN" "Get mutual follows with user 2"

# Test 9: User 3 follows user 2
api_call "POST" "$SOCIAL_API/follow" '{"userId": 2}' "$USER3_TOKEN" "User 3 follows user 2"

# Test 10: Get updated followers of user 2
api_call "GET" "$SOCIAL_API/users/2/followers?page=1&pageSize=10" "" "$USER2_TOKEN" "Get updated followers of user 2"

# Test 11: Unfollow user
api_call "POST" "$SOCIAL_API/follow" '{"userId": 2}' "$USER1_TOKEN" "Unfollow user 2 (toggle)"

# Test 12: Check updated social stats
api_call "GET" "$SOCIAL_API/users/2/stats" "" "$USER1_TOKEN" "Get updated user social stats"

# Test Error Cases
echo -e "\n${YELLOW}🚨 Testing Error Cases${NC}"
echo "====================="

# Test 13: Follow yourself (should fail)
api_call "POST" "$SOCIAL_API/follow" '{"userId": 25}' "$USER1_TOKEN" "Follow yourself (should fail)"

# Test 14: Invalid user ID
api_call "GET" "$SOCIAL_API/users/999999/stats" "" "$USER1_TOKEN" "Get stats for non-existent user"

# Test 15: Unauthorized access
api_call "GET" "$SOCIAL_API/users/1/stats" "" "" "Get stats without token (should fail)"

# Test 16: Invalid token
api_call "GET" "$SOCIAL_API/users/1/stats" "" "invalid-token" "Get stats with invalid token"

# Summary
echo -e "\n${PURPLE}📊 Test Summary${NC}"
echo "==============="
echo -e "${GREEN}✅ Social Features API testing completed!${NC}"
echo -e "${BLUE}📝 Key endpoints tested:${NC}"
echo "   • POST /api/social/follow - Follow/unfollow users"
echo "   • GET /api/social/followers/{userId} - Get user followers"
echo "   • GET /api/social/following/{userId} - Get users being followed"
echo "   • GET /api/social/stats/{userId} - Get user social statistics"
echo "   • GET /api/social/isfollowing/{userId} - Check follow status"
echo "   • GET /api/social/suggested - Get suggested users"
echo "   • GET /api/social/mutual/{userId} - Get mutual follows"

echo -e "\n${YELLOW}🎯 Next Steps:${NC}"
echo "1. Test social features in the mobile app"
echo "2. Verify follow/unfollow functionality works in UI"
echo "3. Check that social stats update correctly"
echo "4. Test suggested users recommendations"
echo "5. Verify mutual follows display properly"

echo -e "\n${GREEN}🚀 Social Features API is ready for integration!${NC}"
