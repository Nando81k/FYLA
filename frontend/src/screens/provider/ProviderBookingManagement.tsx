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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { 
  comprehensiveBookingService, 
  BookingResponse 
} from '../../services/comprehensiveBookingService';
import BookingActionModal from '../../components/provider/BookingActionModal';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface ModalState {
  visible: boolean;
  bookingId: string;
  action: 'confirm' | 'cancel';
  clientName: string;
  serviceName: string;
  appointmentTime: string;
}

const ProviderBookingManagement: React.FC = () => {
  const { user } = useAuth();
  const { colors, typography, spacing, borderRadius, shadows, isDark, toggleTheme } = useTheme();
  const styles = createStyles(colors, typography, spacing, borderRadius, shadows);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [backgroundOpacity] = useState(new Animated.Value(1));
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    bookingId: '',
    action: 'confirm',
    clientName: '',
    serviceName: '',
    appointmentTime: '',
  });

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const filterStatus = filter === 'all' ? undefined : filter;
      const response = await comprehensiveBookingService.getProviderBookings(user.id, filterStatus);
      setBookings(response);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleConfirmBooking = async (booking: BookingResponse) => {
    setModalState({
      visible: true,
      bookingId: booking.id,
      action: 'confirm',
      clientName: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown Client',
      serviceName: booking.services.length > 0 ? booking.services[0].service.name : 'Unknown Service',
      appointmentTime: `${getDateDisplay(booking.timeSlot.date)} at ${formatTime(booking.timeSlot.startTime)}`,
    });
  };

  const handleCancelBooking = async (booking: BookingResponse) => {
    setModalState({
      visible: true,
      bookingId: booking.id,
      action: 'cancel',
      clientName: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown Client',
      serviceName: booking.services.length > 0 ? booking.services[0].service.name : 'Unknown Service',
      appointmentTime: `${getDateDisplay(booking.timeSlot.date)} at ${formatTime(booking.timeSlot.startTime)}`,
    });
  };

  const handleModalClose = () => {
    setModalState({
      visible: false,
      bookingId: '',
      action: 'confirm',
      clientName: '',
      serviceName: '',
      appointmentTime: '',
    });
  };

  const handleModalSuccess = () => {
    loadBookings(); // Refresh the list
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return colors.status.warning;
      case 'confirmed': return colors.status.success;
      case 'cancelled': return colors.status.error;
      case 'completed': return colors.gray[500];
      default: return colors.gray[500];
    }
  };

  const getStatusBgColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return colors.status.warning + '20';
      case 'confirmed': return colors.status.success + '20';
      case 'cancelled': return colors.status.error + '20';
      case 'completed': return colors.gray[300] + '20';
      default: return colors.gray[300] + '20';
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'PENDING';
      case 'confirmed': return 'CONFIRMED';
      case 'cancelled': return 'CANCELLED';
      case 'completed': return 'COMPLETED';
      default: return 'UNKNOWN';
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

  const getDateDisplay = (dateString: string) => {
    if (isToday(dateString)) return 'Today';
    if (isTomorrow(dateString)) return 'Tomorrow';
    return formatDate(dateString);
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filter);

  const renderBookingCard = (booking: BookingResponse) => {
    const isUpcoming = booking.status === 'confirmed' && isToday(booking.timeSlot.date);
    
    return (
      <View key={booking.id} style={[
        styles.bookingCard,
        isUpcoming && styles.upcomingBookingCard
      ]}>
        {/* Header */}
        <View style={styles.bookingHeader}>
          <View style={styles.clientInfo}>
            <Text style={[styles.clientName, { color: colors.text.primary }]}>{booking.clientName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(booking.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {getStatusText(booking.status)}
              </Text>
            </View>
          </View>
          {isUpcoming && (
            <View style={[styles.upcomingBadge, { 
              backgroundColor: colors.accent,
              borderWidth: 0.5,
              borderColor: colors.primary + '30'
            }]}>
              <Text style={[styles.upcomingText, { color: colors.text.inverse }]}>TODAY</Text>
            </View>
          )}
        </View>

        {/* Date and Time */}
        <View style={[styles.dateTimeSection, { borderBottomColor: colors.border.light }]}>
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.dateText}>{getDateDisplay(booking.timeSlot.date)}</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Ionicons name="time" size={16} color={colors.text.secondary} />
            <Text style={[styles.timeText, { color: colors.primary }]}>
              {formatTime(booking.timeSlot.startTime)} - {formatTime(booking.timeSlot.endTime)}
            </Text>
          </View>
        </View>

        {/* Services */}
        <View style={[styles.servicesSection, { borderBottomColor: colors.border.light }]}>
          <Text style={styles.servicesLabel}>Services:</Text>
          {booking.serviceNames.map((serviceName, index) => (
            <Text key={index} style={[styles.serviceItem, { color: colors.text.primary }]}>• {serviceName}</Text>
          ))}
        </View>

        {/* Booking Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={[styles.detailValue, { color: colors.text.primary }]}>{booking.totalDuration} min</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={[styles.detailValuePrice, { color: colors.primary }]}>${booking.totalPrice}</Text>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={[styles.notesSection, { borderTopColor: colors.border.light }]}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {/* Actions */}
        {booking.status === 'pending' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={[styles.cancelButton, { 
                backgroundColor: colors.background.tertiary,
                borderColor: colors.status.error + '20' 
              }]}
              onPress={() => handleCancelBooking(booking)}
            >
              <Ionicons name="close" size={16} color={colors.status.error} />
              <Text style={[styles.cancelButtonText, { color: colors.status.error }]}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, { 
                backgroundColor: colors.status.success,
                borderWidth: 0.5,
                borderColor: colors.status.success + '20',
                ...shadows.sm 
              }]}
              onPress={() => handleConfirmBooking(booking)}
            >
              <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
              <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {(['all', 'pending', 'confirmed', 'completed'] as const).map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterTab,
            filter === status && styles.filterTabActive,
          ]}
          onPress={() => setFilter(status)}
        >
          <Text 
            style={[
              styles.filterTabText,
              filter === status && styles.filterTabTextActive,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {status === 'all' ? 'All' : getStatusText(status)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Requests</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Ionicons 
              name="refresh" 
              size={24} 
              color={refreshing ? colors.text.tertiary : colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderFilterTabs()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyMessage}>
              {filter === 'all' 
                ? "You don't have any bookings yet." 
                : `No ${filter} bookings found.`}
            </Text>
          </View>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </ScrollView>
      
      <BookingActionModal
        visible={modalState.visible}
        onClose={handleModalClose}
        bookingId={modalState.bookingId}
        action={modalState.action}
        clientName={modalState.clientName}
        serviceName={modalState.serviceName}
        appointmentTime={modalState.appointmentTime}
        onSuccess={handleModalSuccess}
      />
    </Animated.View>
  );
};

const createStyles = (colors: any, typography: any, spacing: any, borderRadius: any, shadows: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.02 }],
    ...shadows.md,
  },
  filterTabText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  filterTabTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.md,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.xl,
  },
  bookingCard: {
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  upcomingBookingCard: {
    backgroundColor: colors.background.accent,
    borderColor: colors.primary,
    borderWidth: 1.5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 0.5,
    borderColor: colors.border.medium,
    backgroundColor: colors.background.tertiary,
    ...shadows.sm,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  upcomingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  upcomingText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.extrabold,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  dateTimeSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.sm,
    color: colors.text.secondary,
  },
  timeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.sm,
  },
  servicesSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
  },
  servicesLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.text.secondary,
  },
  serviceItem: {
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
    fontWeight: typography.weight.medium,
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  detailRow: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.text.tertiary,
  },
  detailValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  detailValuePrice: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.extrabold,
  },
  notesSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 0.5,
  },
  notesLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.text.secondary,
  },
  notesText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flex: 0.45,
    justifyContent: 'center',
    borderWidth: 0.5,
    ...shadows.sm,
  },
  cancelButtonText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.xs,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flex: 0.5,
    justifyContent: 'center',
    ...shadows.sm,
  },
  confirmButtonText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.xs,
  },
});

export default ProviderBookingManagement;
