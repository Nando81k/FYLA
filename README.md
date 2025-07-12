# FYLA – Find Your Local Artist

**FYLA** is a mobile app that merges the functionality of a service booking platform with the aesthetics and social features of Instagram. It allows users to connect with local beauty and grooming professionals, book services, explore media content, and communicate directly through an in-app chat.

---

## 🔧 Tech Stack

| Layer        | Technology              |
|--------------|--------------------------|
| Frontend     | React Native (TypeScript, Expo) |
| Backend      | ASP.NET Core (C#)        |
| Database     | SQL Server or PostgreSQL |
| Auth         | JWT (JSON Web Tokens)    |
| Chat         | SignalR (optional)       |
| Notifications| Firebase / OneSignal     |
| Maps         | Apple Maps API           |

---

## 📋 Product Specification

### 🎯 User Roles & Onboarding

- Users sign up as either:
  - **Client**
  - **Service Provider**
- Service providers select tags (e.g. Barber, Nail Tech, Esthetician)

---

### 👤 Client Features

- Explore Instagram-style feed
- Search providers by tag, distance, or availability
- Book services with cost summary and time slot selector
- Blocked time slots are grayed out and labeled "Already Booked"
- Follow/favorite providers and services
- Leave reviews after appointments
- Chat directly with providers
- View provider hours and get Apple Maps directions

---

### 🧑‍🎨 Service Provider Features

- Profile customization (tags, bio, hours, status)
- Add/edit services with name, price, duration, active status
- Upload posts & 24hr stories (Instagram-style)
- Accept/decline appointment requests
- Time slot locking based on service duration
- Appointment history and calendar
- Analytics dashboard:
  - Revenue (daily/weekly/monthly/yearly)
  - Most booked services
  - Total appointments

---

### 🔄 Shared Features

- Secure user authentication
- Role-based API access
- Real-time chat (via SignalR or similar)
- Push notifications
- Radius-based search using geolocation
- Live time slot filtering and booking conflict prevention

---

## 🚀 Recent Updates - Social Features

### Instagram-Style Feed & Content
- **Posts & Stories**: Full-featured Instagram-style feed with posts, stories, and content creation
- **Media Support**: Image and video uploads with multiple media per post
- **Real-time Interactions**: Like, comment, save, and share functionality
- **Feed Algorithm**: Personalized content feed based on following relationships

### Social Interactions
- **User Profiles**: Comprehensive user profiles with stats, bio, and post galleries
- **Follow System**: Follow/unfollow other users and service providers
- **Comments**: Threaded comments with replies and likes
- **Saves/Bookmarks**: Save posts to view later in dedicated saved posts screen
- **Notifications**: Real-time activity notifications for likes, comments, follows, and mentions

### Enhanced Navigation
- **Feed Stack**: Dedicated navigation stack for social features
- **Deep Linking**: Navigate between user profiles, posts, and comments
- **Grid/List Views**: Toggle between grid and list views for content
- **Profile Integration**: Access saved posts and notifications from profile

### Content Discovery
- **Stories Bar**: Horizontal stories with create story option
- **User Search**: Find and discover other users and service providers
- **Content Creation**: Full-featured post creation with media selection
- **Location Tagging**: Add location data to posts

### Technical Implementation
- **Mock/Real API Support**: Fallback system for development with real API integration
- **Type Safety**: Comprehensive TypeScript interfaces for all social features
- **Optimized Performance**: Infinite scroll, pull-to-refresh, and efficient rendering
- **Responsive Design**: Mobile-first design with consistent styling

### Developer Experience
- **Feature Flags**: Toggle between mock and real API endpoints
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Code Organization**: Modular architecture with reusable components
- **Testing Support**: Mock data generation for development and testing

---

## 🗂️ ERD (DBML for dbdiagram.io)

```dbml
Table users {
  id int [pk, increment]
  role varchar(20)
  full_name varchar
  email varchar [unique]
  password_hash varchar
  phone_number varchar
  profile_picture_url varchar
  bio text
  location_lat float
  location_lng float
  created_at datetime
  updated_at datetime
}

Table service_provider_tags {
  id int [pk, increment]
  name varchar
}

Table user_service_provider_tags {
  user_id int [ref: > users.id]
  tag_id int [ref: > service_provider_tags.id]
}

Table services {
  id int [pk, increment]
  provider_id int [ref: > users.id]
  name varchar
  description text
  price decimal
  estimated_duration_minutes int
  is_active boolean
  created_at datetime
}

Table posts {
  id int [pk, increment]
  provider_id int [ref: > users.id]
  image_url varchar
  caption text
  created_at datetime
}

Table stories {
  id int [pk, increment]
  provider_id int [ref: > users.id]
  media_url varchar
  created_at datetime
  expires_at datetime
}

Table appointments {
  id int [pk, increment]
  client_id int [ref: > users.id]
  provider_id int [ref: > users.id]
  scheduled_start_time datetime
  scheduled_end_time datetime
  status varchar(20)
  created_at datetime
  updated_at datetime
}

Table appointment_services {
  appointment_id int [ref: > appointments.id]
  service_id int [ref: > services.id]
  price_at_booking decimal
}

Table reviews {
  id int [pk, increment]
  appointment_id int [ref: > appointments.id]
  client_id int [ref: > users.id]
  provider_id int [ref: > users.id]
  rating int
  comment text
  created_at datetime
}

Table favorites {
  id int [pk, increment]
  client_id int [ref: > users.id]
  provider_id int [ref: > users.id]
}

Table followers {
  follower_id int [ref: > users.id]
  following_id int [ref: > users.id]
}

Table messages {
  id int [pk, increment]
  sender_id int [ref: > users.id]
  receiver_id int [ref: > users.id]
  message_text text
  sent_at datetime
  read_at datetime
}

Table business_analytics_snapshots {
  id int [pk, increment]
  provider_id int [ref: > users.id]
  date date
  total_revenue decimal
  most_requested_service_id int [ref: > services.id]
  total_appointments int
  created_at datetime
}
```
