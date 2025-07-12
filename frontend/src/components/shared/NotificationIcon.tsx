import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBadge from './NotificationBadge';
import InAppNotificationBanner from './InAppNotificationBanner';
import { NotificationData } from '../../types/notifications';

interface NotificationIconProps {
  color?: string;
  size?: number;
  style?: any;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({
  color = '#1F2937',
  size = 24,
  style,
}) => {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  const handlePress = () => {
    (navigation as any).navigate('Notifications');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.iconContainer, style]}>
      <View>
        <Ionicons name="notifications" size={size} color={color} />
        {unreadCount > 0 && (
          <NotificationBadge size="small" style={styles.badge} />
        )}
      </View>
    </TouchableOpacity>
  );
};

// Global notification manager component that should be placed at the root of your app
export const NotificationManager: React.FC = () => {
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);
  const { settings } = useNotifications();

  useEffect(() => {
    // You would set up listeners here to receive notifications from the service
    // For now, this is a placeholder for demonstration
    
    // Example of how you might handle receiving a new notification:
    // notificationService.on('newNotification', (notification: NotificationData) => {
    //   if (settings?.inAppEnabled) {
    //     setCurrentNotification(notification);
    //   }
    // });
  }, [settings]);

  const handleDismissNotification = () => {
    setCurrentNotification(null);
  };

  const handleNotificationPress = () => {
    setCurrentNotification(null);
    // Handle navigation or other actions
  };

  return (
    <InAppNotificationBanner
      notification={currentNotification}
      onDismiss={handleDismissNotification}
      onPress={handleNotificationPress}
      duration={5000}
    />
  );
};

// Example usage in tab bar icon
export const TabBarNotificationIcon: React.FC<{ focused: boolean; color: string; size: number }> = ({
  focused,
  color,
  size,
}) => {
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.tabIconContainer}>
      <Ionicons 
        name={focused ? 'notifications' : 'notifications-outline'} 
        size={size} 
        color={color} 
      />
      {unreadCount > 0 && (
        <NotificationBadge 
          size="small" 
          style={styles.tabBadge}
          maxCount={9}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
});

export default NotificationIcon;
