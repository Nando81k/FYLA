import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { useTimeSlot } from '@/context/TimeSlotContext';
import { useNotifications } from '@/context/NotificationContext';
import { ProviderProfile, Service } from '@/types';
import { BookingRequest, BookingType } from '@/types/booking';
import { TimeSlot } from '@/types/timeSlot';
import TimeSlotPicker from './TimeSlotPicker';

const { width, height } = Dimensions.get('window');

interface ModernBookingScreenProps {
  provider: ProviderProfile;
  selectedServices: Service[];
  onBack: () => void;
  onSuccess: () => void;
}

const ModernBookingScreen: React.FC<ModernBookingScreenProps> = ({
  provider,
  selectedServices,
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { createBooking, loading: bookingLoading } = useBooking();
  const { 
    selectedSlot,
    setSelectedSlot,
    clearConflicts,
    currentReservation,
    confirmReservation,
    loading: timeSlotLoading,
    error: timeSlotError,
    clearError: clearTimeSlotError,
  } = useTimeSlot();
  const { scheduleAppointmentReminder } = useNotifications();

  const [showTimeSlotPicker, setShowTimeSlotPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  const calculateTotalPrice = useCallback(() => {
    return selectedServices.reduce((total, service) => total + (service.price || 0), 0);
  }, [selectedServices]);

  const calculateTotalDuration = useCallback(() => {
    return selectedServices.reduce((total, service) => total + (service.estimatedDurationMinutes || 60), 0);
  }, [selectedServices]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleTimeSlotSelected = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowTimeSlotPicker(false);
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !user) {
      Alert.alert('Error', 'Please select a time slot first');
      return;
    }

    setIsBooking(true);
    try {
      // First confirm the time slot reservation if we have one
      if (currentReservation) {
        const bookingId = await confirmReservation();
        if (!bookingId) {
          throw new Error('Failed to confirm time slot reservation');
        }
      }

      const bookingRequest: BookingRequest = {
        clientId: user.id,
        providerId: provider.id,
        serviceIds: selectedServices.map(s => s.id.toString()),
        requestedDateTime: selectedSlot.startTime,
        duration: calculateTotalDuration(),
        type: BookingType.SINGLE,
        notes: notes.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
        estimatedTotal: calculateTotalPrice(),
      };

      const booking = await createBooking(bookingRequest);
      
      if (booking) {
        // Schedule appointment reminders
        try {
          await scheduleAppointmentReminder(
            parseInt(booking.id),
            provider.fullName,
            new Date(selectedSlot.startTime)
          );
        } catch (error) {
          console.warn('Failed to schedule appointment reminders:', error);
        }

        onSuccess();
        
        Alert.alert(
          'Booking Confirmed! 🎉',
          `Your appointment with ${provider.fullName} has been booked for ${new Date(selectedSlot.startTime).toLocaleDateString()} at ${new Date(selectedSlot.startTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}. You'll receive reminders before your appointment.`
        );
      }
    } catch (error) {
      Alert.alert(
        'Booking Failed',
        error instanceof Error ? error.message : 'Failed to book appointment. Please try again.'
      );
    } finally {
      setIsBooking(false);
    }
  };

  const canBook = selectedSlot && !isBooking && !timeSlotLoading;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Provider Card */}
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            <Image
              source={{ uri: provider.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.fullName)}&size=60` }}
              style={styles.providerImage}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.fullName}</Text>
              <Text style={styles.providerBio} numberOfLines={2}>{provider.bio}</Text>
              <View style={styles.providerRating}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{provider.averageRating?.toFixed(1) || '5.0'}</Text>
                <Text style={styles.reviewCount}>({provider.totalReviews || 0} reviews)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selected Services */}
        <View style={styles.servicesCard}>
          <Text style={styles.cardTitle}>Selected Services</Text>
          {selectedServices.map((service) => (
            <View key={service.id} style={styles.serviceItem}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>${service.price?.toFixed(2) || '0.00'}</Text>
              </View>
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {service.description}
              </Text>
              <View style={styles.serviceMeta}>
                <Text style={styles.serviceDuration}>
                  {formatDuration(service.estimatedDurationMinutes || 60)}
                </Text>
                <Text style={styles.serviceCategory}>Service</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Duration</Text>
              <Text style={styles.totalValue}>{formatDuration(calculateTotalDuration())}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalPrice}>${calculateTotalPrice().toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Time Slot Selection - Main Feature */}
        <View style={styles.timeSlotCard}>
          <Text style={styles.cardTitle}>Choose Your Time</Text>
          
          {selectedSlot ? (
            <View style={styles.selectedTimeContainer}>
              <View style={styles.selectedTimeHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                <Text style={styles.selectedTimeTitle}>Time Selected</Text>
              </View>
              
              <View style={styles.selectedTimeDetails}>
                <Text style={styles.selectedDate}>
                  {new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.selectedTime}>
                  {new Date(selectedSlot.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - {new Date(selectedSlot.endTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                {selectedSlot.price && (
                  <Text style={styles.slotPrice}>
                    ${selectedSlot.price.toFixed(2)}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.changeTimeButton}
                onPress={() => setShowTimeSlotPicker(true)}
              >
                <Text style={styles.changeTimeButtonText}>Change Time</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noTimeSelectedContainer}>
              <View style={styles.noTimeSelectedContent}>
                <Ionicons name="time-outline" size={48} color="#E5E7EB" />
                <Text style={styles.noTimeSelectedTitle}>No Time Selected</Text>
                <Text style={styles.noTimeSelectedSubtitle}>
                  Choose from available time slots
                </Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.chooseTimeButton}
            onPress={() => setShowTimeSlotPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.chooseTimeButtonText}>
              {selectedSlot ? 'Change Time' : 'Choose Time'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reservation Status */}
        {currentReservation && currentReservation.expiresAt && (
          <View style={styles.reservationAlert}>
            <Ionicons name="lock-closed" size={16} color="#FF9500" />
            <Text style={styles.reservationText}>
              Slot reserved for {Math.max(0, Math.ceil(
                (new Date(currentReservation.expiresAt).getTime() - Date.now()) / 60000
              ))} minutes
            </Text>
          </View>
        )}

        {/* Notes and Special Requests */}
        <View style={styles.notesCard}>
          <Text style={styles.cardTitle}>Additional Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any specific notes for your appointment..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any special requests or requirements..."
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Booking Summary */}
        {selectedSlot && (
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Booking Summary</Text>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Provider</Text>
              <Text style={styles.summaryValue}>{provider.fullName}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Services</Text>
              <Text style={styles.summaryValue}>{selectedServices.length} service(s)</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>
                {new Date(selectedSlot.startTime).toLocaleDateString()} at {new Date(selectedSlot.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{formatDuration(calculateTotalDuration())}</Text>
            </View>
            
            <View style={[styles.summaryItem, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>${calculateTotalPrice().toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Spacer for button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.bookButton, !canBook && styles.bookButtonDisabled]}
          onPress={handleBookAppointment}
          disabled={!canBook}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.bookButtonText}>
                Confirm Booking - ${calculateTotalPrice().toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* TimeSlot Picker Modal */}
      <TimeSlotPicker
        visible={showTimeSlotPicker}
        onClose={() => setShowTimeSlotPicker(false)}
        onSlotSelected={handleTimeSlotSelected}
        providerId={provider.id}
        serviceId={selectedServices[0]?.id || 1}
        serviceDuration={calculateTotalDuration()}
        clientId={user.id}
        initialDate={new Date().toISOString().split('T')[0]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  providerBio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  servicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  serviceItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  timeSlotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedTimeContainer: {
    marginBottom: 16,
  },
  selectedTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 8,
  },
  selectedTimeDetails: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedDate: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  slotPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  changeTimeButton: {
    alignSelf: 'flex-end',
  },
  changeTimeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  noTimeSelectedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noTimeSelectedContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  noTimeSelectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noTimeSelectedSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  chooseTimeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseTimeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reservationAlert: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reservationText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    fontWeight: '500',
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  summaryTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bookButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default ModernBookingScreen;
