# Real-time Notifications System Documentation

## Overview

The FYLA app now includes a comprehensive real-time notifications system with the following features:

- **Push Notifications**: Receive notifications even when the app is closed
- **In-App Notifications**: Banners and alerts while using the app
- **Notification Center**: View and manage all notifications
- **Notification Preferences**: Customize notification settings
- **Badge Counts**: Real-time badge updates on tab bars and icons
- **WebSocket Integration**: Real-time notification delivery

## Architecture

### Core Components

1. **Types** (`/types/notifications.ts`)
   - `NotificationData`: Core notification structure
   - `NotificationSettings`: User preference settings
   - `NotificationBadge`: Badge count data
   - `NotificationTemplates`: Predefined notification templates

2. **Service** (`/services/notificationService.ts`)
   - Expo push notification integration
   - WebSocket real-time updates
   - API communication
   - Local notification management
   - Template-based notification creation

3. **Context** (`/context/NotificationContext.tsx`)
   - Global notification state management
   - Real-time event handling
   - Badge count management
   - Settings synchronization

4. **Screens**
   - `NotificationCenterScreen`: Main notification management interface
   - `NotificationPreferencesScreen`: Settings and preferences

5. **Components**
   - `NotificationBadge`: Badge indicator component
   - `InAppNotificationBanner`: In-app notification display
   - `NotificationIcon`: Tab bar and header icons with badges

## Setup and Integration

### 1. Initialize the Notification Provider

Wrap your app with the `NotificationProvider`:

```tsx
import { NotificationProvider } from './src/context/NotificationContext';

function App() {
  const { user } = useAuth();
  
  return (
    <NotificationProvider userId={user?.id || 0}>
      {/* Your app content */}
    </NotificationProvider>
  );
}
```

### 2. Add Notification Screens to Navigation

The notification screens are already integrated into the navigation:

- `Notifications`: Main notification center
- `NotificationPreferences`: Settings screen

### 3. Use Notification Components

#### Tab Bar Icon with Badge
```tsx
import { TabBarNotificationIcon } from '../components/shared/NotificationIcon';

// In your tab navigator
{
  name: "Notifications",
  component: NotificationsScreen,
  options: {
    tabBarIcon: ({ focused, color, size }) => (
      <TabBarNotificationIcon focused={focused} color={color} size={size} />
    ),
  },
}
```

#### Header Notification Icon
```tsx
import NotificationIcon from '../components/shared/NotificationIcon';

// In your screen header
<NotificationIcon color="#1F2937" size={24} />
```

#### In-App Notification Banner
```tsx
import { NotificationManager } from '../components/shared/NotificationIcon';

// Place at the root of your app
function App() {
  return (
    <>
      {/* Your app content */}
      <NotificationManager />
    </>
  );
}
```

### 4. Using Notification Hooks

#### Get Badge Count
```tsx
import { useNotificationBadge } from '../context/NotificationContext';

function MyComponent() {
  const { unreadCount, badgeData } = useNotificationBadge();
  
  return (
    <Text>You have {unreadCount} unread notifications</Text>
  );
}
```

#### Get Notification Settings
```tsx
import { useNotificationSettings } from '../context/NotificationContext';

function SettingsComponent() {
  const { settings, updateSettings } = useNotificationSettings();
  
  const togglePushNotifications = async () => {
    if (settings) {
      await updateSettings({
        ...settings,
        pushEnabled: !settings.pushEnabled,
      });
    }
  };
}
```

#### Full Notification Context
```tsx
import { useNotifications } from '../context/NotificationContext';

function NotificationComponent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    deleteNotifications,
    refreshNotifications,
  } = useNotifications();
  
  // Use notification data and methods
}
```

## Notification Types

The system supports the following notification types:

- `BOOKING_REQUEST`: New booking requests
- `BOOKING_CONFIRMED`: Booking confirmations
- `BOOKING_CANCELLED`: Booking cancellations
- `BOOKING_REMINDER`: Appointment reminders
- `MESSAGE_RECEIVED`: New messages
- `NEW_FOLLOWER`: New followers
- `POST_LIKED`: Post likes
- `POST_COMMENTED`: Post comments
- `PAYMENT_RECEIVED`: Payment notifications
- `REVIEW_RECEIVED`: New reviews
- `PROMOTION`: Promotional offers
- `SYSTEM_UPDATE`: System updates

## Sending Notifications

