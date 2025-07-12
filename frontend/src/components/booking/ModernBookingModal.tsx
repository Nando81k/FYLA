import React, { useState, useEffect, useCallback } from 'react';
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

interface ModernBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  provider: ProviderProfile;
  selectedServices: Service[];
}

const ModernBookingModal: React.FC<ModernBookingModalProps> = ({
  visible,
  onClose,
  onSuccess,
  provider,
  selectedServices,
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
  const [isBooking, setIsBooking] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Don't render modal if user is not authenticated
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
    setCurrentStep(2);
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
        onClose();
        
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

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedSlot(null);
    setNotes('');
    clearConflicts();
    clearTimeSlotError();
    onClose();
  };

  const canBook = selectedSlot && !isBooking && !timeSlotLoading;

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
              {step}
            </Text>
          </View>
          {step < 2 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderTimeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Your Time</Text>
      <Text style={styles.stepDescription}>
        Choose from available time slots that work best for you
      </Text>
      
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
          </View>
        </View>
      ) : (
        <View style={styles.noTimeSelectedContainer}>
          <Ionicons name="time-outline" size={48} color="#E5E7EB" />
          <Text style={styles.noTimeSelectedTitle}>No Time Selected</Text>
          <Text style={styles.noTimeSelectedSubtitle}>
            Choose from available time slots
          </Text>
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

      {selectedSlot && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBookingReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Book</Text>
      <Text style={styles.stepDescription}>
        Review your booking details and confirm your appointment
      </Text>
      
      {/* Provider Summary */}
      <View style={styles.summarySection}>
        <View style={styles.providerSummary}>
          <Image
            source={{ uri: provider.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.fullName)}&size=40` }}
            style={styles.providerSummaryImage}
          />
          <View style={styles.providerSummaryInfo}>
            <Text style={styles.providerSummaryName}>{provider.fullName}</Text>
            <Text style={styles.providerSummaryAddress}>{provider.email}</Text>
          </View>
        </View>
      </View>

      {/* Services Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Services</Text>
        {selectedServices.map((service) => (
          <View key={service.id} style={styles.serviceSummaryItem}>
            <Text style={styles.serviceSummaryName}>{service.name}</Text>
            <Text style={styles.serviceSummaryPrice}>${service.price?.toFixed(2) || '0.00'}</Text>
          </View>
        ))}
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>${calculateTotalPrice().toFixed(2)}</Text>
        </View>
      </View>

      {/* Time Summary */}
      {selectedSlot && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Date & Time</Text>
          <View style={styles.timeSummary}>
            <Text style={styles.timeSummaryDate}>
              {new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.timeSummaryTime}>
              {new Date(selectedSlot.startTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} - {new Date(selectedSlot.endTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <Text style={styles.timeSummaryDuration}>
              Duration: {formatDuration(calculateTotalDuration())}
            </Text>
          </View>
        </View>
      )}

      {/* Notes */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any specific notes for your appointment..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Booking Actions */}
      <View style={styles.bookingActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.bookButton, !canBook && styles.bookButtonDisabled]}
          onPress={handleBookAppointment}
          disabled={!canBook}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>
              Confirm Booking
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderTimeSelection()}
          {currentStep === 2 && renderBookingReview()}
        </ScrollView>

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
    </Modal>
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
  closeButton: {
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#007AFF',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContent: {
    paddingVertical: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  selectedTimeContainer: {
    marginBottom: 24,
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
  },
  noTimeSelectedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  chooseTimeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  providerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerSummaryImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  providerSummaryInfo: {
    flex: 1,
  },
  providerSummaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  providerSummaryAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceSummaryName: {
    fontSize: 14,
    color: '#1F2937',
  },
  serviceSummaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  timeSummary: {
    alignItems: 'center',
  },
  timeSummaryDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeSummaryTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  timeSummaryDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    flex: 2,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ModernBookingModal;
