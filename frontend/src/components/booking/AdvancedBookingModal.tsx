import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTimeSlot } from '../../context/TimeSlotContext';
import {
  ProviderProfile,
  Service,
} from '../../types';
import {
  BookingRequest,
  BookingType,
  RecurrenceType,
  RecurrenceConfig,
  ServiceDetails,
  BookingValidation,
  TimeSlot as BookingTimeSlot, // Rename to avoid conflict
  BookingPackage,
} from '../../types/booking';
import { TimeSlot } from '../../types/timeSlot'; // Use this for TimeSlotPicker
import TimeSlotPicker from './TimeSlotPicker';

const { width } = Dimensions.get('window');

interface AdvancedBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  provider: ProviderProfile;
  selectedServices: Service[];
  initialDate?: Date;
  initialType?: BookingType;
}

const AdvancedBookingModal: React.FC<AdvancedBookingModalProps> = ({
  visible,
  onClose,
  onSuccess,
  provider,
  selectedServices,
  initialDate,
  initialType = BookingType.SINGLE,
}) => {
  const { user } = useAuth();
  
  // Don't render modal if user is not authenticated
  if (!user) {
    return null;
  }

  const { 
    createBooking, 
    validateBooking, 
    fetchAvailability,
    fetchPackages,
    createRecurringBooking,
    availability,
    packages,
    loading,
    error,
    clearError,
  } = useBooking();
  const { 
    selectedSlot: timeSlotPickerSlot,
    setSelectedSlot,
    clearConflicts,
    currentReservation,
    reserveSlot,
    confirmReservation,
    loading: timeSlotLoading,
    error: timeSlotError,
    clearError: clearTimeSlotError,
  } = useTimeSlot();

  // Booking form state
  const [bookingType, setBookingType] = useState<BookingType>(initialType);
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [notes, setNotes] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<BookingPackage | null>(null);
  
  // Use TimeSlot from context (converted to booking TimeSlot type)
  const selectedTimeSlot = useMemo(() => {
    return timeSlotPickerSlot ? {
      startTime: timeSlotPickerSlot.startTime,
      endTime: timeSlotPickerSlot.endTime,
      isAvailable: timeSlotPickerSlot.isAvailable,
      price: timeSlotPickerSlot.price,
    } : null;
  }, [timeSlotPickerSlot]);
  
  // Recurrence configuration
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({
    type: RecurrenceType.WEEKLY,
    interval: 1,
    daysOfWeek: [new Date().getDay()], // Use current day instead of selectedDate.getDay()
    maxOccurrences: 10,
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlotPicker, setShowTimeSlotPicker] = useState(false);
  const [validation, setValidation] = useState<BookingValidation | null>(null);

  // Form validation
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const totalSteps = bookingType === BookingType.RECURRING ? 4 : 3;

  useEffect(() => {
    if (visible && provider.id) {
      fetchPackages(provider.id);
      // Load availability directly instead of calling loadAvailability function
      if (user?.id) {
        const query = {
          providerId: provider.id,
          serviceIds: selectedServices.map(s => s.id.toString()),
          dateFrom: selectedDate.toISOString().split('T')[0],
          dateTo: new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          duration: selectedServices.reduce((sum, service) => sum + (service.estimatedDurationMinutes || 60), 0),
        };
        fetchAvailability(query);
      }
    }
  }, [visible, provider.id]); // Remove problematic dependencies

  useEffect(() => {
    if (visible) {
      clearError();
      clearTimeSlotError();
    }
  }, [visible]);

  const loadAvailability = useCallback(async () => {
    if (!provider.id) return;

    const query = {
      providerId: provider.id,
      serviceIds: selectedServices.map(s => s.id.toString()),
      dateFrom: selectedDate.toISOString().split('T')[0],
      dateTo: new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: selectedServices.reduce((sum, service) => sum + (service.estimatedDurationMinutes || 60), 0),
    };

    await fetchAvailability(query);
  }, [provider.id, selectedServices, selectedDate, fetchAvailability]);

  const validateCurrentBooking = useCallback(async () => {
    if (!selectedTimeSlot) return;

    // Calculate total inline to avoid dependency issues
    let estimatedTotal = selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
    if (selectedPackage) {
      estimatedTotal = selectedPackage.price;
    }
    if (bookingType === BookingType.RECURRING && recurrenceConfig.maxOccurrences) {
      estimatedTotal *= recurrenceConfig.maxOccurrences;
    }

    const request: BookingRequest = {
      clientId: user.id,
      providerId: provider.id,
      serviceIds: selectedServices.map(s => s.id.toString()),
      requestedDateTime: selectedTimeSlot.startTime,
      duration: selectedServices.reduce((sum, service) => sum + (service.estimatedDurationMinutes || 60), 0),
      type: bookingType,
      notes,
      specialRequests,
      estimatedTotal,
      ...(bookingType === BookingType.RECURRING && { recurrenceConfig }),
      ...(selectedPackage && { 
        packageConfig: {
          packageId: selectedPackage.id,
          totalSessions: selectedPackage.totalSessions,
          sessionsUsed: 0,
          transferrable: selectedPackage.isTransferrable,
        }
      }),
    };

    const validationResult = await validateBooking(request);
    setValidation(validationResult);
    
    if (validationResult && !validationResult.isValid) {
      setFormErrors(validationResult.errors);
    } else {
      setFormErrors([]);
    }
  }, [selectedTimeSlot, bookingType, notes, specialRequests, selectedPackage, recurrenceConfig, user.id, provider.id, selectedServices, validateBooking]);

  useEffect(() => {
    if (currentStep === totalSteps && selectedTimeSlot) {
      // Calculate total inline to avoid dependency issues
      let baseTotal = selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
      
      if (selectedPackage) {
        baseTotal = selectedPackage.price;
      }
      
      if (bookingType === BookingType.RECURRING && recurrenceConfig.maxOccurrences) {
        baseTotal *= recurrenceConfig.maxOccurrences;
      }

      // Validate booking directly instead of calling validateCurrentBooking function
      const request: BookingRequest = {
        clientId: user.id,
        providerId: provider.id,
        serviceIds: selectedServices.map(s => s.id.toString()),
        requestedDateTime: selectedTimeSlot.startTime,
        duration: selectedServices.reduce((sum, service) => sum + (service.estimatedDurationMinutes || 60), 0),
        type: bookingType,
        notes,
        specialRequests,
        estimatedTotal: baseTotal,
        ...(bookingType === BookingType.RECURRING && { recurrenceConfig }),
        ...(selectedPackage && { 
          packageConfig: {
            packageId: selectedPackage.id,
            totalSessions: selectedPackage.totalSessions,
            sessionsUsed: 0,
            transferrable: selectedPackage.isTransferrable,
          }
        }),
      };

      validateBooking(request).then(validationResult => {
        setValidation(validationResult);
        
        if (validationResult && !validationResult.isValid) {
          setFormErrors(validationResult.errors);
        } else {
          setFormErrors([]);
        }
      }).catch(error => {
        console.error('Validation error:', error);
        setFormErrors(['Failed to validate booking']);
      });
    }
  }, [currentStep, totalSteps, selectedTimeSlot, user.id, provider.id, selectedServices, bookingType, notes, specialRequests, selectedPackage, recurrenceConfig, validateBooking]);

  // Memoized total calculation to avoid re-renders
  const totalPrice = useMemo(() => {
    let baseTotal = selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
    
    if (selectedPackage) {
      baseTotal = selectedPackage.price;
    }
    
    if (bookingType === BookingType.RECURRING && recurrenceConfig.maxOccurrences) {
      baseTotal *= recurrenceConfig.maxOccurrences;
    }
    
    return baseTotal;
  }, [selectedServices, selectedPackage, bookingType, recurrenceConfig]);

  const calculateTotal = useCallback((): number => {
    return totalPrice;
  }, [totalPrice]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setSelectedSlot(null); // Reset time slot when date changes
    }
  };

  const handleTimeSlotSelected = useCallback(async (slot: TimeSlot) => {
    try {
      // Reserve the slot temporarily
      await reserveSlot({
        providerId: provider.id,
        serviceId: selectedServices[0]?.id || 1,
        requestedStartTime: slot.startTime,
        duration: selectedServices.reduce((sum, service) => sum + (service.estimatedDurationMinutes || 60), 0), // Default duration
        clientId: user.id,
      });
      
      setShowTimeSlotPicker(false);
    } catch (error) {
      console.error('Error reserving slot:', error);
      Alert.alert('Error', 'Failed to reserve time slot. Please try again.');
    }
  }, [user.id, provider.id, selectedServices, reserveSlot]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    if (formErrors.length > 0) {
      Alert.alert('Validation Error', formErrors.join('\n'));
      return;
    }

    // Calculate total inline
    let estimatedTotal = selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
    if (selectedPackage) {
      estimatedTotal = selectedPackage.price;
    }
    if (bookingType === BookingType.RECURRING && recurrenceConfig.maxOccurrences) {
      estimatedTotal *= recurrenceConfig.maxOccurrences;
    }

    const request: BookingRequest = {
      clientId: user.id,
      providerId: provider.id,
      serviceIds: selectedServices.map(s => s.id.toString()),
      requestedDateTime: selectedTimeSlot.startTime,
      duration: selectedServices.reduce((sum, service) => sum + (service.estimatedDurationMinutes || 60), 0),
      type: bookingType,
      notes,
      specialRequests,
      estimatedTotal,
      ...(selectedPackage && { 
        packageConfig: {
          packageId: selectedPackage.id,
          totalSessions: selectedPackage.totalSessions,
          sessionsUsed: 0,
          transferrable: selectedPackage.isTransferrable,
        }
      }),
    };

    try {
      let success = false;
      
      // First confirm the time slot reservation if we have one
      if (currentReservation) {
        const bookingId = await confirmReservation();
        if (!bookingId) {
          throw new Error('Failed to confirm time slot reservation');
        }
      }
      
      if (bookingType === BookingType.RECURRING) {
        success = await createRecurringBooking(request, recurrenceConfig);
      } else {
        const booking = await createBooking(request);
        success = booking !== null;
      }

      if (success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      Alert.alert(
        'Booking Error',
        error instanceof Error ? error.message : 'Failed to create booking'
      );
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index + 1 <= currentStep && styles.stepDotActive,
          ]}
        >
          <Text style={[
            styles.stepText,
            index + 1 <= currentStep && styles.stepTextActive,
          ]}>
            {index + 1}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderBookingTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Booking Type</Text>
      
      <TouchableOpacity
        style={[
          styles.optionCard,
          bookingType === BookingType.SINGLE && styles.optionCardSelected,
        ]}
        onPress={() => setBookingType(BookingType.SINGLE)}
      >
        <Ionicons
          name="calendar-outline"
          size={24}
          color={bookingType === BookingType.SINGLE ? '#007AFF' : '#666'}
        />
        <View style={styles.optionContent}>
          <Text style={[
            styles.optionTitle,
            bookingType === BookingType.SINGLE && styles.optionTitleSelected,
          ]}>
            Single Booking
          </Text>
          <Text style={styles.optionDescription}>
            Book a one-time appointment
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.optionCard,
          bookingType === BookingType.RECURRING && styles.optionCardSelected,
        ]}
        onPress={() => setBookingType(BookingType.RECURRING)}
      >
        <Ionicons
          name="repeat-outline"
          size={24}
          color={bookingType === BookingType.RECURRING ? '#007AFF' : '#666'}
        />
        <View style={styles.optionContent}>
          <Text style={[
            styles.optionTitle,
            bookingType === BookingType.RECURRING && styles.optionTitleSelected,
          ]}>
            Recurring Booking
          </Text>
          <Text style={styles.optionDescription}>
            Schedule multiple appointments
          </Text>
        </View>
      </TouchableOpacity>

      {packages.length > 0 && (
        <TouchableOpacity
          style={[
            styles.optionCard,
            bookingType === BookingType.PACKAGE && styles.optionCardSelected,
          ]}
          onPress={() => setBookingType(BookingType.PACKAGE)}
        >
          <Ionicons
            name="gift-outline"
            size={24}
            color={bookingType === BookingType.PACKAGE ? '#007AFF' : '#666'}
          />
          <View style={styles.optionContent}>
            <Text style={[
              styles.optionTitle,
              bookingType === BookingType.PACKAGE && styles.optionTitleSelected,
            ]}>
              Package Booking
            </Text>
            <Text style={styles.optionDescription}>
              Use a pre-purchased package
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDateTimeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Date & Time</Text>
      
      <TouchableOpacity
        style={styles.dateSelector}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#007AFF" />
        <Text style={styles.dateSelectorText}>
          {selectedDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Advanced Time Slot Selection */}
      <View style={styles.timeSlotSection}>
        <View style={styles.timeSlotHeader}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          <TouchableOpacity
            style={styles.advancedSlotButton}
            onPress={() => setShowTimeSlotPicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.advancedSlotButtonText}>Choose Time</Text>
          </TouchableOpacity>
        </View>

        {selectedTimeSlot ? (
          <View style={styles.selectedSlotContainer}>
            <View style={styles.selectedSlotInfo}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              <View style={styles.selectedSlotDetails}>
                <Text style={styles.selectedSlotTime}>
                  {new Date(selectedTimeSlot.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - {new Date(selectedTimeSlot.endTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                <Text style={styles.selectedSlotPrice}>
                  ${selectedTimeSlot.price?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.changeSlotButton}
              onPress={() => setShowTimeSlotPicker(true)}
            >
              <Text style={styles.changeSlotButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noSlotSelectedContainer}>
            <Text style={styles.noSlotSelectedText}>
              No time slot selected
            </Text>
            <Text style={styles.noSlotSelectedSubtext}>
              Tap "Choose Time" to see available slots
            </Text>
          </View>
        )}

        {/* Show current reservation status */}
        {currentReservation && currentReservation.expiresAt && (
          <View style={styles.reservationStatus}>
            <Ionicons name="lock-closed" size={16} color="#FF9500" />
            <Text style={styles.reservationStatusText}>
              Slot reserved for {Math.max(0, Math.ceil(
                (new Date(currentReservation.expiresAt).getTime() - Date.now()) / 60000
              ))} minutes
            </Text>
          </View>
        )}
      </View>

      {/* TimeSlot Picker Modal */}
      {user?.id && provider?.id && selectedServices?.length > 0 && (
        <TimeSlotPicker
          visible={!!showTimeSlotPicker}
          onClose={() => setShowTimeSlotPicker(false)}
          onSlotSelected={handleTimeSlotSelected}
          providerId={Number(provider.id)}
          serviceId={Number(selectedServices[0]?.id) || 1}
          serviceDuration={selectedServices.reduce((sum, service) => sum + (Number(service.estimatedDurationMinutes) || 60), 0)}
          clientId={Number(user.id)}
          initialDate={selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
        />
      )}
    </View>
  );

  const renderRecurrenceConfiguration = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Recurrence Settings</Text>
      
      <View style={styles.recurrenceOptions}>
        <Text style={styles.sectionTitle}>Repeat Every</Text>
        
        <View style={styles.recurrenceTypeContainer}>
          {[
            { type: RecurrenceType.WEEKLY, label: 'Week' },
            { type: RecurrenceType.BIWEEKLY, label: '2 Weeks' },
            { type: RecurrenceType.MONTHLY, label: 'Month' },
          ].map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.recurrenceTypeButton,
                recurrenceConfig.type === option.type && styles.recurrenceTypeButtonSelected,
              ]}
              onPress={() => setRecurrenceConfig(prev => ({ ...prev, type: option.type }))}
            >
              <Text style={[
                styles.recurrenceTypeText,
                recurrenceConfig.type === option.type && styles.recurrenceTypeTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Number of Sessions</Text>
          <TextInput
            style={styles.numberInput}
            value={recurrenceConfig.maxOccurrences?.toString() || ''}
            onChangeText={(text) => {
              const num = parseInt(text) || 1;
              setRecurrenceConfig(prev => ({ ...prev, maxOccurrences: num }));
            }}
            keyboardType="numeric"
            placeholder="10"
          />
        </View>
      </View>
    </View>
  );

  const renderReviewAndConfirm = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      
      <View style={styles.reviewSection}>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Provider</Text>
          <Text style={styles.reviewValue}>{provider.fullName}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Services</Text>
          <Text style={styles.reviewValue}>
            {selectedServices.map(s => s.name).join(', ')}
          </Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Date & Time</Text>
          <Text style={styles.reviewValue}>
            {selectedDate.toLocaleDateString()} at{' '}
            {selectedTimeSlot && new Date(selectedTimeSlot.startTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>

        {bookingType === BookingType.RECURRING && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Recurrence</Text>
            <Text style={styles.reviewValue}>
              Every {recurrenceConfig.type} for {recurrenceConfig.maxOccurrences} sessions
            </Text>
          </View>
        )}
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Total</Text>
          <Text style={[styles.reviewValue, styles.totalPrice]}>
            ${totalPrice.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Notes (Optional)</Text>
        <TextInput
          style={styles.textArea}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
        <TextInput
          style={styles.textArea}
          value={specialRequests}
          onChangeText={setSpecialRequests}
          placeholder="Any special requirements..."
          multiline
          numberOfLines={3}
        />
      </View>

      {validation && !validation.isValid && (
        <View style={styles.validationErrors}>
          <Text style={styles.errorTitle}>Please fix the following issues:</Text>
          {validation.errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>• {error}</Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBookingTypeSelection();
      case 2:
        return renderDateTimeSelection();
      case 3:
        return bookingType === BookingType.RECURRING 
          ? renderRecurrenceConfiguration() 
          : renderReviewAndConfirm();
      case 4:
        return renderReviewAndConfirm();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingType !== null;
      case 2:
        return selectedTimeSlot !== null;
      case 3:
        if (bookingType === BookingType.RECURRING) {
          return recurrenceConfig.maxOccurrences && recurrenceConfig.maxOccurrences > 0;
        }
        return validation?.isValid ?? false;
      case 4:
        return validation?.isValid ?? false;
      default:
        return false;
    }
  };

  if (!visible) return null;

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
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={styles.placeholder} />
        </View>

        {renderStepIndicator()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handlePrevious}
              >
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < totalSteps ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  !canProceed() && styles.buttonDisabled,
                ]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  (!canProceed() || loading.creating) && styles.buttonDisabled,
                ]}
                onPress={handleCreateBooking}
                disabled={!canProceed() || loading.creating}
              >
                {loading.creating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  stepDotActive: {
    backgroundColor: '#007AFF',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  stepTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  optionContent: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionTitleSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginBottom: 20,
  },
  dateSelectorText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  timeSlotsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timeSlotsScroll: {
    flexDirection: 'row',
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
  },
  timeSlotTextSelected: {
    color: '#FFF',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },
  noSlotsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666',
  },
  recurrenceOptions: {
    marginBottom: 20,
  },
  recurrenceTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  recurrenceTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  recurrenceTypeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  recurrenceTypeText: {
    fontSize: 14,
    color: '#333',
  },
  recurrenceTypeTextSelected: {
    color: '#FFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  totalPrice: {
    fontSize: 18,
    color: '#007AFF',
  },
  validationErrors: {
    backgroundColor: '#FFF3F3',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorBanner: {
    backgroundColor: '#D32F2F',
    padding: 12,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  // Time Slot Selection Styles
  timeSlotSection: {
    marginTop: 20,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  advancedSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  advancedSlotButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  selectedSlotContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSlotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedSlotDetails: {
    marginLeft: 12,
    flex: 1,
  },
  selectedSlotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedSlotPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  changeSlotButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeSlotButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noSlotSelectedContainer: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noSlotSelectedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noSlotSelectedSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  reservationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  reservationStatusText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default AdvancedBookingModal;
