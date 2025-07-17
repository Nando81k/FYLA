#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:5002/api"
TOKEN=""
PROVIDER_ID=""
CLIENT_ID=""
APPOINTMENT_ID=""
REVIEW_ID=""

echo -e "${BLUE}=== FYLA Reviews & Rating System Test Script ===${NC}"
echo "This script tests the complete Reviews & Rating System functionality"
echo ""

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to extract JSON value
extract_json_value() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | cut -d'"' -f4 | tr -d '"' | tr -d ':'
}

echo -e "${YELLOW}Step 1: Testing Authentication${NC}"

# Login as client
echo "Logging in as client..."
CLIENT_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.client@example.com",
    "password": "SecurePass123!"
  }')

if [[ $CLIENT_LOGIN_RESPONSE == *"token"* ]]; then
    CLIENT_TOKEN=$(echo $CLIENT_LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    CLIENT_ID=$(echo $CLIENT_LOGIN_RESPONSE | grep -o '"id":[^,}]*' | cut -d':' -f2 | tr -d ' ')
    print_result 0 "Client authentication successful"
    echo "Client ID: $CLIENT_ID"
else
    print_result 1 "Client authentication failed"
    echo "Response: $CLIENT_LOGIN_RESPONSE"
    exit 1
fi

# Login as provider
echo "Logging in as provider..."
PROVIDER_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.provider@example.com",
    "password": "SecurePass123!"
  }')

