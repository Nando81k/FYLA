import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '@/theme/ThemeProvider';
import {
  Booking,
  BookingStatus,
  BookingFilter,
  BookingStats,
  WaitlistEntry,
} from '../../types/booking';

const { width } = Dimensions.get('window');

const BookingManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    bookings,
    bookingStats,
    waitlistEntries,
    loading,
    error,
    fetchBookings,
    fetchBookingStats,
    fetchWaitlistEntries,
    updateBookingStatus,
    rescheduleBooking,
    removeFromWaitlist,
    clearError,
  } = useBooking();
  const { showNotification } = useNotifications();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  // Create styles with theme
  const createStyles = (colors: any, typography: any, spacing: any, borderRadius: any, shadows: any) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.textSecondary,
    },
    header: {
      backgroundColor: colors.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xs,
      marginBottom: spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: borderRadius.md,
    },
    activeTab: {
      backgroundColor: colors.primary,
      ...shadows.sm,
    },
    tabText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.textInverse,
      fontWeight: typography.weights.semibold,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: typography.sizes.md,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    filterButton: {
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      marginLeft: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginHorizontal: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    statValue: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    bookingCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.md,
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    bookingClient: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text,
    },
    bookingStatus: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
      color: colors.textInverse,
    },
    bookingDetails: {
      marginBottom: spacing.sm,
    },
    bookingService: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    bookingDateTime: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    bookingPrice: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.primary,
    },
    bookingActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    actionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.text,
    },
    primaryActionButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    primaryActionButtonText: {
      color: colors.textInverse,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    emptyText: {
      fontSize: typography.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    closeButton: {
      padding: spacing.sm,
    },
    errorBanner: {
      backgroundColor: colors.error,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    errorText: {
      color: colors.textInverse,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
    },
    // Additional missing styles
    content: {
      flex: 1,
      padding: spacing.md,
    },
    todayBookingCard: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    dateTimeSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    dateTimeContainer: {
      flex: 1,
    },
    dateText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text,
    },
    todayText: {
      color: colors.primary,
    },
    timeText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    todayTimeText: {
      color: colors.primary,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
      color: colors.white,
    },
    clientInfoSection: {
      marginBottom: spacing.sm,
    },
    clientDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    clientName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    durationText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    servicesList: {
      marginBottom: spacing.sm,
    },
    serviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    serviceName: {
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    servicePrice: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.primary,
    },
    bookingFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    totalAmount: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    notesContainer: {
      marginTop: spacing.sm,
      padding: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
    },
    notesLabel: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    notesText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    waitlistCard: {
      backgroundColor: colors.card,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    waitlistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    waitlistClient: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text,
    },
    waitlistDate: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    waitlistServices: {
      marginBottom: spacing.sm,
    },
    waitlistServicesLabel: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    waitlistServicesText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    waitlistPreference: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    waitlistActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    waitlistActionButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
    },
    waitlistContactButton: {
      backgroundColor: colors.primary,
    },
    waitlistContactText: {
      color: colors.white,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
    },
    waitlistRemoveButton: {
      backgroundColor: colors.error,
    },
    waitlistRemoveText: {
      color: colors.white,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
    },
    tabButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: borderRadius.sm,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabButtonText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    tabButtonTextActive: {
      color: colors.white,
    },
    tabBadge: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      marginLeft: spacing.xs,
    },
    tabBadgeText: {
      color: colors.white,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyStateTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    emptyStateMessage: {
      fontSize: typography.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
  });

  const styles = createStyles(colors, typography, spacing, borderRadius, shadows);

  // State
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming' | 'past' | 'waitlist'>('today');
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed' | 'cancelled' | 'waitlist'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>([]);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date().toISOString().split('T')[0],
    to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Helper functions
  const getFilteredData = () => {
    let data = activeTab === 'waitlist' ? waitlistEntries : bookings;
    
    if (searchQuery) {
      data = data.filter((item: any) => 
        item.client?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.services?.some((service: any) => 
          service.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    return data || [];
  };

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadData();
      }
    }, [user?.id, selectedTab])
  );

  const loadData = async () => {
    if (!user?.id) return;

    const filter = buildFilter();
    await Promise.all([
      fetchBookings(filter),
      fetchBookingStats(user.id, dateRange.from, dateRange.to),
      selectedTab === 'waitlist' && fetchWaitlistEntries(undefined, user.id),
    ]);
  };

  const buildFilter = (): BookingFilter => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let filter: BookingFilter = {
      providerId: user?.id,
      limit: 50,
      sortBy: 'date',
      sortOrder: 'asc',
    };

    switch (selectedTab) {
      case 'today':
        filter.dateFrom = today;
        filter.dateTo = today;
        filter.status = [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];
        break;
      case 'upcoming':
        filter.dateFrom = tomorrow;
        filter.status = [BookingStatus.CONFIRMED, BookingStatus.PENDING];
        break;
      case 'past':
        filter.dateTo = today;
        filter.status = [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW];
        filter.sortOrder = 'desc';
        break;
    }

    if (statusFilter.length > 0) {
      filter.status = statusFilter;
    }

    if (dateRange.from && dateRange.to) {
      filter.dateFrom = dateRange.from;
      filter.dateTo = dateRange.to;
    }

    return filter;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (booking: Booking, newStatus: BookingStatus) => {
    const success = await updateBookingStatus(booking.id, newStatus);
    
    if (success) {
      showNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Booking status changed to ${newStatus}`,
      });
      loadData(); // Refresh data
    }
  };

  const handleReschedule = async (booking: Booking, newDateTime: string) => {
    const success = await rescheduleBooking(booking.id, newDateTime);
    
    if (success) {
      showNotification({
        type: 'success',
        title: 'Booking Rescheduled',
        message: 'The booking has been rescheduled successfully',
      });
      loadData();
    }
  };

  const handleRemoveFromWaitlist = async (entry: WaitlistEntry) => {
    Alert.alert(
      'Remove from Waitlist',
      'Are you sure you want to remove this client from the waitlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFromWaitlist(entry.id);
            if (success) {
              showNotification({
                type: 'success',
                title: 'Removed from Waitlist',
                message: 'Client has been removed from the waitlist',
              });
              loadData();
            }
          },
        },
      ]
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.client.fullName.toLowerCase().includes(query) ||
      booking.services.some(service => service.name.toLowerCase().includes(query)) ||
      booking.id.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return '#34C759';
      case BookingStatus.PENDING:
        return '#FF9500';
      case BookingStatus.IN_PROGRESS:
        return '#007AFF';
      case BookingStatus.COMPLETED:
        return '#8E8E93';
      case BookingStatus.CANCELLED:
        return '#FF3B30';
      case BookingStatus.NO_SHOW:
        return '#FF2D92';
      case BookingStatus.RESCHEDULED:
        return '#AF52DE';
      default:
        return '#8E8E93';
    }
  };

  const getStatusActions = (booking: Booking): Array<{ title: string; status: BookingStatus; color: string }> => {
    const actions = [];
    
    switch (booking.status) {
      case BookingStatus.PENDING:
        actions.push(
          { title: 'Confirm', status: BookingStatus.CONFIRMED, color: '#34C759' },
          { title: 'Cancel', status: BookingStatus.CANCELLED, color: '#FF3B30' }
        );
        break;
      case BookingStatus.CONFIRMED:
        actions.push(
          { title: 'Start', status: BookingStatus.IN_PROGRESS, color: '#007AFF' },
          { title: 'Cancel', status: BookingStatus.CANCELLED, color: '#FF3B30' },
          { title: 'No Show', status: BookingStatus.NO_SHOW, color: '#FF2D92' }
        );
        break;
      case BookingStatus.IN_PROGRESS:
        actions.push(
          { title: 'Complete', status: BookingStatus.COMPLETED, color: '#34C759' }
        );
        break;
    }
    
    return actions;
  };

  const renderStatsCard = () => {
    if (!bookingStats) return null;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bookingStats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>{bookingStats.confirmedBookings}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>{bookingStats.pendingBookings}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#007AFF' }]}>${bookingStats.revenue.total.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </ScrollView>
    );
  };

  const renderBookingCard = ({ item: booking }: { item: Booking }) => {
    const appointmentDate = new Date(booking.scheduledDateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = appointmentDate.toDateString() === today.toDateString();
    const isTomorrow = appointmentDate.toDateString() === tomorrow.toDateString();
    
    let dateDisplay = '';
    if (isToday) {
      dateDisplay = 'Today';
    } else if (isTomorrow) {
      dateDisplay = 'Tomorrow';
    } else {
      dateDisplay = appointmentDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    const timeDisplay = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return (
      <TouchableOpacity
        style={[styles.bookingCard, isToday && styles.todayBookingCard]}
        onPress={() => {
          setSelectedBooking(booking);
          setShowBookingDetails(true);
        }}
      >
        {/* Prominent Date & Time Section */}
        <View style={styles.dateTimeSection}>
          <View style={styles.dateTimeContainer}>
            <Text style={[styles.dateText, isToday && styles.todayText]}>{dateDisplay}</Text>
            <Text style={[styles.timeText, isToday && styles.todayTimeText]}>{timeDisplay}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{booking.status}</Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfoSection}>
          <View style={styles.clientDetails}>
            <Ionicons name="person" size={16} color="#6b7280" />
            <Text style={styles.clientName}>{booking.client.fullName}</Text>
          </View>
          <Text style={styles.durationText}>{booking.duration} min</Text>
        </View>

        {/* Services */}
        <View style={styles.servicesList}>
          {booking.services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>${service.price}</Text>
            </View>
          ))}
        </View>

        {/* Footer with Total and Actions */}
        <View style={styles.bookingFooter}>
          <Text style={styles.totalAmount}>Total: ${booking.totalAmount.toFixed(2)}</Text>
          <View style={styles.actionButtons}>
            {getStatusActions(booking).map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, { backgroundColor: action.color }]}
                onPress={() => handleStatusUpdate(booking, action.status)}
              >
                <Text style={styles.actionButtonText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {booking.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderWaitlistCard = ({ item: entry }: { item: WaitlistEntry }) => (
    <View style={styles.waitlistCard}>
      <View style={styles.waitlistHeader}>
        <Text style={styles.waitlistClient}>Client ID: {entry.clientId}</Text>
        <Text style={styles.waitlistDate}>
          Added: {new Date(entry.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.waitlistServices}>
        <Text style={styles.waitlistServicesLabel}>Requested Services:</Text>
        <Text style={styles.waitlistServicesText}>
          {entry.serviceIds.join(', ')}
        </Text>
      </View>

      {entry.preferredDateTime && (
        <Text style={styles.waitlistPreference}>
          Preferred: {new Date(entry.preferredDateTime).toLocaleString()}
        </Text>
      )}

      {entry.preferredTimeSlots && entry.preferredTimeSlots.length > 0 && (
        <Text style={styles.waitlistPreference}>
          Time Slots: {entry.preferredTimeSlots.join(', ')}
        </Text>
      )}

      <View style={styles.waitlistActions}>
        <TouchableOpacity
          style={[styles.waitlistActionButton, styles.waitlistContactButton]}
          onPress={() => {
            // TODO: Navigate to chat or contact client
            showNotification({
              type: 'info',
              title: 'Contact Client',
              message: 'Contact feature coming soon',
            });
          }}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
          <Text style={styles.waitlistContactText}>Contact</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.waitlistActionButton, styles.waitlistRemoveButton]}
          onPress={() => handleRemoveFromWaitlist(entry)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          <Text style={styles.waitlistRemoveText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabButton = (
    tab: 'today' | 'upcoming' | 'past' | 'waitlist',
    title: string,
    count?: number
  ) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[styles.tabButtonText, selectedTab === tab && styles.tabButtonTextActive]}>
        {title}
      </Text>
      {count !== undefined && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={selectedTab === 'waitlist' ? 'hourglass-outline' : 'calendar-outline'}
        size={64}
        color="#C7C7CC"
      />
      <Text style={styles.emptyStateTitle}>
        {selectedTab === 'waitlist' ? 'No Waitlist Entries' : 'No Bookings'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {selectedTab === 'waitlist'
          ? 'Clients will appear here when they join your waitlist'
          : 'Bookings will appear here when clients schedule appointments'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Management</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {renderStatsCard()}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {renderTabs()}
      {renderContent()}
    </SafeAreaView>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {['active', 'upcoming', 'completed', 'cancelled', 'waitlist'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    const filteredData = getFilteredData();
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      );
    }

    if (filteredData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No bookings found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredData.map((item) => (
          activeTab === 'waitlist' 
            ? renderWaitlistItem(item) 
            : renderBookingItem(item)
        ))}
      </ScrollView>
    );
  };
};

export default BookingManagementScreen;
