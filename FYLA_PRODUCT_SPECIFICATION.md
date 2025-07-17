# FYLA - Find Your Local Artist
## Complete Product Specification Document

### Table of Contents
1. [Product Overview](#product-overview)
2. [User Stories](#user-stories)
3. [Technical Architecture](#technical-architecture)
4. [Backend Architecture](#backend-architecture)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Features & Functionality](#features--functionality)
8. [Authentication & Security](#authentication--security)
9. [Real-time Features](#real-time-features)
10. [AI-Powered Features](#ai-powered-features)
11. [Mobile App Architecture](#mobile-app-architecture)
12. [Development & Deployment](#development--deployment)

---

## Product Overview

**FYLA** (Find Your Local Artist) is a comprehensive mobile application that bridges the gap between service providers and clients in the beauty and personal care industry. The app combines the functionality of a professional booking platform with the social engagement features of Instagram, creating a unique ecosystem for beauty professionals and their clients.

### Core Value Proposition
- **For Clients**: Discover, book, and connect with local beauty professionals through an intuitive, social media-inspired interface
- **For Service Providers**: Showcase work, manage bookings, grow clientele, and run analytics-driven business operations

### Key Differentiators
- Instagram-style social feed with professional booking capabilities
- AI-powered booking recommendations and optimization
- Real-time chat and video capabilities
- Comprehensive analytics and business management tools
- Location-based discovery with radius filtering
- Advanced time slot management and conflict prevention

---

## User Stories

### Client User Stories

#### Discovery & Exploration
- **As a client**, I want to browse an Instagram-style feed of beauty professionals' work so I can discover new artists and services
- **As a client**, I want to search for service providers by location, service type, and availability so I can find the right professional for my needs
- **As a client**, I want to view detailed profiles with portfolios, reviews, and pricing so I can make informed decisions
- **As a client**, I want to see real-time availability and book appointments instantly so I can secure my preferred time slots

#### Booking & Scheduling
- **As a client**, I want to receive AI-powered service recommendations based on my preferences and booking history so I can discover new services
- **As a client**, I want to see blocked time slots clearly marked so I know when providers are unavailable
- **As a client**, I want to receive booking confirmations and reminders so I don't miss my appointments
- **As a client**, I want to view my appointment history and rebook favorite services easily

#### Social Features
- **As a client**, I want to follow my favorite service providers so I can stay updated on their latest work and availability
- **As a client**, I want to like, comment, and share posts so I can engage with the community
- **As a client**, I want to save posts to view later so I can reference inspiration for future appointments
- **As a client**, I want to receive notifications for new posts from providers I follow

#### Communication & Reviews
- **As a client**, I want to chat directly with service providers so I can discuss my needs and preferences
- **As a client**, I want to leave reviews and ratings after appointments so I can help other clients make decisions
- **As a client**, I want to view other clients' reviews and ratings so I can assess service quality

### Service Provider User Stories

#### Profile & Portfolio Management
- **As a service provider**, I want to create a comprehensive profile with my services, pricing, and portfolio so clients can understand my offerings
- **As a service provider**, I want to upload posts and stories showcasing my work so I can attract new clients
- **As a service provider**, I want to set my availability and working hours so clients can book appropriate time slots
- **As a service provider**, I want to manage my service offerings with descriptions, pricing, and duration so clients have clear expectations

#### Booking & Schedule Management
- **As a service provider**, I want to view all my bookings in a calendar format so I can manage my schedule effectively
- **As a service provider**, I want to accept or decline booking requests so I can control my workload
- **As a service provider**, I want to block out time slots for personal time or maintenance so clients can't book during unavailable periods
- **As a service provider**, I want to receive notifications for new booking requests so I can respond promptly

#### Business Management
- **As a service provider**, I want to view detailed analytics about my revenue, popular services, and client metrics so I can make data-driven business decisions
- **As a service provider**, I want to track my appointment completion rates and client satisfaction so I can improve my service quality
- **As a service provider**, I want to manage my client relationships and view client history so I can provide personalized service

#### Client Communication
- **As a service provider**, I want to chat with clients before and after appointments so I can provide excellent customer service
- **As a service provider**, I want to send appointment reminders and follow-up messages so I can reduce no-shows and maintain client relationships

---

## Technical Architecture

### System Architecture Overview

FYLA follows a modern, scalable architecture pattern:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web API       │    │   Database      │
│  (React Native) │◄──►│  (ASP.NET Core) │◄──►│  (SQL Server)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   External      │
                       │   Services      │
                       │ (Firebase, Maps)│
                       └─────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React Native + TypeScript | Cross-platform mobile app |
| Backend | ASP.NET Core 6.0 | RESTful API server |
| Database | SQL Server / PostgreSQL | Data persistence |
| Authentication | JWT Tokens | Secure user authentication |
| Real-time | SignalR | Chat and notifications |
| Push Notifications | Firebase Cloud Messaging | Mobile notifications |
| File Storage | Cloud Storage | Media and profile images |
| Maps | Apple Maps API | Location services |

### Core Principles
- **Clean Architecture**: Separation of concerns with distinct layers
- **SOLID Principles**: Maintainable and extensible code
- **RESTful API Design**: Consistent and predictable endpoints
- **Real-time Communication**: WebSocket connections for chat
- **Mobile-First Design**: Optimized for mobile user experience

---

## Backend Architecture

### Project Structure

```
FYLA.Backend/
├── FYLA.API/                 # Web API layer
│   ├── Controllers/          # API controllers
│   ├── Middleware/          # Custom middleware
│   ├── Extensions/          # Extension methods
│   └── Program.cs           # Application entry point
├── FYLA.Application/        # Application logic layer
│   ├── Interfaces/          # Service interfaces
│   ├── Services/            # Business logic services
│   └── Mappers/             # Data mapping
├── FYLA.Core/               # Domain layer
│   ├── Entities/            # Database entities
│   ├── DTOs/                # Data transfer objects
│   ├── Enums/               # Enumeration types
│   └── Interfaces/          # Core interfaces
└── FYLA.Infrastructure/     # Infrastructure layer
    ├── Data/                # Database context
    ├── Repositories/        # Data repositories
    ├── Services/            # External services
    └── Migrations/          # Database migrations
```

### Core Services

#### Authentication Service (`IAuthService`)
- User registration and login
- JWT token generation and validation
- Role-based authorization
- Password hashing and validation

#### Appointment Service (`IAppointmentService`)
- Time slot availability calculation
- Booking creation and management
- Appointment status tracking
- Conflict detection and prevention

#### Social Service (`ISocialService`)
- Follow/unfollow functionality
- Social statistics tracking
- User discovery and recommendations
- Activity feed generation

#### Chat Service (`IChatService`)
- Real-time messaging via SignalR
- Message history persistence
- Conversation management
- Typing indicators and read receipts

#### Service Management Service (`IServiceManagementService`)
- Service CRUD operations
- Pricing and availability management
- Service categorization
- Provider service portfolio

#### Analytics Service (`IAnalyticsService`)
- Business performance metrics
- Revenue tracking and reporting
- Popular service analysis
- Client behavior insights

### Database Design Patterns

#### Entity Framework Core
- Code-first approach with migrations
- Fluent API configuration
- Lazy loading for navigation properties
- Query optimization and indexing

#### Repository Pattern
- Generic repository for common operations
- Specific repositories for complex queries
- Unit of work pattern for transaction management
- Separation of data access logic

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "phoneNumber": "+1234567890",
  "role": "Client" // or "ServiceProvider"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "Client",
    "profilePictureUrl": null,
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

#### POST /api/auth/login
Authenticate user and retrieve token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "Client"
  }
}
```

#### POST /api/auth/refresh-token
Refresh an expired JWT token

**Request Body:**
```json
{
  "token": "expired_jwt_token"
}
```

#### POST /api/auth/logout
Invalidate current session

**Headers:**
```
Authorization: Bearer {token}
```

### User Management Endpoints

#### GET /api/users/profile
Get current user's profile

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "role": "Client",
  "profilePictureUrl": "https://example.com/profile.jpg",
  "bio": "Beauty enthusiast",
  "locationLat": 40.7128,
  "locationLng": -74.0060,
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

#### PUT /api/users/profile
Update user profile

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "fullName": "John Smith",
  "phoneNumber": "+1234567890",
  "bio": "Updated bio",
  "locationLat": 40.7128,
  "locationLng": -74.0060
}
```

#### GET /api/users/search
Search for users

**Query Parameters:**
- `query` (string): Search term
- `role` (string): Filter by role
- `page` (int): Page number
- `pageSize` (int): Items per page

### Service Management Endpoints

#### GET /api/services
Get all services with filtering

**Query Parameters:**
- `providerId` (int): Filter by provider
- `category` (string): Filter by category
- `minPrice` (decimal): Minimum price filter
- `maxPrice` (decimal): Maximum price filter
- `isActive` (bool): Filter by active status
- `page` (int): Page number
- `pageSize` (int): Items per page

**Response:**
```json
{
  "services": [
    {
      "id": 1,
      "providerId": 5,
      "name": "Haircut & Style",
      "description": "Professional haircut and styling",
      "price": 50.00,
      "estimatedDurationMinutes": 60,
      "isActive": true,
      "category": "Hair",
      "createdAt": "2023-01-01T00:00:00Z",
      "provider": {
        "id": 5,
        "fullName": "Jane Smith",
        "profilePictureUrl": "https://example.com/jane.jpg"
      }
    }
  ],
  "totalCount": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3
}
```

#### POST /api/services
Create a new service (Service Providers only)

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Manicure",
  "description": "Professional manicure service",
  "price": 30.00,
  "estimatedDurationMinutes": 45,
  "category": "Nails",
  "isActive": true
}
```

#### PUT /api/services/{id}
Update an existing service

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Premium Manicure",
  "description": "Luxury manicure with gel polish",
  "price": 45.00,
  "estimatedDurationMinutes": 60,
  "isActive": true
}
```

#### DELETE /api/services/{id}
Delete a service

**Headers:**
```
Authorization: Bearer {token}
```

### Appointment Management Endpoints

#### GET /api/appointments/available-slots
Get available time slots for booking

**Query Parameters:**
- `providerId` (int): Provider ID
- `date` (string): Date in YYYY-MM-DD format
- `serviceIds` (string): Comma-separated service IDs

**Response:**
```json
[
  {
    "startTime": "2023-01-01T09:00:00Z",
    "endTime": "2023-01-01T10:00:00Z",
    "isAvailable": true,
    "price": 50.00
  },
  {
    "startTime": "2023-01-01T10:00:00Z",
    "endTime": "2023-01-01T11:00:00Z",
    "isAvailable": false,
    "reason": "Already booked"
  }
]
```

#### POST /api/appointments
Create a new appointment

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "providerId": 5,
  "scheduledStartTime": "2023-01-01T09:00:00Z",
  "scheduledEndTime": "2023-01-01T10:00:00Z",
  "serviceIds": [1, 2],
  "notes": "First time client"
}
```

**Response:**
```json
{
  "id": 10,
  "clientId": 1,
  "providerId": 5,
  "scheduledStartTime": "2023-01-01T09:00:00Z",
  "scheduledEndTime": "2023-01-01T10:00:00Z",
  "status": "Pending",
  "totalPrice": 80.00,
  "notes": "First time client",
  "services": [
    {
      "serviceId": 1,
      "serviceName": "Haircut",
      "priceAtBooking": 50.00
    },
    {
      "serviceId": 2,
      "serviceName": "Styling",
      "priceAtBooking": 30.00
    }
  ]
}
```

#### GET /api/appointments
Get user's appointments

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (string): Filter by status
- `startDate` (string): Filter from date
- `endDate` (string): Filter to date
- `page` (int): Page number
- `pageSize` (int): Items per page

#### PUT /api/appointments/{id}/status
Update appointment status

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "Confirmed", // Pending, Confirmed, Cancelled, Completed, NoShow
  "notes": "Confirmed by provider"
}
```

### Social Features Endpoints

#### POST /api/social/follow
Follow or unfollow a user

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "userId": 5
}
```

**Response:**
```json
{
  "isFollowing": true,
  "followersCount": 150,
  "message": "Following user"
}
```

#### GET /api/social/users/{userId}/followers
Get user's followers

**Query Parameters:**
- `page` (int): Page number
- `pageSize` (int): Items per page

**Response:**
```json
{
  "followers": [
    {
      "id": 1,
      "fullName": "John Doe",
      "profilePictureUrl": "https://example.com/john.jpg",
      "followedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20
}
```

#### GET /api/social/users/{userId}/following
Get users that a user is following

#### GET /api/social/users/{userId}/stats
Get user's social statistics

**Response:**
```json
{
  "followersCount": 150,
  "followingCount": 75,
  "postsCount": 42,
  "isFollowing": true
}
```

### Content Management Endpoints

#### GET /api/content/feed
Get personalized content feed

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int): Page number
- `pageSize` (int): Items per page

**Response:**
```json
{
  "posts": [
    {
      "id": "post_1",
      "userId": 5,
      "content": "Check out this amazing transformation!",
      "mediaUrls": ["https://example.com/image1.jpg"],
      "likesCount": 25,
      "commentsCount": 8,
      "isLiked": false,
      "isSaved": false,
      "createdAt": "2023-01-01T00:00:00Z",
      "user": {
        "id": 5,
        "fullName": "Jane Smith",
        "profilePictureUrl": "https://example.com/jane.jpg"
      }
    }
  ],
  "hasMore": true,
  "page": 1,
  "pageSize": 10
}
```

#### POST /api/content/posts
Create a new post

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "Check out this amazing transformation!",
  "mediaUrls": ["https://example.com/image1.jpg"],
  "location": "New York, NY"
}
```

#### POST /api/content/posts/{postId}/like
Like or unlike a post

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "isLiked": true,
  "likesCount": 26
}
```

#### GET /api/content/posts/{postId}/comments
Get post comments

**Query Parameters:**
- `page` (int): Page number
- `pageSize` (int): Items per page

**Response:**
```json
{
  "comments": [
    {
      "id": "comment_1",
      "userId": 1,
      "content": "Looks amazing!",
      "likesCount": 3,
      "isLiked": false,
      "createdAt": "2023-01-01T00:00:00Z",
      "user": {
        "id": 1,
        "fullName": "John Doe",
        "profilePictureUrl": "https://example.com/john.jpg"
      },
      "replies": []
    }
  ],
  "totalCount": 8,
  "page": 1,
  "pageSize": 10
}
```

#### POST /api/content/posts/{postId}/comments
Add a comment to a post

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "Great work!",
  "parentCommentId": null // Optional for replies
}
```

### Chat Endpoints

#### GET /api/chat/conversations
Get user's conversations

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "conversations": [
    {
      "id": 1,
      "otherUser": {
        "id": 5,
        "fullName": "Jane Smith",
        "profilePictureUrl": "https://example.com/jane.jpg"
      },
      "lastMessage": {
        "content": "Thank you for the great service!",
        "sentAt": "2023-01-01T12:00:00Z",
        "isRead": true
      },
      "unreadCount": 0
    }
  ]
}
```

#### GET /api/chat/conversations/{conversationId}/messages
Get messages in a conversation

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int): Page number
- `pageSize` (int): Items per page

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "senderId": 1,
      "content": "Hello, I'd like to book an appointment",
      "sentAt": "2023-01-01T10:00:00Z",
      "isRead": true,
      "messageType": "Text"
    },
    {
      "id": 2,
      "senderId": 5,
      "content": "Hi! I'd be happy to help you",
      "sentAt": "2023-01-01T10:05:00Z",
      "isRead": true,
      "messageType": "Text"
    }
  ],
  "hasMore": false,
  "page": 1,
  "pageSize": 50
}
```

#### POST /api/chat/conversations/{conversationId}/messages
Send a message

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "Hello, I'd like to book an appointment",
  "messageType": "Text"
}
```

### Analytics Endpoints

#### GET /api/analytics/dashboard
Get provider dashboard analytics

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `period` (string): day, week, month, year
- `startDate` (string): Optional start date
- `endDate` (string): Optional end date

**Response:**
```json
{
  "totalRevenue": 2500.00,
  "totalAppointments": 45,
  "averageRating": 4.8,
  "completionRate": 95.5,
  "revenueGrowth": 15.2,
  "popularServices": [
    {
      "serviceId": 1,
      "serviceName": "Haircut & Style",
      "bookingCount": 20,
      "revenue": 1000.00
    }
  ],
  "revenueByPeriod": [
    {
      "period": "2023-01-01",
      "revenue": 250.00,
      "appointments": 5
    }
  ]
}
```

#### GET /api/analytics/earnings
Get earnings breakdown

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `period` (string): day, week, month, year

**Response:**
```json
{
  "totalEarnings": 2500.00,
  "availableForPayout": 2000.00,
  "pendingPayouts": 300.00,
  "processingFees": 200.00,
  "breakdown": [
    {
      "date": "2023-01-01",
      "earnings": 250.00,
      "appointments": 5
    }
  ]
}
```

### Notification Endpoints

#### GET /api/notifications
Get user notifications

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int): Page number
- `pageSize` (int): Items per page
- `unreadOnly` (bool): Show only unread notifications

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "AppointmentConfirmed",
      "title": "Appointment Confirmed",
      "message": "Your appointment with Jane Smith has been confirmed",
      "isRead": false,
      "createdAt": "2023-01-01T10:00:00Z",
      "data": {
        "appointmentId": 10,
        "providerId": 5
      }
    }
  ],
  "unreadCount": 3,
  "totalCount": 25,
  "page": 1,
  "pageSize": 20
}
```

#### POST /api/notifications/{id}/read
Mark notification as read

**Headers:**
```
Authorization: Bearer {token}
```

#### POST /api/notifications/read-all
Mark all notifications as read

**Headers:**
```
Authorization: Bearer {token}
```

---

## Database Schema

### Core Entities

#### Users Table
```sql
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Role NVARCHAR(20) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    PhoneNumber NVARCHAR(20),
    ProfilePictureUrl NVARCHAR(MAX),
    Bio NVARCHAR(MAX),
    LocationLat FLOAT,
    LocationLng FLOAT,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    INDEX IX_Users_Email (Email),
    INDEX IX_Users_Role (Role),
    INDEX IX_Users_Location (LocationLat, LocationLng)
);
```

#### Services Table
```sql
CREATE TABLE Services (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProviderId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    EstimatedDurationMinutes INT NOT NULL,
    Category NVARCHAR(50),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (ProviderId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX IX_Services_ProviderId (ProviderId),
    INDEX IX_Services_Category (Category),
    INDEX IX_Services_IsActive (IsActive)
);
```

#### Appointments Table
```sql
CREATE TABLE Appointments (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ClientId INT NOT NULL,
    ProviderId INT NOT NULL,
    ScheduledStartTime DATETIME2 NOT NULL,
    ScheduledEndTime DATETIME2 NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    TotalPrice DECIMAL(18,2),
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (ClientId) REFERENCES Users(Id),
    FOREIGN KEY (ProviderId) REFERENCES Users(Id),
    INDEX IX_Appointments_ClientId (ClientId),
    INDEX IX_Appointments_ProviderId (ProviderId),
    INDEX IX_Appointments_ScheduledStartTime (ScheduledStartTime),
    INDEX IX_Appointments_Status (Status)
);
```

#### AppointmentServices Table
```sql
CREATE TABLE AppointmentServices (
    Id INT PRIMARY KEY IDENTITY(1,1),
    AppointmentId INT NOT NULL,
    ServiceId INT NOT NULL,
    PriceAtBooking DECIMAL(18,2) NOT NULL,
    
    FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id) ON DELETE CASCADE,
    FOREIGN KEY (ServiceId) REFERENCES Services(Id),
    INDEX IX_AppointmentServices_AppointmentId (AppointmentId),
    INDEX IX_AppointmentServices_ServiceId (ServiceId)
);
```

#### Reviews Table
```sql
CREATE TABLE Reviews (
    Id INT PRIMARY KEY IDENTITY(1,1),
    AppointmentId INT NOT NULL,
    ClientId INT NOT NULL,
    ProviderId INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id),
    FOREIGN KEY (ClientId) REFERENCES Users(Id),
    FOREIGN KEY (ProviderId) REFERENCES Users(Id),
    INDEX IX_Reviews_ProviderId (ProviderId),
    INDEX IX_Reviews_Rating (Rating)
);
```

#### ContentPosts Table
```sql
CREATE TABLE ContentPosts (
    Id NVARCHAR(50) PRIMARY KEY,
    UserId INT NOT NULL,
    Content NVARCHAR(MAX),
    MediaUrls NVARCHAR(MAX), -- JSON array
    Location NVARCHAR(255),
    LikesCount INT NOT NULL DEFAULT 0,
    CommentsCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX IX_ContentPosts_UserId (UserId),
    INDEX IX_ContentPosts_CreatedAt (CreatedAt)
);
```

#### ContentLikes Table
```sql
CREATE TABLE ContentLikes (
    Id INT PRIMARY KEY IDENTITY(1,1),
    PostId NVARCHAR(50) NOT NULL,
    UserId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (PostId) REFERENCES ContentPosts(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    UNIQUE (PostId, UserId),
    INDEX IX_ContentLikes_PostId (PostId),
    INDEX IX_ContentLikes_UserId (UserId)
);
```

#### ContentComments Table
```sql
CREATE TABLE ContentComments (
    Id NVARCHAR(50) PRIMARY KEY,
    PostId NVARCHAR(50) NOT NULL,
    UserId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    ParentCommentId NVARCHAR(50),
    LikesCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (PostId) REFERENCES ContentPosts(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (ParentCommentId) REFERENCES ContentComments(Id),
    INDEX IX_ContentComments_PostId (PostId),
    INDEX IX_ContentComments_UserId (UserId),
    INDEX IX_ContentComments_ParentCommentId (ParentCommentId)
);
```

#### Followers Table
```sql
CREATE TABLE Followers (
    Id INT PRIMARY KEY IDENTITY(1,1),
    FollowerId INT NOT NULL,
    FollowedId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (FollowerId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (FollowedId) REFERENCES Users(Id),
    UNIQUE (FollowerId, FollowedId),
    INDEX IX_Followers_FollowerId (FollowerId),
    INDEX IX_Followers_FollowedId (FollowedId)
);
```

#### Conversations Table
```sql
CREATE TABLE Conversations (
    Id INT PRIMARY KEY IDENTITY(1,1),
    User1Id INT NOT NULL,
    User2Id INT NOT NULL,
    LastMessageId INT,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (User1Id) REFERENCES Users(Id),
    FOREIGN KEY (User2Id) REFERENCES Users(Id),
    UNIQUE (User1Id, User2Id),
    INDEX IX_Conversations_User1Id (User1Id),
    INDEX IX_Conversations_User2Id (User2Id)
);
```

#### Messages Table
```sql
CREATE TABLE Messages (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ConversationId INT NOT NULL,
    SenderId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    MessageType NVARCHAR(20) NOT NULL DEFAULT 'Text',
    IsRead BIT NOT NULL DEFAULT 0,
    SentAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (ConversationId) REFERENCES Conversations(Id) ON DELETE CASCADE,
    FOREIGN KEY (SenderId) REFERENCES Users(Id),
    INDEX IX_Messages_ConversationId (ConversationId),
    INDEX IX_Messages_SenderId (SenderId),
    INDEX IX_Messages_SentAt (SentAt)
);
```

#### AvailabilityRules Table
```sql
CREATE TABLE AvailabilityRules (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProviderId INT NOT NULL,
    DayOfWeek INT NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (ProviderId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX IX_AvailabilityRules_ProviderId (ProviderId),
    INDEX IX_AvailabilityRules_DayOfWeek (DayOfWeek)
);
```

#### TemporaryReservations Table
```sql
CREATE TABLE TemporaryReservations (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProviderId INT NOT NULL,
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2 NOT NULL,
    ClientId INT NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (ProviderId) REFERENCES Users(Id),
    FOREIGN KEY (ClientId) REFERENCES Users(Id),
    INDEX IX_TemporaryReservations_ProviderId (ProviderId),
    INDEX IX_TemporaryReservations_ExpiresAt (ExpiresAt)
);
```

### Relationships Overview

- **Users** have one-to-many relationships with **Services**, **Appointments** (as client and provider), **Reviews**, **ContentPosts**, and **Messages**
- **Services** belong to **Users** (providers) and can be linked to multiple **Appointments**
- **Appointments** connect **Users** (clients and providers) with **Services**
- **Reviews** are linked to **Appointments** and connect **Users**
- **ContentPosts** have many-to-many relationships with **Users** through **ContentLikes**
- **Followers** creates many-to-many relationships between **Users**
- **Conversations** connect two **Users** and contain multiple **Messages**

---

## Features & Functionality

### Core Features

#### User Authentication & Authorization
- **JWT-based authentication**: Secure token-based authentication system
- **Role-based access control**: Different permissions for clients and service providers
- **Password security**: Bcrypt hashing with salt for password storage
- **Session management**: Token refresh and logout functionality

#### Service Discovery
- **Location-based search**: Find providers within specified radius
- **Category filtering**: Search by service types (Hair, Nails, Beauty, etc.)
- **Price range filtering**: Find services within budget
- **Availability filtering**: Only show providers with available slots
- **Rating and review integration**: Quality-based sorting and filtering

#### Booking System
- **Real-time availability**: Live calendar integration showing available slots
- **Conflict prevention**: Automatic detection and prevention of booking conflicts
- **Time slot optimization**: Intelligent scheduling based on service duration
- **Temporary reservations**: Hold time slots during booking process
- **Multi-service booking**: Book multiple services in a single appointment

#### Social Features
- **Instagram-style feed**: Visual content sharing with likes and comments
- **Follow system**: Build connections between users and providers
- **Stories**: 24-hour ephemeral content sharing
- **Content discovery**: Explore new providers and services through social content
- **Engagement metrics**: Track likes, comments, and social interactions

#### Real-time Communication
- **In-app messaging**: Direct communication between clients and providers
- **Push notifications**: Real-time alerts for bookings, messages, and social activity
- **Typing indicators**: Live typing status in conversations
- **Message read receipts**: Delivery and read status tracking

#### Analytics & Business Intelligence
- **Revenue tracking**: Comprehensive financial reporting
- **Service performance**: Analysis of most popular services
- **Client insights**: Customer behavior and preferences
- **Growth metrics**: Business growth tracking and forecasting

### Advanced Features

#### AI-Powered Recommendations
- **Personalized service suggestions**: Machine learning-based recommendations
- **Optimal booking times**: AI-suggested time slots based on availability and preferences
- **Price optimization**: Dynamic pricing suggestions for maximum bookings
- **Smart notifications**: Intelligent notification timing and content

#### Provider Management Tools
- **Service portfolio management**: Create, edit, and organize service offerings
- **Availability management**: Set working hours, breaks, and time off
- **Client relationship management**: Track client history and preferences
- **Performance analytics**: Detailed business performance metrics

#### Advanced Search & Discovery
- **Geolocation services**: Automatic location detection and radius search
- **Advanced filters**: Multiple criteria search (price, rating, availability, distance)
- **Search history**: Remember and suggest previous searches
- **Trending content**: Popular services and providers in user's area

#### Quality Assurance
- **Review system**: Comprehensive rating and review system
- **Quality metrics**: Track service quality and customer satisfaction
- **Verification badges**: Verified provider status and credentials
- **Dispute resolution**: Built-in system for handling booking disputes

---

## Authentication & Security

### Authentication Flow

#### User Registration
1. User provides registration information (name, email, password, role)
2. System validates input and checks for existing accounts
3. Password is hashed using bcrypt with salt
4. User record is created in database
5. JWT token is generated and returned
6. User is automatically logged in

#### User Login
1. User provides email and password
2. System validates credentials against database
3. Password is verified using bcrypt
4. JWT token is generated with user claims
5. Token is returned to client for subsequent requests

#### Token Management
- **Token generation**: JWT tokens with 24-hour expiration
- **Token refresh**: Automatic token refresh mechanism
- **Token blacklisting**: Logout invalidates tokens
- **Role-based claims**: Tokens include user role and permissions

### Security Measures

#### Password Security
- **Bcrypt hashing**: Industry-standard password hashing algorithm
- **Salt generation**: Unique salt for each password
- **Password policies**: Minimum length and complexity requirements
- **Password reset**: Secure password reset flow via email

#### API Security
- **HTTPS enforcement**: All API communication encrypted
- **CORS configuration**: Controlled cross-origin requests
- **Rate limiting**: Prevent abuse and DDoS attacks
- **Input validation**: Comprehensive input sanitization

#### Data Protection
- **Personal data encryption**: Sensitive data encrypted at rest
- **Data access controls**: Role-based data access restrictions
- **Audit logging**: Track all data access and modifications
- **GDPR compliance**: Data protection and privacy compliance

#### Authorization
- **Role-based access**: Different permissions for clients and providers
- **Resource ownership**: Users can only access their own data
- **API endpoint protection**: Secure endpoints with proper authorization
- **Admin controls**: Administrative access for system management

---

## Real-time Features

### SignalR Integration

#### Chat System
- **Real-time messaging**: Instant message delivery between users
- **Connection management**: Automatic connection handling and reconnection
- **Message status**: Delivery and read receipts
- **Typing indicators**: Live typing status in conversations
- **Group messaging**: Support for group conversations

#### Live Notifications
- **Push notifications**: Real-time alerts for booking updates
- **Social notifications**: Likes, comments, and follow notifications
- **System notifications**: Important system updates and announcements
- **Notification preferences**: User-configurable notification settings

#### Real-time Updates
- **Booking status updates**: Live appointment status changes
- **Calendar synchronization**: Real-time availability updates
- **Social feed updates**: Live content updates in social feed
- **Analytics updates**: Real-time business metrics updates

### WebSocket Management

#### Connection Handling
- **Automatic reconnection**: Handle network interruptions gracefully
- **Connection pooling**: Efficient connection management
- **Heartbeat monitoring**: Detect and handle dead connections
- **Load balancing**: Distribute connections across servers

#### Performance Optimization
- **Message batching**: Group multiple updates for efficiency
- **Selective updates**: Only send relevant updates to users
- **Connection scaling**: Handle thousands of concurrent connections
- **Memory management**: Efficient memory usage for real-time features

---

## AI-Powered Features

### Recommendation Engine

#### Service Recommendations
- **Collaborative filtering**: Recommendations based on similar users
- **Content-based filtering**: Recommendations based on user preferences
- **Popularity-based recommendations**: Trending services and providers
- **Location-based recommendations**: Nearby high-quality services

#### Booking Optimization
- **Optimal time slots**: AI-suggested booking times
- **Price optimization**: Dynamic pricing recommendations
- **Service combinations**: Suggest complementary services
- **Rescheduling suggestions**: Optimal reschedule options

### Machine Learning Features

#### Personalization
- **User preference learning**: Adapt to user behavior over time
- **Search result optimization**: Personalized search rankings
- **Content curation**: Personalized social feed content
- **Notification optimization**: Intelligent notification timing

#### Business Intelligence
- **Demand forecasting**: Predict future booking patterns
- **Revenue optimization**: Pricing strategy recommendations
- **Customer segmentation**: Identify different user types
- **Churn prediction**: Identify at-risk users

### AI Assistant

#### Conversational Booking
- **Natural language processing**: Understand booking requests
- **Context awareness**: Remember conversation history
- **Multi-step booking**: Guide users through complex bookings
- **Fallback handling**: Graceful handling of unclear requests

#### Smart Suggestions
- **Proactive recommendations**: Suggest bookings before users search
- **Contextual help**: Provide relevant assistance based on user actions
- **Learning capabilities**: Improve suggestions over time
- **Feedback integration**: Learn from user acceptance/rejection

---

## Mobile App Architecture

### React Native Structure

#### Navigation Architecture
```
App
├── AuthStack (Unauthenticated)
│   ├── RoleSelection
│   ├── Login
│   └── Register
└── MainStack (Authenticated)
    ├── ClientTabs
    │   ├── FeedStack
    │   ├── SearchStack
    │   ├── BookingsStack
    │   ├── MessagesStack
    │   └── ProfileStack
    └── ProviderTabs
        ├── DashboardStack
        ├── ServicesStack
        ├── BookingsStack
        ├── MessagesStack
        └── ProfileStack
```

#### State Management
- **Context API**: Global state management for authentication and user data
- **React Query**: Server state management and caching
- **Local Storage**: Persistent storage for user preferences
- **Async Storage**: Secure storage for sensitive data

#### Component Architecture
- **Atomic Design**: Reusable components following atomic design principles
- **Theme System**: Consistent styling across the application
- **TypeScript**: Type-safe development for better maintainability
- **Custom Hooks**: Reusable logic extraction

### Key Components

#### Authentication Components
- **AuthContext**: Global authentication state management
- **ProtectedRoute**: Route protection based on authentication status
- **RoleGuard**: Role-based component access control
- **TokenManager**: JWT token handling and refresh

#### Booking Components
- **BookingFlow**: Multi-step booking process
- **TimeSlotPicker**: Interactive time slot selection
- **ServiceSelector**: Service selection with pricing
- **BookingConfirmation**: Confirmation and summary component

#### Social Components
- **FeedComponent**: Instagram-style post feed
- **PostCreator**: Content creation interface
- **CommentSystem**: Nested commenting functionality
- **UserProfile**: User profile display and management

#### Chat Components
- **ChatList**: Conversation list with unread indicators
- **ChatInterface**: Real-time messaging interface
- **MessageBubble**: Individual message display
- **TypingIndicator**: Live typing status

### Performance Optimization

#### Code Splitting
- **Lazy loading**: Load components when needed
- **Route-based splitting**: Split code by navigation routes
- **Component-level splitting**: Split large components
- **Third-party library optimization**: Load external libraries efficiently

#### Caching Strategy
- **API response caching**: Cache frequently accessed data
- **Image caching**: Optimize image loading and storage
- **Offline support**: Limited offline functionality
- **Background sync**: Sync data when connection is restored

#### Memory Management
- **Component cleanup**: Proper cleanup of event listeners and subscriptions
- **Memory leak prevention**: Avoid common React Native memory leaks
- **Image optimization**: Optimize images for mobile devices
- **Bundle size optimization**: Minimize app bundle size

---

## Development & Deployment

### Development Workflow

#### Version Control
- **Git branching strategy**: Feature branches with pull request workflow
- **Code review process**: Mandatory code reviews for all changes
- **Continuous integration**: Automated testing and building
- **Release management**: Tagged releases with changelog

#### Testing Strategy
- **Unit testing**: Component and service unit tests
- **Integration testing**: API endpoint testing
- **End-to-end testing**: User flow testing
- **Performance testing**: Load testing and performance monitoring

#### Quality Assurance
- **Code linting**: ESLint for JavaScript/TypeScript
- **Static analysis**: SonarQube for code quality analysis
- **Security scanning**: Automated security vulnerability scanning
- **Accessibility testing**: WCAG compliance testing

### Deployment Architecture

#### Backend Deployment
- **Containerization**: Docker containers for consistent deployment
- **Orchestration**: Kubernetes for container management
- **Load balancing**: NGINX for request distribution
- **Auto-scaling**: Automatic scaling based on traffic

#### Database Management
- **Migration strategy**: Automated database migrations
- **Backup strategy**: Regular automated backups
- **Performance monitoring**: Database performance tracking
- **Disaster recovery**: Comprehensive disaster recovery plan

#### Mobile App Deployment
- **App Store deployment**: iOS App Store and Google Play Store
- **Over-the-air updates**: CodePush for instant updates
- **Beta testing**: TestFlight and Google Play Console testing
- **Performance monitoring**: Crashlytics and performance tracking

### Monitoring & Analytics

#### Application Monitoring
- **Error tracking**: Real-time error monitoring and alerting
- **Performance monitoring**: Application performance metrics
- **User analytics**: User behavior tracking and analysis
- **Business metrics**: Key performance indicators tracking

#### Infrastructure Monitoring
- **Server monitoring**: CPU, memory, and disk usage monitoring
- **Network monitoring**: Network performance and availability
- **Database monitoring**: Database performance and query optimization
- **Security monitoring**: Security incident detection and response

---

## Conclusion

FYLA represents a comprehensive solution for the beauty and personal care industry, combining social media engagement with professional booking capabilities. The platform's architecture is designed for scalability, security, and user experience, providing both clients and service providers with powerful tools to connect, book, and manage their beauty services.

The system's modular design allows for future enhancements and integrations, while the AI-powered features provide competitive advantages in personalization and optimization. With robust security measures, real-time capabilities, and comprehensive analytics, FYLA is positioned to become the leading platform for beauty service discovery and booking.

This specification serves as a living document that will evolve with the platform's development and user feedback, ensuring that FYLA continues to meet the needs of both beauty professionals and their clients in an ever-changing digital landscape.
