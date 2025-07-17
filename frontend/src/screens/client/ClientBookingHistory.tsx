import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { 
  comprehensiveBookingService, 
  BookingResponse 
} from '../../services/comprehensiveBookingService';
import { chatService } from '../../services/chatService';
import { UserRole, User, ClientTabParamList, MessagesStackParamList } from '../../types';
import DarkModeToggle from '@/components/shared/DarkModeToggle';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
type FilterType = 'all' | 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

type ClientBookingHistoryNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ClientTabParamList>,
  StackNavigationProp<MessagesStackParamList>
>;

const ClientBookingHistory: React.FC = () => {
  const { user, token } = useAuth();
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<ClientBookingHistoryNavigationProp>();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [allBookings, setAllBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, allBookings]);

  const loadBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await comprehensiveBookingService.getClientBookings(user.id);
      setAllBookings(response);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filteredBookings = [...allBookings];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'upcoming':
        filteredBookings = allBookings.filter(booking => {
          const bookingDate = new Date(booking.timeSlot.date);
          return bookingDate >= today && (booking.status === 'confirmed' || booking.status === 'pending');
        });
        break;
      case 'pending':
        filteredBookings = allBookings.filter(booking => booking.status === 'pending');
        break;
      case 'confirmed':
        filteredBookings = allBookings.filter(booking => booking.status === 'confirmed');
        break;
      case 'cancelled':
        filteredBookings = allBookings.filter(booking => booking.status === 'cancelled');
        break;
      case 'completed':
        filteredBookings = allBookings.filter(booking => booking.status === 'completed');
        break;
      case 'all':
      default:
        // No filtering needed
        break;
    }

    // Sort by date (upcoming first)
    filteredBookings.sort((a, b) => {
      const dateA = new Date(a.timeSlot.date);
      const dateB = new Date(b.timeSlot.date);
      return dateA.getTime() - dateB.getTime();
    });

    setBookings(filteredBookings);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await comprehensiveBookingService.cancelBooking(bookingId, 'Cancelled by client');
              Alert.alert('Success', 'Booking cancelled');
              loadBookings(); // Refresh the list
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleMessageProvider = async (booking: BookingResponse) => {
    if (!token || !user) {
      Alert.alert('Error', 'Please log in to send messages');
      return;
    }

    try {
      // Create a User object for the provider
      const providerUser: User = {
        id: booking.providerId,
        role: UserRole.PROVIDER,
        fullName: booking.providerName || (booking.provider ? `${booking.provider.firstName} ${booking.provider.lastName}` : 'Provider'),
        email: booking.provider?.email || '',
        phoneNumber: '',
        createdAt: '',
        updatedAt: '',
      };

      // Validate that we have the required data
      if (!providerUser.id || !providerUser.fullName) {
        Alert.alert('Error', 'Provider information is incomplete');
        return;
      }

      // Create or get conversation with the provider
      const conversation = await chatService.createOrGetConversation(token, booking.providerId);
      
      if (!conversation || !conversation.id) {
        Alert.alert('Error', 'Failed to create conversation');
        return;
      }

      // Navigate to the Messages tab first
      navigation.navigate('Messages');
      
      // Use a longer timeout to ensure proper navigation
      setTimeout(() => {
        try {
          (navigation as any).navigate('Chat', {
            conversationId: conversation.id,
            otherUser: providerUser,
          });
        } catch (navError) {
          console.error('Navigation error:', navError);
          Alert.alert('Error', 'Failed to open chat');
        }
      }, 200);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start conversation with provider');
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'PENDING';
      case 'confirmed': return 'CONFIRMED';
      case 'cancelled': return 'CANCELLED';
      case 'completed': return 'COMPLETED';
      default: return String(status).toUpperCase();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateString === tomorrow.toISOString().split('T')[0];
  };

  const isUpcoming = (booking: BookingResponse) => {
    const bookingDate = new Date(booking.timeSlot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today && (booking.status === 'confirmed' || booking.status === 'pending');
  };

  const getDateDisplay = (dateString: string) => {
    if (isToday(dateString)) return 'Today';
    if (isTomorrow(dateString)) return 'Tomorrow';
    return formatDate(dateString);
  };

  const toggleCardExpansion = (cardId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const renderBookingCard = (booking: BookingResponse) => {
    const upcoming = isUpcoming(booking);
    const isExpanded = expandedCards.has(booking.id);
    
    return (
      <TouchableOpacity 
        key={booking.id} 
        style={[
          styles.bookingCard,
          { backgroundColor: colors.background.secondary, borderColor: colors.border.primary },
          upcoming && [styles.upcomingBookingCard, { borderColor: colors.primary }]
        ]}
        onPress={() => toggleCardExpansion(booking.id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.bookingHeader}>
          <View style={styles.providerInfo}>
            <Text style={[styles.providerName, { color: colors.text.primary }]}>{booking.providerName || 'Provider'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {getStatusText(booking.status)}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {upcoming && (
              <View style={[styles.upcomingBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.upcomingText, { color: colors.primary }]}>UPCOMING</Text>
              </View>
            )}
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.text.secondary} 
              style={styles.expandIcon}
            />
          </View>
        </View>

        {/* Date and Time */}
        <View style={styles.dateTimeSection}>
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>{getDateDisplay(booking.timeSlot.date)}</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Ionicons name="time" size={16} color={colors.text.secondary} />
            <Text style={[styles.timeText, { color: colors.text.secondary }]}>
              {formatTime(booking.timeSlot.startTime)} - {formatTime(booking.timeSlot.endTime)}
            </Text>
          </View>
        </View>

        {/* Expandable Content */}
        {isExpanded && (
          <View style={styles.expandableContent}>
            {/* Services */}
            <View style={styles.servicesSection}>
              <Text style={[styles.servicesLabel, { color: colors.text.primary }]}>Services:</Text>
              {booking.serviceNames.map((serviceName, index) => (
                <Text key={index} style={[styles.serviceItem, { color: colors.text.secondary }]}>• {serviceName}</Text>
              ))}
            </View>

            {/* Booking Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Duration:</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>{booking.totalDuration} min</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Total:</Text>
                <Text style={[styles.detailValuePrice, { color: colors.primary }]}>${booking.totalPrice}</Text>
              </View>
            </View>

            {/* Status-specific messages */}
            {booking.status === 'pending' && (
              <View style={styles.messageSection}>
                <Ionicons name="hourglass" size={16} color="#f59e0b" />
                <Text style={[styles.messageText, { color: colors.text.secondary }]}>
                  Waiting for provider confirmation
                </Text>
              </View>
            )}

            {booking.status === 'confirmed' && upcoming && (
              <View style={styles.messageSection}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={[styles.messageText, { color: colors.text.secondary }]}>
                  Confirmed! See you soon.
                </Text>
              </View>
            )}

            {/* Actions */}
            {(booking.status === 'pending' || booking.status === 'confirmed') && upcoming && (
              <View style={styles.actionsSection}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { backgroundColor: '#ef4444', borderColor: '#dc2626' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCancelBooking(booking.id);
                  }}
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                  <Text style={[styles.cancelButtonText, { color: '#ffffff' }]}>Cancel Booking</Text>
                </TouchableOpacity>
                
                {booking.status === 'confirmed' && (
                  <TouchableOpacity 
                    style={[styles.messageButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMessageProvider(booking);
                    }}
                  >
                    <Ionicons name="chatbubble" size={16} color={colors.primary} />
                    <Text style={[styles.messageButtonText, { color: colors.primary }]}>Message Provider</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Collapsed Summary */}
        {!isExpanded && (
          <View style={styles.collapsedSummary}>
            <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
              {booking.serviceNames.join(', ')} • {booking.totalDuration} min • ${booking.totalPrice}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getFilterDisplayName = (filterType: FilterType) => {
    switch (filterType) {
      case 'all': return 'All';
      case 'upcoming': return 'Upcoming';
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return filterType;
    }
  };

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'all') return allBookings.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filterType) {
      case 'upcoming':
        return allBookings.filter(booking => {
          const bookingDate = new Date(booking.timeSlot.date);
          return bookingDate >= today && (booking.status === 'confirmed' || booking.status === 'pending');
        }).length;
      default:
        return allBookings.filter(booking => booking.status === filterType).length;
    }
  };

  const renderFilterTabs = () => {
    const filters: FilterType[] = ['upcoming', 'all', 'pending', 'confirmed', 'completed', 'cancelled'];
    
    return (
      <View style={[styles.filterSection, { backgroundColor: colors.background.secondary, borderBottomColor: colors.border.primary }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContentContainer}
        >
          {filters.map((filterType) => {
            const count = getFilterCount(filterType);
            const isActive = filter === filterType;
            return (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterPill,
                  { backgroundColor: colors.background.tertiary, borderColor: colors.border.primary },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setFilter(filterType)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterPillText,
                  { color: colors.text.secondary },
                  isActive && { color: colors.text.inverse },
                ]}>
                  {getFilterDisplayName(filterType)}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.filterBadge,
                    { backgroundColor: colors.background.primary },
                    isActive && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      { color: colors.text.secondary },
                      isActive && { color: colors.text.inverse },
                    ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.secondary, borderBottomColor: colors.border.primary }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text.primary }]}>My Appointments</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Manage your booked appointments</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing} style={[styles.refreshButton, { backgroundColor: colors.background.tertiary }]}>
            <Ionicons 
              name="refresh" 
              size={22} 
              color={refreshing ? colors.text.secondary : colors.primary} 
            />
          </TouchableOpacity>
          <DarkModeToggle size={24} />
        </View>
      </View>

      {renderFilterTabs()}

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background.primary }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading your appointments...</Text>
          </View>
        )}

        {!loading && bookings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {filter === 'upcoming' ? 'No upcoming appointments' : 
               filter === 'all' ? 'No appointments found' : 
               `No ${filter} appointments found`}
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.text.secondary }]}>
              {filter === 'upcoming' 
                ? "You don't have any upcoming appointments." 
                : filter === 'all'
                ? "You haven't made any appointments yet."
                : `No ${filter} appointments found.`}
            </Text>
          </View>
        )}

        {!loading && bookings.length > 0 && (
          <View style={styles.bookingsContainer}>
            <View style={styles.bookingsHeader}>
              <Text style={[styles.bookingsTitle, { color: colors.text.primary }]}>
                {getFilterDisplayName(filter)} ({bookings.length})
              </Text>
            </View>
            
            {bookings.map(renderBookingCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20, // Account for dynamic island
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  filterSection: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    paddingVertical: 12,
    minHeight: 64, // Ensure minimum height for proper rendering
  },
  filterContainer: {
    flexGrow: 0, // Prevent unnecessary growth
  },
  filterContentContainer: {
    paddingHorizontal: 16,
    alignItems: 'center', // Center align the filter pills
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 25,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 60, // Ensure minimum width
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  bookingsContainer: {
    padding: 16,
  },
  bookingsHeader: {
    marginBottom: 16,
  },
  bookingsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bookingCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  upcomingBookingCard: {
    borderWidth: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upcomingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  expandIcon: {
    marginLeft: 4,
  },
  dateTimeSection: {
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expandableContent: {
    marginTop: 8,
  },
  collapsedSummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  summaryText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  servicesSection: {
    marginBottom: 12,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceItem: {
    fontSize: 14,
    marginBottom: 2,
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailRow: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailValuePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 0.45,
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 0.5,
    justifyContent: 'center',
    borderWidth: 1,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default ClientBookingHistory;
