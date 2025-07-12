import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  PanGestureHandler,
  State,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationData, NotificationType, NotificationPriority } from '../../types/notifications';
import { useNotifications } from '../../context/NotificationContext';

interface InAppNotificationBannerProps {
  notification: NotificationData | null;
  onDismiss: () => void;
  onPress?: () => void;
  duration?: number; // Auto-dismiss duration in ms
}

const { width: screenWidth } = Dimensions.get('window');

const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notification,
  onDismiss,
  onPress,
  duration = 4000,
}) => {
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { handleNotificationTapped } = useNotifications();

  useEffect(() => {
    if (notification) {
      showNotification();
      
      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification, duration]);

  const showNotification = () => {
    setVisible(true);
    
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: -100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      translateX.setValue(0); // Reset horizontal position
      onDismiss();
    });
  };

  const handlePress = () => {
    if (notification) {
      hideNotification();
      if (onPress) {
        onPress();
      } else {
        handleNotificationTapped(notification);
      }
    }
  };

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handlePanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // If swiped more than 30% of screen width or with high velocity, dismiss
      if (Math.abs(translationX) > screenWidth * 0.3 || Math.abs(velocityX) > 1000) {
        // Animate out in the direction of the swipe
        const toValue = translationX > 0 ? screenWidth : -screenWidth;
        
        Animated.parallel([
          Animated.timing(translateX, {
            toValue,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
          translateX.setValue(0);
          onDismiss();
        });
      } else {
        // Snap back to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const getTypeIcon = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.BOOKING_REQUEST:
      case NotificationType.BOOKING_CONFIRMED:
      case NotificationType.BOOKING_CANCELLED:
        return 'calendar';
      case NotificationType.BOOKING_REMINDER:
        return 'alarm';
      case NotificationType.MESSAGE_RECEIVED:
        return 'chatbubble';
      case NotificationType.NEW_FOLLOWER:
        return 'person-add';
      case NotificationType.POST_LIKED:
        return 'heart';
      case NotificationType.POST_COMMENTED:
        return 'chatbubble-ellipses';
      case NotificationType.PAYMENT_RECEIVED:
        return 'card';
      case NotificationType.REVIEW_RECEIVED:
        return 'star';
      case NotificationType.PROMOTION:
        return 'gift';
      case NotificationType.SYSTEM_UPDATE:
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getPriorityColor = (priority: NotificationPriority): string => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return '#EF4444';
      case NotificationPriority.HIGH:
        return '#F97316';
      case NotificationPriority.MEDIUM:
        return '#3B82F6';
      case NotificationPriority.LOW:
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getBorderColor = (priority: NotificationPriority): string => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return '#FEE2E2';
      case NotificationPriority.HIGH:
        return '#FED7AA';
      case NotificationPriority.MEDIUM:
        return '#DBEAFE';
      case NotificationPriority.LOW:
        return '#F3F4F6';
      default:
        return '#F3F4F6';
    }
  };

  if (!visible || !notification) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={handlePanGestureEvent}
        onHandlerStateChange={handlePanHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.notification,
            {
              borderLeftColor: getPriorityColor(notification.priority),
              backgroundColor: getBorderColor(notification.priority),
            },
            {
              transform: [
                { translateY },
                { translateX },
              ],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={getTypeIcon(notification.type) as any}
                size={24}
                color={getPriorityColor(notification.priority)}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {notification.body}
              </Text>
            </View>

            {notification.imageUrl && (
              <Image
                source={{ uri: notification.imageUrl }}
                style={styles.image}
              />
            )}

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={hideNotification}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50, // Account for status bar
    paddingHorizontal: 16,
  },
  notification: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  dismissButton: {
    padding: 4,
  },
});

export default InAppNotificationBanner;
