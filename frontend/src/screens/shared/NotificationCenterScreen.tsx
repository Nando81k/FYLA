import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { 
  NotificationData, 
  NotificationType, 
  NotificationFilter, 
  NotificationGroup,
  NotificationPriority 
} from '../../types/notifications';
import { notificationService } from '../../services/notificationService';

type RootStackParamList = {
  Chat: { conversationId: string; otherUser: any };
  AppointmentDetails: { appointmentId: string };
  BookingDetails: { bookingId: string };
  ReviewDetails: { appointmentId: string; rating: number };
  EarningsDetails: { paymentId: string };
  NotificationPreferences: undefined;
};

const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<NotificationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [groupByType, setGroupByType] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotifications();
    setupNotificationListeners();
    
    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  useEffect(() => {
    if (groupByType) {
      groupNotificationsByType();
    }
  }, [notifications, groupByType]);

  const setupNotificationListeners = () => {
    notificationService.on('newNotification', (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationService.on('notificationRead', (notificationIds: string[]) => {
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
    });

    notificationService.on('notificationDeleted', (notificationIds: string[]) => {
      setNotifications(prev => 
        prev.filter(n => !notificationIds.includes(n.id))
      );
    });
  };

  const loadNotifications = async () => {
    try {
      const filter: NotificationFilter = {};
      
      if (selectedFilter !== 'all') {
        filter.isRead = selectedFilter === 'read';
      }
      
      if (selectedType !== 'all') {
        filter.types = [selectedType];
      }

      const response = await notificationService.getNotifications(filter);
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadNotifications();
  }, [selectedFilter, selectedType]);

  const groupNotificationsByType = () => {
    const groups: { [key: string]: NotificationData[] } = {};
    
    notifications.forEach(notification => {
      const type = notification.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(notification);
    });

    const groupedData: NotificationGroup[] = Object.entries(groups).map(([type, notifs]) => {
      const unreadCount = notifs.filter(n => !n.isRead).length;
      return {
        id: type,
        type: type as NotificationType,
        title: getTypeDisplayName(type as NotificationType),
        summary: `${notifs.length} notification${notifs.length > 1 ? 's' : ''}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`,
        count: notifs.length,
        latestNotification: notifs[0],
        notifications: notifs,
        isExpanded: false,
      };
    });

    setGroupedNotifications(groupedData);
  };

  const getTypeDisplayName = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.BOOKING_REQUEST:
        return 'Booking Requests';
      case NotificationType.BOOKING_CONFIRMED:
        return 'Booking Confirmations';
      case NotificationType.BOOKING_CANCELLED:
        return 'Booking Cancellations';
      case NotificationType.BOOKING_REMINDER:
        return 'Appointment Reminders';
      case NotificationType.MESSAGE_RECEIVED:
        return 'Messages';
      case NotificationType.NEW_FOLLOWER:
        return 'New Followers';
      case NotificationType.POST_LIKED:
        return 'Post Likes';
      case NotificationType.POST_COMMENTED:
        return 'Post Comments';
      case NotificationType.PAYMENT_RECEIVED:
        return 'Payments';
      case NotificationType.REVIEW_RECEIVED:
        return 'Reviews';
      case NotificationType.PROMOTION:
        return 'Promotions';
      case NotificationType.SYSTEM_UPDATE:
        return 'System Updates';
      default:
        return 'Notifications';
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

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    if (selectionMode) {
      toggleNotificationSelection(notification.id);
      return;
    }

    // Mark as read if not already
    if (!notification.isRead) {
      await notificationService.markAsRead([notification.id]);
    }

    // Navigate to appropriate screen
    if (notification.screen && notification.params) {
      navigation.navigate(notification.screen as any, notification.params);
    }
  };

  const handleNotificationLongPress = (notification: NotificationData) => {
    setSelectionMode(true);
    setSelectedNotifications(new Set([notification.id]));
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      
      if (newSet.size === 0) {
        setSelectionMode(false);
      }
      
      return newSet;
    });
  };

  const handleMarkSelectedAsRead = async () => {
    const selectedIds = Array.from(selectedNotifications);
    await notificationService.markAsRead(selectedIds);
    setSelectionMode(false);
    setSelectedNotifications(new Set());
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Array.from(selectedNotifications);
    
    Alert.alert(
      'Delete Notifications',
      `Are you sure you want to delete ${selectedIds.length} notification${selectedIds.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await notificationService.deleteNotifications(selectedIds);
            setSelectionMode(false);
            setSelectedNotifications(new Set());
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };

  const toggleGroupExpansion = (groupId: string) => {
    setGroupedNotifications(prev =>
      prev.map(group =>
        group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  };

  const renderNotificationItem = ({ item }: { item: NotificationData }) => {
    const isSelected = selectedNotifications.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification,
          isSelected && styles.selectedNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleNotificationLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getTypeIcon(item.type) as any}
                size={24}
                color={getPriorityColor(item.priority)}
              />
            </View>
            
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>
                {item.title}
              </Text>
              <Text style={styles.notificationBody} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTime(item.createdAt)}
              </Text>
            </View>

            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.notificationImage} />
            )}

            {!item.isRead && <View style={styles.unreadIndicator} />}
            
            {selectionMode && (
              <View style={styles.selectionIndicator}>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isSelected ? '#8B5CF6' : '#9CA3AF'}
                />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupHeader = ({ section }: { section: NotificationGroup }) => (
    <TouchableOpacity
      style={styles.groupHeader}
      onPress={() => toggleGroupExpansion(section.id)}
    >
      <View style={styles.groupHeaderContent}>
        <Ionicons
          name={getTypeIcon(section.type) as any}
          size={20}
          color="#8B5CF6"
        />
        <Text style={styles.groupTitle}>{section.title}</Text>
        <Text style={styles.groupSummary}>{section.summary}</Text>
      </View>
      <Ionicons
        name={section.isExpanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#6B7280"
      />
    </TouchableOpacity>
  );

  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      <View style={styles.filterButtons}>
        {(['all', 'unread', 'read'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.activeFilterButton,
            ]}
            onPress={() => {
              setSelectedFilter(filter);
              setIsLoading(true);
              loadNotifications();
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.activeFilterButtonText,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.groupToggle}
        onPress={() => setGroupByType(!groupByType)}
      >
        <Ionicons
          name={groupByType ? 'list' : 'albums'}
          size={20}
          color="#8B5CF6"
        />
      </TouchableOpacity>
    </View>
  );

  const renderSelectionBar = () => (
    <View style={styles.selectionBar}>
      <TouchableOpacity
        style={styles.selectionAction}
        onPress={() => {
          setSelectionMode(false);
          setSelectedNotifications(new Set());
        }}
      >
        <Text style={styles.selectionActionText}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.selectionCount}>
        {selectedNotifications.size} selected
      </Text>

      <View style={styles.selectionActions}>
        <TouchableOpacity
          style={styles.selectionAction}
          onPress={handleMarkSelectedAsRead}
        >
          <Ionicons name="checkmark" size={20} color="#8B5CF6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectionAction}
          onPress={handleDeleteSelected}
        >
          <Ionicons name="trash" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <View style={styles.headerActions}>
          {!selectionMode && (
            <>
              <TouchableOpacity
                style={styles.headerAction}
                onPress={handleMarkAllAsRead}
              >
                <Ionicons name="checkmark-done" size={24} color="#8B5CF6" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerAction}
                onPress={() => navigation.navigate('NotificationPreferences')}
              >
                <Ionicons name="settings" size={24} color="#6B7280" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {selectionMode ? renderSelectionBar() : renderFilterBar()}

      {/* Notifications List */}
      {groupByType ? (
        <SectionList
          sections={groupedNotifications.map(group => ({
            ...group,
            data: group.isExpanded ? group.notifications : [],
          }))}
          renderItem={renderNotificationItem}
          renderSectionHeader={renderGroupHeader}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>
                You're all caught up! Check back later for new notifications.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 16,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  groupToggle: {
    padding: 8,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectionAction: {
    padding: 8,
  },
  selectionActionText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  selectionCount: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadNotification: {
    backgroundColor: '#F8FAFF',
  },
  selectedNotification: {
    backgroundColor: '#EEF2FF',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  selectionIndicator: {
    marginLeft: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  groupSummary: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default NotificationCenterScreen;