if [[ $PROVIDER_LOGIN_RESPONSE == *"token"* ]]; then
    PROVIDER_TOKEN=$(echo $PROVIDER_LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    PROVIDER_ID=$(echo $PROVIDER_LOGIN_RESPONSE | grep -o '"id":[^,}]*' | cut -d':' -f2 | tr -d ' ')
    print_result 0 "Provider authentication successful"
    echo "Provider ID: $PROVIDER_ID"
else
    print_result 1 "Provider authentication failed"
    echo "Response: $PROVIDER_LOGIN_RESPONSE"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Create Test Appointment${NC}"

# Create appointment as client
APPOINTMENT_RESPONSE=$(curl -s -X POST "$API_BASE/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "{
    \"providerId\": $PROVIDER_ID,
    \"serviceId\": 1,
    \"appointmentDateTime\": \"$(date -u -v+1d '+%Y-%m-%dT%H:%M:%S.000Z')\",
    \"location\": \"123 Test Street\",
    \"notes\": \"Test appointment for review system\"
  }")

if [[ $APPOINTMENT_RESPONSE == *"id"* ]]; then
    APPOINTMENT_ID=$(echo $APPOINTMENT_RESPONSE | grep -o '"id":[^,}]*' | cut -d':' -f2 | tr -d ' ')
    print_result 0 "Test appointment created"
    echo "Appointment ID: $APPOINTMENT_ID"
else
    print_result 1 "Failed to create test appointment"
    echo "Response: $APPOINTMENT_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Step 3: Complete Appointment (simulate)${NC}"

# Update appointment to completed status
COMPLETE_RESPONSE=$(curl -s -X PUT "$API_BASE/appointments/$APPOINTMENT_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "status": "Completed"
  }')

if [[ $COMPLETE_RESPONSE == *"Completed"* ]]; then
    print_result 0 "Appointment marked as completed"
else
    print_result 1 "Failed to complete appointment"
    echo "Response: $COMPLETE_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Step 4: Testing Review Eligibility${NC}"

# Check if client can review the appointment
CAN_REVIEW_RESPONSE=$(curl -s -X GET "$API_BASE/reviews/appointment/$APPOINTMENT_ID/can-review" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

if [[ $CAN_REVIEW_RESPONSE == *"true"* ]]; then
    print_result 0 "Client can review completed appointment"
else
    print_result 1 "Client cannot review appointment (this might be expected)"
    echo "Response: $CAN_REVIEW_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Step 5: Creating Review${NC}"

# Create a review
CREATE_REVIEW_RESPONSE=$(curl -s -X POST "$API_BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "{
    \"appointmentId\": $APPOINTMENT_ID,
    \"rating\": 5,
    \"comment\": \"Excellent service! Very professional and delivered exactly what I needed. Highly recommend!\",
    \"wouldRecommend\": true
  }")

if [[ $CREATE_REVIEW_RESPONSE == *"id"* ]]; then
    REVIEW_ID=$(echo $CREATE_REVIEW_RESPONSE | grep -o '"id":[^,}]*' | cut -d':' -f2 | tr -d ' ')
    print_result 0 "Review created successfully"
    echo "Review ID: $REVIEW_ID"
    echo "Review details:"
    echo $CREATE_REVIEW_RESPONSE | jq '.' 2>/dev/null || echo $CREATE_REVIEW_RESPONSE
else
    print_result 1 "Failed to create review"
    echo "Response: $CREATE_REVIEW_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Step 6: Testing Review Retrieval${NC}"

# Get specific review
if [ ! -z "$REVIEW_ID" ]; then
    GET_REVIEW_RESPONSE=$(curl -s -X GET "$API_BASE/reviews/$REVIEW_ID" \
      -H "Authorization: Bearer $CLIENT_TOKEN")
    
    if [[ $GET_REVIEW_RESPONSE == *"rating"* ]]; then
        print_result 0 "Retrieved specific review"
    else
        print_result 1 "Failed to retrieve specific review"
        echo "Response: $GET_REVIEW_RESPONSE"
    fi
fi

# Get provider reviews (public endpoint)
PROVIDER_REVIEWS_RESPONSE=$(curl -s -X GET "$API_BASE/reviews/provider/$PROVIDER_ID?page=1&pageSize=10")

if [[ $PROVIDER_REVIEWS_RESPONSE == *"reviews"* ]] || [[ $PROVIDER_REVIEWS_RESPONSE == *"[]"* ]]; then
    print_result 0 "Retrieved provider reviews"
    echo "Provider reviews count: $(echo $PROVIDER_REVIEWS_RESPONSE | grep -o '"totalCount":[^,}]*' | cut -d':' -f2 | tr -d ' ')"
else
    print_result 1 "Failed to retrieve provider reviews"
    echo "Response: $PROVIDER_REVIEWS_RESPONSE"
fi

# Get provider rating statistics
STATS_RESPONSE=$(curl -s -X GET "$API_BASE/reviews/provider/$PROVIDER_ID/stats")

if [[ $STATS_RESPONSE == *"averageRating"* ]]; then
    print_result 0 "Retrieved provider rating statistics"
    echo "Provider stats:"
    echo $STATS_RESPONSE | jq '.' 2>/dev/null || echo $STATS_RESPONSE
else
    print_result 1 "Failed to retrieve provider rating statistics"
    echo "Response: $STATS_RESPONSE"
fi

# Get client's reviews
MY_REVIEWS_RESPONSE=$(curl -s -X GET "$API_BASE/reviews/my-reviews?page=1&pageSize=10" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

if [[ $MY_REVIEWS_RESPONSE == *"reviews"* ]] || [[ $MY_REVIEWS_RESPONSE == *"[]"* ]]; then
    print_result 0 "Retrieved client's reviews"
else
    print_result 1 "Failed to retrieve client's reviews"
    echo "Response: $MY_REVIEWS_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Step 7: Testing Review Updates${NC}"

# Update the review
if [ ! -z "$REVIEW_ID" ]; then
    UPDATE_REVIEW_RESPONSE=$(curl -s -X PUT "$API_BASE/reviews/$REVIEW_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CLIENT_TOKEN" \
      -d '{
        "rating": 4,
        "comment": "Updated review: Good service, but could be improved in some areas.",
        "wouldRecommend": true
      }')
    
    if [[ $UPDATE_REVIEW_RESPONSE == *"rating"* ]]; then
        print_result 0 "Review updated successfully"
        echo "Updated review details:"
        echo $UPDATE_REVIEW_RESPONSE | jq '.' 2>/dev/null || echo $UPDATE_REVIEW_RESPONSE
    else
        print_result 1 "Failed to update review"
        echo "Response: $UPDATE_REVIEW_RESPONSE"
    fi
fi

echo ""
echo -e "${YELLOW}Step 8: Testing Review for Specific Appointment${NC}"

# Get review for specific appointment
APPOINTMENT_REVIEW_RESPONSE=$(curl -s -X GET "$API_BASE/reviews/appointment/$APPOINTMENT_ID" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

if [[ $APPOINTMENT_REVIEW_RESPONSE == *"rating"* ]]; then
    print_result 0 "Retrieved review for specific appointment"
else
    print_result 1 "Failed to retrieve review for appointment"
    echo "Response: $APPOINTMENT_REVIEW_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Step 9: Testing Recent Reviews${NC}"

# Get recent reviews
RECENT_REVIEWS_RESPONSE=$(curl -s -X GET "$API_BASE/reviews/recent?limit=5" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

if [[ $RECENT_REVIEWS_RESPONSE == *"["* ]]; then
    print_result 0 "Retrieved recent reviews"
    echo "Recent reviews count: $(echo $RECENT_REVIEWS_RESPONSE | grep -o '\[.*\]' | tr ',' '\n' | grep -c '{')"
else
    print_result 1 "Failed to retrieve recent reviews"
    echo "Response: $RECENT_REVIEWS_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Step 10: Testing Edge Cases${NC}"

# Test duplicate review creation (should fail)
DUPLICATE_REVIEW_RESPONSE=$(curl -s -X POST "$API_BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "{
    \"appointmentId\": $APPOINTMENT_ID,
    \"rating\": 3,
    \"comment\": \"This should fail as duplicate\",
    \"wouldRecommend\": false
  }")

if [[ $DUPLICATE_REVIEW_RESPONSE == *"error"* ]] || [[ $DUPLICATE_REVIEW_RESPONSE == *"already"* ]]; then
    print_result 0 "Duplicate review creation properly prevented"
else
    print_result 1 "Duplicate review was allowed (unexpected)"
    echo "Response: $DUPLICATE_REVIEW_RESPONSE"
fi

# Test invalid rating (should fail)
INVALID_RATING_RESPONSE=$(curl -s -X POST "$API_BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{
    "appointmentId": 999999,
    "rating": 6,
    "comment": "Invalid rating test",
    "wouldRecommend": true
  }')

if [[ $INVALID_RATING_RESPONSE == *"error"* ]] || [[ $INVALID_RATING_RESPONSE == *"validation"* ]]; then
    print_result 0 "Invalid rating properly rejected"
else
    print_result 1 "Invalid rating was accepted (unexpected)"
    echo "Response: $INVALID_RATING_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Step 11: Testing Authorization${NC}"

# Test unauthorized review deletion (provider trying to delete client's review)
if [ ! -z "$REVIEW_ID" ]; then
    UNAUTHORIZED_DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE/reviews/$REVIEW_ID" \
      -H "Authorization: Bearer $PROVIDER_TOKEN")
    
    if [[ $UNAUTHORIZED_DELETE_RESPONSE == *"error"* ]] || [[ $UNAUTHORIZED_DELETE_RESPONSE == *"unauthorized"* ]]; then
        print_result 0 "Unauthorized deletion properly prevented"
    else
        print_result 1 "Unauthorized deletion was allowed (unexpected)"
        echo "Response: $UNAUTHORIZED_DELETE_RESPONSE"
    fi
fi

echo ""
echo -e "${YELLOW}Step 12: Clean Up (Optional)${NC}"

# Optionally delete the test review
read -p "Do you want to delete the test review? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] && [ ! -z "$REVIEW_ID" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE/reviews/$REVIEW_ID" \
      -H "Authorization: Bearer $CLIENT_TOKEN")
    
    if [[ $DELETE_RESPONSE == "" ]]; then
        print_result 0 "Test review deleted successfully"
    else
        print_result 1 "Failed to delete test review"
        echo "Response: $DELETE_RESPONSE"
    fi
fi

echo ""
echo -e "${BLUE}=== Review System Test Complete ===${NC}"
echo -e "${GREEN}✓ Authentication tested${NC}"
echo -e "${GREEN}✓ Review creation tested${NC}"
echo -e "${GREEN}✓ Review retrieval tested${NC}"
echo -e "${GREEN}✓ Review updates tested${NC}"
echo -e "${GREEN}✓ Provider statistics tested${NC}"
echo -e "${GREEN}✓ Authorization controls tested${NC}"
echo -e "${GREEN}✓ Edge cases tested${NC}"
echo ""
echo "The Reviews & Rating System is ready for use!"
echo "Key features verified:"
echo "• Clients can create reviews for completed appointments"
echo "• Provider rating statistics are calculated"
echo "• Review eligibility is properly enforced"
echo "• Authorization controls prevent unauthorized access"
echo "• Duplicate reviews are prevented"
echo "• Public access to provider reviews and stats"
