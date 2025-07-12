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
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { useNotifications } from '@/context/NotificationContext';
import {
  Booking,
  BookingStatus,
  BookingFilter,
  BookingStats,
  WaitlistEntry,
} from '@/types/booking';

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

  // State
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming' | 'past' | 'waitlist'>('today');
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

  const renderBookingCard = ({ item: booking }: { item: Booking }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
      }}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{booking.client.fullName}</Text>
          <Text style={styles.bookingTime}>
            {new Date(booking.scheduledDateTime).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.servicesList}>
        {booking.services.map((service, index) => (
          <Text key={index} style={styles.serviceName}>
            • {service.name} (${service.price})
          </Text>
        ))}
      </View>

      <View style={styles.bookingFooter}>
        <Text style={styles.totalAmount}>${booking.totalAmount.toFixed(2)}</Text>
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

      <View style={styles.tabsContainer}>
        {renderTabButton('today', 'Today', bookingStats?.confirmedBookings)}
        {renderTabButton('upcoming', 'Upcoming')}
        {renderTabButton('past', 'Past')}
        {renderTabButton('waitlist', 'Waitlist', waitlistEntries.length)}
      </View>

      <FlatList
        data={selectedTab === 'waitlist' ? waitlistEntries : filteredBookings}
        renderItem={selectedTab === 'waitlist' ? renderWaitlistCard : renderBookingCard}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          loading.bookings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            renderEmptyState()
          )
        }
      />

      {/* Booking Details Modal */}
      <Modal
        visible={showBookingDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBookingDetails(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          {selectedBooking && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Client Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.client.fullName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.client.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.client.phone}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Appointment Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedBooking.scheduledDateTime).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.duration} minutes</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                    <Text style={styles.statusText}>{selectedBooking.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Services</Text>
                {selectedBooking.services.map((service, index) => (
                  <View key={index} style={styles.serviceDetailRow}>
                    <Text style={styles.serviceDetailName}>{service.name}</Text>
                    <Text style={styles.serviceDetailPrice}>${service.price}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>${selectedBooking.totalAmount.toFixed(2)}</Text>
                </View>
              </View>

              {selectedBooking.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Notes</Text>
                  <Text style={styles.notesDetailText}>{selectedBooking.notes}</Text>
                </View>
              )}

              {selectedBooking.specialRequests && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Special Requests</Text>
                  <Text style={styles.notesDetailText}>{selectedBooking.specialRequests}</Text>
                </View>
              )}

              <View style={styles.actionSection}>
                {getStatusActions(selectedBooking).map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.modalActionButton, { backgroundColor: action.color }]}
                    onPress={() => {
                      handleStatusUpdate(selectedBooking, action.status);
                      setShowBookingDetails(false);
                    }}
                  >
                    <Text style={styles.modalActionButtonText}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  tabButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  bookingTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  servicesList: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  notesLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  waitlistCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  waitlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  waitlistClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  waitlistDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  waitlistServices: {
    marginBottom: 8,
  },
  waitlistServicesLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  waitlistServicesText: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  waitlistPreference: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  waitlistActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  waitlistActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  waitlistContactButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  waitlistContactText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '600',
  },
  waitlistRemoveButton: {
    backgroundColor: '#FFF3F3',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  waitlistRemoveText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 50,
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalPlaceholder: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  serviceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceDetailName: {
    fontSize: 14,
    color: '#333',
  },
  serviceDetailPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  notesDetailText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionSection: {
    marginTop: 24,
  },
  modalActionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  errorBanner: {
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
});

export default BookingManagementScreen;
