import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotificationBadge } from '../../context/NotificationContext';

interface NotificationBadgeProps {
  style?: any;
  badgeStyle?: any;
  textStyle?: any;
  maxCount?: number;
  showZero?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  style,
  badgeStyle,
  textStyle,
  maxCount = 99,
  showZero = false,
  size = 'medium',
}) => {
  const { unreadCount } = useNotificationBadge();

  if (!showZero && unreadCount === 0) {
    return null;
  }

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.badge, sizeStyles.badge, badgeStyle, style]}>
      <Text style={[styles.badgeText, sizeStyles.text, textStyle]}>
        {displayCount}
      </Text>
    </View>
  );
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        badge: {
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          paddingHorizontal: 4,
        },
        text: {
          fontSize: 10,
          lineHeight: 12,
        },
      };
    case 'large':
      return {
        badge: {
          minWidth: 24,
          height: 24,
          borderRadius: 12,
          paddingHorizontal: 6,
        },
        text: {
          fontSize: 14,
          lineHeight: 16,
        },
      };
    default: // medium
      return {
        badge: {
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          paddingHorizontal: 5,
        },
        text: {
          fontSize: 12,
          lineHeight: 14,
        },
      };
  }
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -8,
    right: -8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  badgeText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationBadge;
