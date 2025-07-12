import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { appointmentService } from '@/services/appointmentService';
import { Appointment, AppointmentStatus, Review, ClientFeedStackParamList } from '@/types';
import ReviewModal from '@/components/client/ReviewModal';

type BookingsScreenNavigationProp = StackNavigationProp<ClientFeedStackParamList, 'FeedHome'>;

const BookingsScreen: React.FC = () => {
  const { token } = useAuth();
  const navigation = useNavigation<BookingsScreenNavigationProp>();
  const { 
    bookings,
    loading,
    fetchBookings,
    cancelBooking 
  } = useBooking();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [token])
  );

  const loadAppointments = async (showLoader = true) => {
    if (!token) return;
    
    if (showLoader) setIsLoading(true);
    try {
      // Load real appointments from backend
      const [appointmentsData] = await Promise.all([
        appointmentService.getAppointments(),
        fetchBookings() // Load real bookings from backend
      ]);
      setAppointments(appointmentsData.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load appointments'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAppointments(false);
  };

  const handleWriteReview = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setReviewModalVisible(true);
  };

  const handleReviewSuccess = (review: Review) => {
    if (selectedAppointment) {
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, review }
          : apt
      ));
    }
    setReviewModalVisible(false);
    setSelectedAppointment(null);
  };

  const handleCloseReviewModal = () => {
    setReviewModalVisible(false);
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment with ${appointment.provider?.fullName} on ${formatDate(appointment.scheduledStartTime)}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) return;
              await appointmentService.cancelAppointment(appointment.id);
              setAppointments(prev => prev.map(apt => 
                apt.id === appointment.id 
                  ? { ...apt, status: AppointmentStatus.CANCELLED }
                  : apt
              ));
              Alert.alert('Appointment Cancelled', 'Your appointment has been cancelled successfully.');
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to cancel appointment'
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return '#f59e0b';
      case AppointmentStatus.CONFIRMED:
        return '#10b981';
      case AppointmentStatus.COMPLETED:
        return '#059669';
      case AppointmentStatus.CANCELLED:
        return '#ef4444';
      case AppointmentStatus.NO_SHOW:
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: AppointmentStatus): string => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'Pending';
      case AppointmentStatus.CONFIRMED:
        return 'Confirmed';
      case AppointmentStatus.COMPLETED:
        return 'Completed';
      case AppointmentStatus.CANCELLED:
        return 'Cancelled';
      case AppointmentStatus.NO_SHOW:
        return 'No Show';
      default:
        return status;
    }
  };

  const filterAppointments = (appointments: Appointment[]) => {
    const now = new Date();
    
    if (selectedTab === 'upcoming') {
      return appointments.filter(apt => {
        const appointmentDate = new Date(apt.scheduledStartTime);
        return appointmentDate >= now && apt.status !== AppointmentStatus.COMPLETED;
      });
    } else {
      return appointments.filter(apt => {
        const appointmentDate = new Date(apt.scheduledStartTime);
        return appointmentDate < now || apt.status === AppointmentStatus.COMPLETED;
      });
    }
  };

  const renderAppointmentCard = ({ item: appointment }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.providerInfo}>
          <Image
            source={{
              uri: appointment.provider?.profilePictureUrl || 'https://via.placeholder.com/50x50?text=?',
            }}
            style={styles.providerImage}
          />
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>
              {appointment.provider?.fullName || 'Provider'}
            </Text>
            <Text style={styles.appointmentDate}>
              {formatDate(appointment.scheduledStartTime)}
            </Text>
            <Text style={styles.appointmentTime}>
              {formatTime(appointment.scheduledStartTime)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
        </View>
      </View>

      {appointment.services && appointment.services.length > 0 && (
        <View style={styles.servicesSection}>
          <Text style={styles.servicesTitle}>Services:</Text>
          {appointment.services.map((service, index) => (
            <Text key={index} style={styles.serviceItem}>
              • {service.service?.name || 'Service'} - ${service.priceAtBooking?.toFixed(2) || '0.00'}
            </Text>
          ))}
        </View>
      )}

      {appointment.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text style={styles.notesText}>{appointment.notes}</Text>
        </View>
      )}

      <View style={styles.appointmentFooter}>
        <Text style={styles.totalPrice}>
          Total: ${appointment.totalPrice?.toFixed(2) || '0.00'}
        </Text>
        
        <View style={styles.actionButtons}>
          {appointment.status === AppointmentStatus.PENDING && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelAppointment(appointment)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          {appointment.status === AppointmentStatus.COMPLETED && (
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={() => handleWriteReview(appointment)}
            >
              <Text style={styles.reviewButtonText}>
                {appointment.review ? 'Edit Review' : 'Write Review'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const handleAIBooking = () => {
    navigation.navigate('AIBooking');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>
        {selectedTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {selectedTab === 'upcoming' 
          ? 'Let our AI assistant help you find the perfect service'
          : 'Your completed appointments will appear here'
        }
      </Text>
      {selectedTab === 'upcoming' && (
        <View style={styles.emptyStateButtons}>
          <TouchableOpacity style={styles.aiBookingButton} onPress={handleAIBooking}>
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.aiBookingButtonText}>AI Booking Assistant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exploreButton} onPress={() => {
            navigation.navigate('Search');
          }}>
            <Text style={styles.exploreButtonText}>Browse Providers</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredAppointments = filterAppointments(appointments);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity style={styles.aiBookingHeaderButton} onPress={handleAIBooking}>
          <Ionicons name="flash" size={16} color="#fff" />
          <Text style={styles.aiBookingHeaderText}>AI Assistant</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.activeTab]}
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          filteredAppointments.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Review Modal */}
      {selectedAppointment && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={handleCloseReviewModal}
          onSuccess={handleReviewSuccess}
          appointment={selectedAppointment}
          existingReview={selectedAppointment.review}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  providerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  servicesSection: {
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  serviceItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  notesSection: {
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  reviewButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  emptyStateButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    paddingHorizontal: 32,
  },
  aiBookingButton: {
    backgroundColor: '#FF6B9D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiBookingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  aiBookingHeaderButton: {
    backgroundColor: '#FF6B9D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  aiBookingHeaderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  exploreButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingsScreen;
