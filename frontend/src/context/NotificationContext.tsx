import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { useNavigation } from '@react-navigation/native';
import { 
  NotificationData, 
  NotificationBadge, 
  NotificationSettings,
  NotificationType 
} from '../types/notifications';
import { UserRole } from '../types/index';

interface NotificationContextType {
  // Basic state
  isInitialized: boolean;
  hasPermission: boolean;
  pushToken: string | null;
  badgeCount: number;
  
  // Enhanced notification state
  notifications: NotificationData[];
  unreadCount: number;
  badgeData: NotificationBadge;
  settings: NotificationSettings | null;
  isConnected: boolean;
  isLoading: boolean;
  
  // Actions
  initializeNotifications: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  updateBadgeCount: (count: number) => Promise<void>;
  getBadgeCount: () => Promise<number>;
  clearBadge: () => Promise<void>;
  sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
  scheduleAppointmentReminder: (appointmentId: number, providerName: string, appointmentDate: Date) => Promise<void>;
  
  // Enhanced methods
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotifications: (notificationIds: string[]) => Promise<void>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  handleNotificationTapped: (notification: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, token: authToken } = useAuth();
  const navigation = useNavigation();
  
  // Basic state
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  
  // Enhanced notification state
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeData, setBadgeData] = useState<NotificationBadge>({
    total: 0,
    unread: 0,
    byType: {} as Record<NotificationType, number>,
  });
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && authToken) {
      initializeNotifications();
    }
  }, [user, authToken]);

  useEffect(() => {
    setupNotificationListeners();
    
    return () => {
      // Cleanup listeners
      notificationService.off('navigateToChat', handleNavigateToChat);
      notificationService.off('navigateToAppointment', handleNavigateToAppointment);
      notificationService.off('navigateToBookings', handleNavigateToBookings);
      notificationService.off('newNotification', handleNewNotification);
      notificationService.off('notificationRead', handleNotificationRead);
      notificationService.off('notificationDeleted', handleNotificationDeleted);
      notificationService.off('badgeUpdated', handleBadgeUpdated);
      notificationService.off('websocketConnected', handleWebSocketConnected);
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);
      await notificationService.initialize();
      
      const pushToken = notificationService.getPushToken();
      const permission = notificationService.hasNotificationPermission();
      const currentBadgeCount = await notificationService.getBadgeCount();
      
      setPushToken(pushToken);
      setHasPermission(permission);
      setBadgeCount(currentBadgeCount);
      
      if (user) {
        // Load enhanced notification data
        await Promise.all([
          loadNotifications(),
          loadSettings(),
          loadBadgeData(),
        ]);
      }
      
      setIsInitialized(true);
      
      // Register push token with backend using our notification service
      if (pushToken && user && permission && authToken) {
        try {
          await notificationService.registerPushToken(pushToken);
          console.log('Push token registered successfully');
        } catch (error) {
          console.error('Failed to register push token with backend:', error);
        }
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setIsInitialized(true); // Still mark as initialized even if failed
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await notificationService.getNotifications({
        limit: 50,
        offset: 0,
      });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const userSettings = await notificationService.getNotificationSettings(user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const loadBadgeData = async () => {
    if (!user) return;
    
    try {
      const badge = await notificationService.getBadgeData(user.id);
      setBadgeData(badge);
    } catch (error) {
      console.error('Failed to load badge data:', error);
    }
  };

  const setupNotificationListeners = () => {
    notificationService.on('navigateToChat', handleNavigateToChat);
    notificationService.on('navigateToAppointment', handleNavigateToAppointment);
    notificationService.on('navigateToBookings', handleNavigateToBookings);
    notificationService.on('notificationReceived', handleNotificationReceived);
    
    // Enhanced listeners
    notificationService.on('newNotification', handleNewNotification);
    notificationService.on('notificationRead', handleNotificationRead);
    notificationService.on('notificationDeleted', handleNotificationDeleted);
    notificationService.on('badgeUpdated', handleBadgeUpdated);
    notificationService.on('websocketConnected', handleWebSocketConnected);
  };

  // Enhanced event handlers
  const handleNewNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    setBadgeCount(prev => prev + 1);
    
    // Update badge data
    setBadgeData(prev => ({
      total: prev.total + 1,
      unread: prev.unread + 1,
      byType: {
        ...prev.byType,
        [notification.type]: (prev.byType[notification.type] || 0) + 1,
      },
    }));
  };

  const handleNotificationRead = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(n =>
        notificationIds.includes(n.id) ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
  };

  const handleNotificationDeleted = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.filter(n => !notificationIds.includes(n.id))
    );
    
    const deletedUnreadCount = notifications.filter(
      n => notificationIds.includes(n.id) && !n.isRead
    ).length;
    
    setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
  };

  const handleBadgeUpdated = (newBadgeData: NotificationBadge) => {
    setBadgeData(newBadgeData);
    setUnreadCount(newBadgeData.unread);
    setBadgeCount(newBadgeData.unread);
  };

  const handleWebSocketConnected = () => {
    setIsConnected(true);
  };

  const handleNavigateToChat = (data: { conversationId: number; otherUser: any }) => {
    (navigation as any).navigate('Chat', {
      conversationId: data.conversationId,
      otherUser: data.otherUser,
    });
  };

  const handleNavigateToAppointment = (data: { appointmentId: number }) => {
    // Navigate to appointment details or calendar
    if (user && 'role' in user && user.role === UserRole.PROVIDER) {
      (navigation as any).navigate('Calendar');
    } else {
      (navigation as any).navigate('Bookings');
    }
  };

  const handleNavigateToBookings = (data: { bookingId: number }) => {
    (navigation as any).navigate('Bookings');
  };

  const handleNotificationReceived = (notification: any) => {
    // Update badge count when notification is received
    updateBadgeCount(badgeCount + 1);
  };

  const requestPermission = async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
    return granted;
  };

  const updateBadgeCount = async (count: number): Promise<void> => {
    await notificationService.setBadgeCount(count);
    setBadgeCount(count);
  };

  const getBadgeCount = async (): Promise<number> => {
    return await notificationService.getBadgeCount();
  };

  const clearBadge = async (): Promise<void> => {
    await notificationService.clearBadge();
    setBadgeCount(0);
  };

  const sendLocalNotification = async (title: string, body: string, data?: any): Promise<void> => {
    const notification = notificationService.createNotificationFromTemplate(
      NotificationType.SYSTEM_UPDATE,
      { updateTitle: title, updateDescription: body },
      user?.id || 1,
      undefined,
      { screen: data?.screen, params: data?.params }
    );
    
    await notificationService.sendLocalNotification(notification);
  };

  const scheduleAppointmentReminder = async (
    appointmentId: number,
    providerName: string,
    appointmentDate: Date
  ): Promise<void> => {
    // Schedule reminder 1 hour before appointment
    await notificationService.scheduleAppointmentReminder(
      providerName,
      appointmentDate,
      appointmentId,
      60 // 60 minutes before
    );
    
    // Schedule reminder 15 minutes before appointment
    await notificationService.scheduleAppointmentReminder(
      providerName,
      appointmentDate,
      appointmentId,
      15 // 15 minutes before
    );
  };

  // Enhanced methods
  const refreshNotifications = async () => {
    await loadNotifications();
    await loadBadgeData();
  };

  const markAsRead = async (notificationIds: string[]) => {
    await notificationService.markAsRead(notificationIds);
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    await notificationService.deleteNotifications(notificationIds);
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    await notificationService.updateNotificationSettings(newSettings);
    setSettings(newSettings);
  };

  const handleNotificationTapped = (notification: NotificationData) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }

    // Navigate to appropriate screen
    if (notification.screen && notification.params) {
      (navigation as any).navigate(notification.screen, notification.params);
    }
  };

  const value: NotificationContextType = {
    // Basic state
    isInitialized,
    hasPermission,
    pushToken,
    badgeCount,
    
    // Enhanced notification state
    notifications,
    unreadCount,
    badgeData,
    settings,
    isConnected,
    isLoading,
    
    // Basic actions
    initializeNotifications,
    requestPermission,
    updateBadgeCount,
    getBadgeCount,
    clearBadge,
    sendLocalNotification,
    scheduleAppointmentReminder,
    
    // Enhanced methods
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    updateSettings,
    handleNotificationTapped,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Enhanced hooks
export const useNotificationBadge = () => {
  const { badgeData, unreadCount } = useNotifications();
  return { badgeData, unreadCount };
};

export const useNotificationSettings = () => {
  const { settings, updateSettings } = useNotifications();
  return { settings, updateSettings };
};
