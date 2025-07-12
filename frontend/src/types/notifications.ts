// Notification types for the FYLA app
export enum NotificationType {
  BOOKING_REQUEST = 'booking_request',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',
  MESSAGE_RECEIVED = 'message_received',
  NEW_FOLLOWER = 'new_follower',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
  PAYMENT_RECEIVED = 'payment_received',
  REVIEW_RECEIVED = 'review_received',
  PROMOTION = 'promotion',
  SYSTEM_UPDATE = 'system_update',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface NotificationAction {
  id: string;
  title: string;
  action: 'navigate' | 'api_call' | 'dismiss';
  params?: any;
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  
  // Optional metadata
  userId: number;
  relatedId?: string; // Post ID, Booking ID, etc.
  imageUrl?: string;
  actions?: NotificationAction[];
  
  // Navigation data
  screen?: string;
  params?: any;
  
  // Grouping
  group?: string;
  summary?: string;
}

export interface NotificationSettings {
  userId: number;
  
  // Push notification preferences
  pushEnabled: boolean;
  bookingNotifications: boolean;
  messageNotifications: boolean;
  socialNotifications: boolean;
  promotionalNotifications: boolean;
  
  // In-app notification preferences
  inAppEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
  
  // Email notifications
  emailEnabled: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  
  // SMS notifications
  smsEnabled: boolean;
  urgentSmsOnly: boolean;
}

export interface NotificationBadge {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export interface NotificationGroup {
  id: string;
  type: NotificationType;
  title: string;
  summary: string;
  count: number;
  latestNotification: NotificationData;
  notifications: NotificationData[];
  isExpanded: boolean;
}

export interface PushTokenData {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  userId: number;
  isActive: boolean;
  lastUsed: string;
}

export interface NotificationFilter {
  types?: NotificationType[];
  isRead?: boolean;
  priority?: NotificationPriority;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationResponse {
  notifications: NotificationData[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

// Real-time notification events
export interface NotificationEvent {
  type: 'new_notification' | 'notification_read' | 'notification_deleted' | 'batch_update';
  data: NotificationData | NotificationData[] | { ids: string[] };
  userId: number;
  timestamp: string;
}

// Notification template system
export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  variables: string[]; // Variables that can be replaced in title/body
}

export const NotificationTemplates: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.BOOKING_REQUEST]: {
    type: NotificationType.BOOKING_REQUEST,
    title: 'New Booking Request',
    body: '{{clientName}} wants to book {{serviceName}} on {{date}}',
    priority: NotificationPriority.HIGH,
    variables: ['clientName', 'serviceName', 'date'],
  },
  [NotificationType.BOOKING_CONFIRMED]: {
    type: NotificationType.BOOKING_CONFIRMED,
    title: 'Booking Confirmed',
    body: 'Your appointment with {{providerName}} is confirmed for {{date}}',
    priority: NotificationPriority.HIGH,
    variables: ['providerName', 'date'],
  },
  [NotificationType.BOOKING_CANCELLED]: {
    type: NotificationType.BOOKING_CANCELLED,
    title: 'Booking Cancelled',
    body: 'Your appointment with {{providerName}} has been cancelled',
    priority: NotificationPriority.HIGH,
    variables: ['providerName'],
  },
  [NotificationType.BOOKING_REMINDER]: {
    type: NotificationType.BOOKING_REMINDER,
    title: 'Appointment Reminder',
    body: 'Your appointment with {{providerName}} is in {{timeUntil}}',
    priority: NotificationPriority.MEDIUM,
    variables: ['providerName', 'timeUntil'],
  },
  [NotificationType.MESSAGE_RECEIVED]: {
    type: NotificationType.MESSAGE_RECEIVED,
    title: 'New Message',
    body: '{{senderName}}: {{messagePreview}}',
    priority: NotificationPriority.MEDIUM,
    variables: ['senderName', 'messagePreview'],
  },
  [NotificationType.NEW_FOLLOWER]: {
    type: NotificationType.NEW_FOLLOWER,
    title: 'New Follower',
    body: '{{followerName}} started following you',
    priority: NotificationPriority.LOW,
    variables: ['followerName'],
  },
  [NotificationType.POST_LIKED]: {
    type: NotificationType.POST_LIKED,
    title: 'Post Liked',
    body: '{{likerName}} liked your post',
    priority: NotificationPriority.LOW,
    variables: ['likerName'],
  },
  [NotificationType.POST_COMMENTED]: {
    type: NotificationType.POST_COMMENTED,
    title: 'New Comment',
    body: '{{commenterName}} commented on your post',
    priority: NotificationPriority.LOW,
    variables: ['commenterName'],
  },
  [NotificationType.PAYMENT_RECEIVED]: {
    type: NotificationType.PAYMENT_RECEIVED,
    title: 'Payment Received',
    body: 'You received ${{amount}} from {{clientName}}',
    priority: NotificationPriority.HIGH,
    variables: ['amount', 'clientName'],
  },
  [NotificationType.REVIEW_RECEIVED]: {
    type: NotificationType.REVIEW_RECEIVED,
    title: 'New Review',
    body: '{{reviewerName}} left you a {{rating}}-star review',
    priority: NotificationPriority.MEDIUM,
    variables: ['reviewerName', 'rating'],
  },
  [NotificationType.PROMOTION]: {
    type: NotificationType.PROMOTION,
    title: 'Special Offer',
    body: '{{offerTitle}} - {{offerDescription}}',
    priority: NotificationPriority.LOW,
    variables: ['offerTitle', 'offerDescription'],
  },
  [NotificationType.SYSTEM_UPDATE]: {
    type: NotificationType.SYSTEM_UPDATE,
    title: 'System Update',
    body: '{{updateTitle}} - {{updateDescription}}',
    priority: NotificationPriority.MEDIUM,
    variables: ['updateTitle', 'updateDescription'],
  },
};
