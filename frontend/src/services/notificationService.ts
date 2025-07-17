import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { API_CONFIG } from '@/config/api';
import { 
  NotificationData, 
  NotificationType, 
  NotificationSettings, 
  NotificationBadge, 
  NotificationGroup, 
  NotificationFilter, 
  NotificationResponse, 
  NotificationEvent, 
  NotificationTemplates,
  PushTokenData,
  NotificationPriority
} from '../types/notifications';

export interface ScheduledNotification {
  id: string;
  trigger: Date;
  content: NotificationData;
}

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private hasPermission = false;
  private listeners: { [key: string]: Function[] } = {};
  private webSocket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseUrl = API_CONFIG.baseURL; // Use the same API config as other services

  async initialize(): Promise<void> {
    try {
      // Register for push notifications
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.expoPushToken = token;
        this.hasPermission = true;
        console.log('✅ Push notification token:', token.substring(0, 20) + '...');
        
        // Register token with backend
        try {
          await this.registerPushToken(token);
        } catch (error) {
          console.warn('⚠️  Failed to register push token with backend:', error);
        }
      } else {
        console.warn('⚠️  Push notifications not available (development mode)');
        this.expoPushToken = null;
        this.hasPermission = false;
      }

      // Set up notification listeners
      this.setupNotificationListeners();
      
      // TODO: Connect to SignalR for real-time notifications
      // Currently disabled due to SignalR client library not configured
      // this.connectWebSocket();
      
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      // Don't throw, just log the error and continue
      this.expoPushToken = null;
      this.hasPermission = false;
    }
  }

  // WebSocket connection for real-time notifications
  private connectWebSocket(): void {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/notifications';
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onopen = () => {
        console.log('Notification WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('websocketConnected', {});
      };

      this.webSocket.onmessage = (event) => {
        try {
          const notificationEvent: NotificationEvent = JSON.parse(event.data);
          this.handleWebSocketNotification(notificationEvent);
        } catch (error) {
          console.error('Failed to parse WebSocket notification:', error);
        }
      };

      this.webSocket.onclose = () => {
        console.log('Notification WebSocket disconnected');
        this.isConnected = false;
        this.handleWebSocketReconnect();
      };

      this.webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.handleWebSocketReconnect();
    }
  }

  private handleWebSocketReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      console.log(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    }
  }

  private handleWebSocketNotification(event: NotificationEvent): void {
    switch (event.type) {
      case 'new_notification':
        const notification = event.data as NotificationData;
        this.emit('newNotification', notification);
        this.updateBadgeCount();
        break;
      
      case 'notification_read':
        this.emit('notificationRead', event.data);
        this.updateBadgeCount();
        break;
      
      case 'notification_deleted':
        this.emit('notificationDeleted', event.data);
        this.updateBadgeCount();
        break;
      
      case 'batch_update':
        this.emit('batchUpdate', event.data);
        this.updateBadgeCount();
        break;
    }
  }

  // API Methods
  async registerPushToken(token: string): Promise<void> {
    try {
      const tokenData: Partial<PushTokenData> = {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Device.modelId || 'unknown',
        isActive: true,
        lastUsed: new Date().toISOString(),
      };

      const response = await fetch(`${this.baseUrl}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenData),
      });

      if (!response.ok) {
        throw new Error('Failed to register push token');
      }
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }
  }

  async getNotifications(filter?: NotificationFilter): Promise<NotificationResponse> {
    try {
      const params = new URLSearchParams();
      if (filter?.types) params.append('types', filter.types.join(','));
      if (filter?.isRead !== undefined) params.append('isRead', filter.isRead.toString());
      if (filter?.priority) params.append('priority', filter.priority);
      if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter?.dateTo) params.append('dateTo', filter.dateTo);
      if (filter?.limit) params.append('limit', filter.limit.toString());
      if (filter?.offset) params.append('offset', filter.offset.toString());

      const response = await fetch(`${this.baseUrl}/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️  Notifications API not available, using mock data (development mode)');
      // Return mock data for development
      return this.getMockNotifications(filter);
    }
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/mark-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      this.emit('notificationsMarkedRead', notificationIds);
      this.updateBadgeCount();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/mark-all-read`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      this.emit('allNotificationsMarkedRead', {});
      this.setBadgeCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async deleteNotifications(notificationIds: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notifications');
      }

      this.emit('notificationsDeleted', notificationIds);
      this.updateBadgeCount();
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  }

  async getNotificationSettings(userId: number): Promise<NotificationSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/settings/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️  Notification settings API not available, using defaults (development mode)');
      // Return default settings
      return this.getDefaultNotificationSettings(userId);
    }
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      this.emit('notificationSettingsUpdated', settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  async getBadgeData(userId: number): Promise<NotificationBadge> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/badge/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch badge data');
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️  Badge data API not available, using mock data (development mode)');
      // Return mock badge data
      return {
        total: 0,
        unread: 0,
        byType: {} as Record<NotificationType, number>,
      };
    }
  }

  // Mock data methods for development
  private getMockNotifications(filter?: NotificationFilter): NotificationResponse {
    const mockNotifications: NotificationData[] = [
      {
        id: '1',
        type: NotificationType.BOOKING_REQUEST,
        title: 'New Booking Request',
        body: 'Sarah Johnson wants to book Hair Styling on Dec 15, 2024',
        priority: NotificationPriority.HIGH,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        userId: 1,
        relatedId: 'booking_123',
        imageUrl: 'https://example.com/avatar1.jpg',
        screen: 'BookingDetails',
        params: { bookingId: 'booking_123' },
      },
      {
        id: '2',
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        body: 'Emily Davis: "Thank you for the amazing service!"',
        priority: NotificationPriority.MEDIUM,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        userId: 1,
        relatedId: 'chat_456',
        imageUrl: 'https://example.com/avatar2.jpg',
        screen: 'Chat',
        params: { conversationId: 'chat_456' },
      },
      {
        id: '3',
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Payment Received',
        body: 'You received $85.00 from Michael Brown',
        priority: NotificationPriority.HIGH,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        userId: 1,
        relatedId: 'payment_789',
        screen: 'EarningsDetails',
        params: { paymentId: 'payment_789' },
      },
    ];

    let filteredNotifications = mockNotifications;

    if (filter?.types) {
      filteredNotifications = filteredNotifications.filter(n => filter.types!.includes(n.type));
    }

    if (filter?.isRead !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isRead === filter.isRead);
    }

    if (filter?.priority) {
      filteredNotifications = filteredNotifications.filter(n => n.priority === filter.priority);
    }

    const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

    return {
      notifications: filteredNotifications,
      total: filteredNotifications.length,
      unreadCount,
      hasMore: false,
    };
  }

  private getDefaultNotificationSettings(userId: number): NotificationSettings {
    return {
      userId,
      pushEnabled: true,
      bookingNotifications: true,
      messageNotifications: true,
      socialNotifications: true,
      promotionalNotifications: false,
      inAppEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      emailEnabled: true,
      dailyDigest: false,
      weeklyDigest: true,
      smsEnabled: false,
      urgentSmsOnly: true,
    };
  }

  // Template-based notification creation
  createNotificationFromTemplate(
    type: NotificationType,
    variables: Record<string, string>,
    userId: number,
    relatedId?: string,
    additionalData?: any
  ): NotificationData {
    const template = NotificationTemplates[type];
    if (!template) {
      throw new Error(`No template found for notification type: ${type}`);
    }

    let title = template.title;
    let body = template.body;

    // Replace variables in title and body
    template.variables.forEach(variable => {
      const value = variables[variable] || '';
      title = title.replace(`{{${variable}}}`, value);
      body = body.replace(`{{${variable}}}`, value);
    });

    return {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      body,
      priority: template.priority,
      isRead: false,
      createdAt: new Date().toISOString(),
      userId,
      relatedId,
      ...additionalData,
    };
  }

  async updateBadgeCount(): Promise<void> {
    try {
      // Get current user ID (you'd implement this based on your auth system)
      const userId = 1; // Placeholder
      const badgeData = await this.getBadgeData(userId);
      await this.setBadgeCount(badgeData.unread);
      this.emit('badgeUpdated', badgeData);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  private async registerForPushNotificationsAsync(): Promise<string | null> {
    // Skip push notifications in development if project ID is placeholder
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                     (Constants.expoConfig as any)?.projectId ||
                     Constants.manifest?.extra?.eas?.projectId;
    
    if (!projectId || projectId === '550e8400-e29b-41d4-a716-446655440000') {
      console.warn('🚨 Push notifications disabled: Using placeholder project ID');
      console.warn('To enable push notifications, update the projectId in app.json');
      return null;
    }

    if (!Device.isDevice) {
      console.warn('🚨 Push notifications disabled: Not running on physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('🚨 Push notifications disabled: Permission not granted');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B5CF6',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointments',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'default',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      this.emit('notificationReceived', notification);
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    switch (data?.type) {
      case 'message':
        this.emit('navigateToChat', {
          conversationId: data.conversationId,
          otherUser: data.otherUser,
        });
        break;
      
      case 'appointment':
        this.emit('navigateToAppointment', {
          appointmentId: data.appointmentId,
        });
        break;
      
      case 'booking':
        this.emit('navigateToBookings', {
          bookingId: data.bookingId,
        });
        break;
      
      default:
        this.emit('notificationTapped', data);
        break;
    }
  }

  // Send local notification
  async sendLocalNotification(notificationData: NotificationData): Promise<string> {
    if (!this.hasPermission) {
      console.warn('No notification permission');
      return '';
    }

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            notificationId: notificationData.id,
            type: notificationData.type,
            relatedId: notificationData.relatedId,
            screen: notificationData.screen,
            params: notificationData.params,
          },
          sound: 'default',
          categoryIdentifier: notificationData.type,
        },
        trigger: null, // Show immediately
      });

      return identifier;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return '';
    }
  }

  // Schedule notification for later
  async scheduleNotification(
    notificationData: NotificationData,
    trigger: Date
  ): Promise<string> {
    if (!this.hasPermission) {
      console.warn('No notification permission');
      return '';
    }

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            notificationId: notificationData.id,
            type: notificationData.type,
            relatedId: notificationData.relatedId,
            screen: notificationData.screen,
            params: notificationData.params,
          },
          sound: 'default',
          categoryIdentifier: notificationData.type,
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, (trigger.getTime() - Date.now()) / 1000),
          repeats: false,
        },
      });

      return identifier;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return '';
    }
  }

  // Cancel scheduled notification
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // Notification helpers for different types
  async notifyNewMessage(senderName: string, message: string, conversationId: number, otherUser: any): Promise<void> {
    const notification = this.createNotificationFromTemplate(
      NotificationType.MESSAGE_RECEIVED,
      { senderName, messagePreview: message },
      1, // userId placeholder
      conversationId.toString(),
      {
        screen: 'Chat',
        params: { conversationId, otherUser },
      }
    );

    await this.sendLocalNotification(notification);
  }

  async notifyAppointmentConfirmed(providerName: string, date: string, appointmentId: number): Promise<void> {
    const notification = this.createNotificationFromTemplate(
      NotificationType.BOOKING_CONFIRMED,
      { providerName, date },
      1, // userId placeholder
      appointmentId.toString(),
      {
        screen: 'AppointmentDetails',
        params: { appointmentId },
      }
    );

    await this.sendLocalNotification(notification);
  }

  async notifyAppointmentCancelled(providerName: string, date: string, appointmentId: number): Promise<void> {
    const notification = this.createNotificationFromTemplate(
      NotificationType.BOOKING_CANCELLED,
      { providerName },
      1, // userId placeholder
      appointmentId.toString(),
      {
        screen: 'AppointmentDetails',
        params: { appointmentId },
      }
    );

    await this.sendLocalNotification(notification);
  }

  async scheduleAppointmentReminder(
    providerName: string,
    appointmentDate: Date,
    appointmentId: number,
    reminderMinutes: number = 60
  ): Promise<string> {
    const reminderTime = new Date(appointmentDate.getTime() - reminderMinutes * 60 * 1000);
    const timeUntil = `${reminderMinutes} minutes`;
    
    const notification = this.createNotificationFromTemplate(
      NotificationType.BOOKING_REMINDER,
      { providerName, timeUntil },
      1, // userId placeholder
      appointmentId.toString(),
      {
        screen: 'AppointmentDetails',
        params: { appointmentId },
      }
    );

    return await this.scheduleNotification(notification, reminderTime);
  }

  async notifyBookingRequest(clientName: string, serviceName: string, date: string, bookingId: number): Promise<void> {
    const notification = this.createNotificationFromTemplate(
      NotificationType.BOOKING_REQUEST,
      { clientName, serviceName, date },
      1, // userId placeholder
      bookingId.toString(),
      {
        screen: 'BookingDetails',
        params: { bookingId },
      }
    );

    await this.sendLocalNotification(notification);
  }

  async notifyReviewReceived(reviewerName: string, rating: number, appointmentId: number): Promise<void> {
    const notification = this.createNotificationFromTemplate(
      NotificationType.REVIEW_RECEIVED,
      { reviewerName, rating: rating.toString() },
      1, // userId placeholder
      appointmentId.toString(),
      {
        screen: 'ReviewDetails',
        params: { appointmentId, rating },
      }
    );

    await this.sendLocalNotification(notification);
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification event callback:', error);
        }
      });
    }
  }

  // Get push token for backend registration
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  hasNotificationPermission(): boolean {
    return this.hasPermission;
  }

  // Request permission again if denied
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