### Using Templates
```tsx
import { notificationService } from '../services/notificationService';
import { NotificationType } from '../types/notifications';

// Send a booking confirmation
const notification = notificationService.createNotificationFromTemplate(
  NotificationType.BOOKING_CONFIRMED,
  {
    providerName: 'Sarah Johnson',
    date: 'December 15, 2024 at 2:00 PM',
  },
  userId,
  bookingId,
  {
    screen: 'BookingDetails',
    params: { bookingId },
  }
);

await notificationService.sendLocalNotification(notification);
```

### Using Helper Methods
```tsx
// Send message notification
await notificationService.notifyNewMessage(
  'John Doe',
  'Hey, are we still on for tomorrow?',
  conversationId,
  otherUser
);

// Send booking request notification
await notificationService.notifyBookingRequest(
  'Emily Davis',
  'Hair Styling',
  'Dec 15, 2024',
  bookingId
);

// Schedule appointment reminder
await notificationService.scheduleAppointmentReminder(
  'Sarah Johnson',
  new Date('2024-12-15T14:00:00'),
  appointmentId,
  60 // 60 minutes before
);
```

## WebSocket Integration

The notification service automatically connects to a WebSocket for real-time updates:

```typescript
// WebSocket URL format
const wsUrl = 'ws://localhost:3000/notifications';

// Handles these event types:
- 'new_notification': New notification received
- 'notification_read': Notification marked as read
- 'notification_deleted': Notification deleted
- 'batch_update': Multiple notifications updated
```

## API Endpoints

The service expects these backend endpoints:

### Push Token Management
- `POST /api/notifications/register-token`: Register push token
- `DELETE /api/notifications/unregister-token`: Unregister push token

### Notifications
- `GET /api/notifications`: Get notifications with filters
- `PATCH /api/notifications/mark-read`: Mark notifications as read
- `PATCH /api/notifications/mark-all-read`: Mark all as read
- `DELETE /api/notifications`: Delete notifications

### Settings
- `GET /api/notifications/settings/:userId`: Get user settings
- `PUT /api/notifications/settings`: Update user settings

### Badge Data
- `GET /api/notifications/badge/:userId`: Get badge counts

## Configuration

### Environment Variables
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Expo Configuration
Make sure your `app.json` includes:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#8B5CF6",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

## Testing

### Testing Push Notifications

1. **Physical Device Required**: Push notifications only work on physical devices, not simulators
2. **Expo Dev Client**: Use Expo Dev Client, not Expo Go
3. **Test Token Registration**: Verify push tokens are registered with your backend
4. **Test API Endpoints**: Use tools like Postman to test notification endpoints

### Mock Data

The notification service includes mock data for development:

```tsx
// Enable mock mode for testing
const notifications = await notificationService.getNotifications();
// Returns sample notifications with various types and priorities
```

## Troubleshooting

### Common Issues

1. **Notifications Not Showing**
   - Check device permissions
   - Verify push token registration
   - Ensure using physical device, not simulator

2. **Badge Counts Not Updating**
   - Check WebSocket connection
   - Verify API endpoints are working
   - Ensure context is properly initialized

3. **In-App Notifications Not Appearing**
   - Check notification settings
   - Verify `NotificationManager` is included in app root
   - Check if quiet hours are enabled

4. **Navigation Not Working**
   - Verify screen names match navigation types
   - Check navigation stack configuration
   - Ensure proper parameter passing

### Debug Tools

1. **Console Logs**: The service logs important events
2. **Redux DevTools**: Use with the notification context
3. **Network Tab**: Monitor API calls and WebSocket connections
4. **Expo Dev Tools**: Check push notification status

## Best Practices

1. **Permission Handling**: Always request permissions gracefully
2. **Batch Operations**: Use batch APIs for multiple notifications
3. **Error Handling**: Implement proper error handling for network issues
4. **Performance**: Limit notification history and implement pagination
5. **User Experience**: Respect user preferences and quiet hours
6. **Testing**: Test on real devices with actual push notifications

## Future Enhancements

1. **Rich Notifications**: Add images, actions, and rich content
2. **Notification Analytics**: Track delivery and engagement metrics
3. **Advanced Grouping**: Smart notification grouping and summarization
4. **Scheduled Notifications**: More complex scheduling options
5. **Integration**: Connect with external notification services
6. **Offline Support**: Queue notifications for offline users
