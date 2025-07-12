#!/bin/bash

# Update all service files to use localhost instead of IP address
echo "Updating API URLs to use localhost..."

# List of files to update
files=(
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/userService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/businessHoursService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/analyticsService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/providerService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/appointmentService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/reviewService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/webSocketService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/calendarService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/pushNotificationService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/contentService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/searchService.ts"
  "/Users/Macry_Student/Development/personal_projects/FYLA/frontend/src/services/advancedBookingService.ts"
)

for file in "${files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "Updating $file..."
    sed -i '' 's/http:\/\/10\.0\.12\.121:5002\/api/http:\/\/localhost:5002\/api/g' "$file"
    # Also update WebSocket URL
    sed -i '' 's/ws:\/\/10\.0\.12\.121:5002\/ws/ws:\/\/localhost:5002\/ws/g' "$file"
    echo "  ✅ Updated $file"
  else
    echo "  ❌ File not found: $file"
  fi
done

echo "Done updating API URLs!"
