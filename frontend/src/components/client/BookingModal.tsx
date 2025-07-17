import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTimeSlot } from '@/context/TimeSlotContext';
import { appointmentService } from '@/services/appointmentService';
import { serviceService, CreateBookingRequest } from '@/services/serviceService';
import { 
  ProviderProfile, 
  Service, 
  TimeSlot, 
  Appointment 
} from '../../types';
import { TimeSlot as TimeSlotType } from '../../types/timeSlot';
import TimeSlotPicker from '../booking/TimeSlotPicker';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  provider: ProviderProfile;
  selectedServices: Service[];
}

const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  onClose,
  onSuccess,
  provider,
  selectedServices,
}) => {
  const { token } = useAuth();
  const { scheduleAppointmentReminder } = useNotifications();
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
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pickerKey, setPickerKey] = useState(0); // Force re-render of picker
  const tempDateRef = useRef(new Date()); // Use ref to avoid re-renders
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlotPicker, setShowTimeSlotPicker] = useState(false);

  // Update selected time slot when TimeSlot context changes
  useEffect(() => {
    if (selectedSlot) {
      setSelectedTimeSlot({
        startTime: new Date(selectedSlot.startTime).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        }),
        endTime: new Date(selectedSlot.endTime).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        }),
        isAvailable: selectedSlot.isAvailable,
      });
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (visible) {
      loadAvailableSlots();
    }
  }, [visible, selectedDate]);

  const loadAvailableSlots = async () => {
    if (!token) return;

    setIsLoadingSlots(true);
    setSelectedTimeSlot(null);
    
    try {
      // Use serviceService for time slots (real backend integration)
      const timeSlotRequest = {
        date: selectedDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        providerId: provider.id,
        serviceIds: selectedServices.map(s => s.id)
      };
      
      const slotsResponse = await serviceService.getAvailableTimeSlots(timeSlotRequest);
      setAvailableSlots(slotsResponse.timeSlots);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load available time slots'
      );
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    console.log('📅 Date picker event:', event.type, date);
    
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        setSelectedDate(date);
      }
      setShowDatePicker(false);
    } else {
      // iOS
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        setShowDatePicker(false);
      } else if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    }
  };

  const handleDatePickerOpen = () => {
    console.log('📅 Opening date picker, current state:', showDatePicker);
    setShowDatePicker(true);
  };

  const calculateTotalPrice = (): number => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const calculateTotalDuration = (): number => {
    return selectedServices.reduce((total, service) => total + service.estimatedDurationMinutes, 0);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleTimeSlotSelected = (slot: TimeSlotType) => {
    setSelectedSlot(slot);
    setShowTimeSlotPicker(false);
  };

  const handleBookAppointment = async () => {
    if (!token || !selectedSlot) return;

    setIsBooking(true);
    try {
      // First confirm the time slot reservation if we have one
      if (currentReservation) {
        const bookingId = await confirmReservation();
        if (!bookingId) {
          throw new Error('Failed to confirm time slot reservation');
        }
      }

      const appointmentDateTime = new Date(selectedSlot.startTime);

      const appointmentData: CreateBookingRequest = {
        providerId: provider.id,
        serviceIds: selectedServices.map(s => s.id),
        scheduledStartTime: appointmentDateTime.toISOString(),
        notes: notes.trim() || undefined,
      };

      // Use serviceService for booking creation (real backend integration)
      const appointment = await serviceService.createBooking(appointmentData);
      
      // Schedule appointment reminders
      try {
        await scheduleAppointmentReminder(
          appointment.id,
          provider.fullName,
          appointmentDateTime
        );
      } catch (error) {
        console.warn('Failed to schedule appointment reminders:', error);
      }
      
      onSuccess(appointment);
      onClose();
      
      Alert.alert(
        'Booking Confirmed!',
        `Your appointment with ${provider.fullName} has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot?.startTime}. You'll receive reminders before your appointment.`
      );
    } catch (error) {
      Alert.alert(
        'Booking Failed',
        error instanceof Error ? error.message : 'Failed to book appointment. Please try again.'
      );
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderTimeSlot = (slot: TimeSlot, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.timeSlot,
        !slot.isAvailable && styles.timeSlotUnavailable,
        selectedTimeSlot === slot && styles.timeSlotSelected,
      ]}
      onPress={() => slot.isAvailable && setSelectedTimeSlot(slot)}
      disabled={!slot.isAvailable}
    >
      <Text style={[
        styles.timeSlotText,
        !slot.isAvailable && styles.timeSlotTextUnavailable,
        selectedTimeSlot === slot && styles.timeSlotTextSelected,
      ]}>
        {formatTime(slot.startTime)}
      </Text>
      {!slot.isAvailable && slot.reason && (
        <Text style={styles.timeSlotReason}>{slot.reason}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Book Appointment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Provider Info */}
          <View style={styles.providerSection}>
            <Text style={styles.providerName}>{provider.fullName}</Text>
            <Text style={styles.providerBio}>{provider.bio}</Text>
          </View>

          {/* Selected Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Services</Text>
            {selectedServices.map((service) => (
              <View key={service.id} style={styles.serviceItem}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDuration}>
                    {formatDuration(service.estimatedDurationMinutes)}
                  </Text>
                </View>
                <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total ({formatDuration(calculateTotalDuration())})
              </Text>
              <Text style={styles.totalPrice}>${calculateTotalPrice().toFixed(2)}</Text>
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                console.log('📅 Date button pressed!');
                handleDatePickerOpen();
              }}
            >
              <Ionicons name="calendar" size={20} color="#8b5cf6" />
              <Text style={styles.dateButtonText}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            {/* Date Picker - Wheel/Spinner in Modal */}
            {showDatePicker && (
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.datePickerOverlay}>
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerModalHeader}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.datePickerCancelButton}
                      >
                        <Text style={styles.datePickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerModalTitle}>Select Date</Text>
                      <TouchableOpacity
                        onPress={() => {
                          console.log('📅 Date confirmed, closing picker');
                          setShowDatePicker(false);
                        }}
                        style={styles.datePickerConfirmButton}
                      >
                        <Text style={styles.datePickerConfirmText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="spinner"
                        onChange={(event, date) => {
                          console.log('📅 Date wheel changed:', date);
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                        minimumDate={new Date()}
                        style={styles.datePickerLarge}
                        textColor="#000000"
                      />
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>

          {/* Modern Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            
            {selectedTimeSlot ? (
              <View style={styles.selectedTimeContainer}>
                <View style={styles.selectedTimeHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.selectedTimeTitle}>Time Selected</Text>
                </View>
                
                <View style={styles.selectedTimeDetails}>
                  <Text style={styles.selectedDate}>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.selectedTime}>
                    {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
                  </Text>
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
                  <Ionicons name="time-outline" size={48} color="#d1d5db" />
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
                {selectedTimeSlot ? 'Change Time' : 'Choose Time'}
              </Text>
            </TouchableOpacity>

            {/* Show current reservation status */}
            {currentReservation && currentReservation.expiresAt && (
              <View style={styles.reservationStatus}>
                <Ionicons name="lock-closed" size={16} color="#f59e0b" />
                <Text style={styles.reservationStatusText}>
                  Slot reserved for {Math.max(0, Math.ceil(
                    (new Date(currentReservation.expiresAt).getTime() - Date.now()) / 60000
                  ))} minutes
                </Text>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any special requests or notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Book Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.bookButton,
              (!selectedSlot || isBooking) && styles.bookButtonDisabled,
            ]}
            onPress={handleBookAppointment}
            disabled={!selectedSlot || isBooking}
          >
            {isBooking ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.bookButtonText}>
                  Book Appointment - ${calculateTotalPrice().toFixed(2)}
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
          clientId={1} // TODO: Get from auth context
          initialDate={selectedDate.toISOString().split('T')[0]}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  providerSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  providerBio: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6b7280',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  // Modal Date Picker Styles - Bottom Sheet Style
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for iPhone
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  datePickerModalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  datePickerWrapper: {
    padding: 20,
    paddingTop: 0,
  },
  datePickerLarge: {
    width: '100%',
    height: 200,
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerCancelText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerConfirmText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotUnavailable: {
    backgroundColor: '#fef2f2',
    opacity: 0.6,
  },
  timeSlotSelected: {
    backgroundColor: '#8b5cf6',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  timeSlotTextUnavailable: {
    color: '#9ca3af',
  },
  timeSlotTextSelected: {
    color: 'white',
  },
  timeSlotReason: {
    fontSize: 10,
    color: '#dc2626',
    marginTop: 2,
  },
  notesInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    minHeight: 80,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bookButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modern time selection styles
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
    color: '#10b981',
    marginLeft: 8,
  },
  selectedTimeDetails: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedDate: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  slotPrice: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  changeTimeButton: {
    alignSelf: 'flex-end',
  },
  changeTimeButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  noTimeSelectedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  noTimeSelectedContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  noTimeSelectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noTimeSelectedSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  chooseTimeButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  chooseTimeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reservationStatus: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reservationStatusText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default BookingModal;
