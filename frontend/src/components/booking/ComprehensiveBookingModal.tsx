import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { ProviderProfile, Service, User } from '../../types';
import { 
  comprehensiveBookingService, 
  BookingTimeSlot, 
  BookingRequest as ServiceBookingRequest,
  BookingResponse 
} from '../../services/comprehensiveBookingService';

// Booking types
interface LocalBookingRequest {
  id?: string;
  clientId: number;
  providerId: number;
  services: Service[];
  timeSlot: BookingTimeSlot;
  totalPrice: number;
  totalDuration: number; // in minutes
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  notes?: string;
}

interface ComprehensiveBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (booking: ServiceBookingRequest) => void;
  provider: User; // Provider is a User with ServiceProvider role
  selectedServices: Service[];
  clientId: number;
}

type BookingStep = 'service-review' | 'time-selection' | 'summary' | 'confirmation';

const ComprehensiveBookingModal: React.FC<ComprehensiveBookingModalProps> = ({
  visible,
  onClose,
  onSuccess,
  provider,
  selectedServices,
  clientId,
}) => {
  const { colors, typography, spacing } = useTheme();
  const { user: authUser, token, isAuthenticated, refreshToken, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState<BookingStep>('service-review');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<BookingTimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingTimeSlot | null>(null);
  const [bookingRequest, setBookingRequest] = useState<LocalBookingRequest | null>(null);
  const [providerAvailableDates, setProviderAvailableDates] = useState<{[key: string]: any}>({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  
  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Screen dimensions
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Calculate total price and duration
  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + (service.estimatedDurationMinutes || 60), 0);

  useEffect(() => {
    if (visible) {
      // Animate modal entrance
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Check authentication state
      console.log('🔍 Booking Modal Auth State:', {
        isAuthenticated,
        hasToken: !!token,
        hasAuthUser: !!authUser,
        authUserId: authUser?.id,
        clientId,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
      });
      
      if (!isAuthenticated || !token) {
        Alert.alert(
          'Authentication Required',
          'Please log in to book an appointment.',
          [
            {
              text: 'OK',
              onPress: () => onClose()
            }
          ]
        );
        return;
      }
      
      setCurrentStep('service-review');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedTimeSlot(null);
      setBookingRequest(null);
      setError(null);
      setShowSuccessPopup(false);
      fetchProviderAvailability();
    } else {
      // Reset animations when modal closes
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      progressAnim.setValue(0);
    }
  }, [visible, isAuthenticated, token]);

  useEffect(() => {
    if (selectedDate && currentStep === 'time-selection') {
      fetchAvailableSlots(selectedDate);
    }
    
    // Animate progress indicator
    const steps = ['service-review', 'time-selection', 'summary', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    const progress = (currentIndex + 1) / steps.length;
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [selectedDate, currentStep]);

  const fetchProviderAvailability = async () => {
    try {
      setCalendarLoading(true);
      
      // Generate availability for the next 60 days
      const availableDates: {[key: string]: any} = {};
      const today = new Date();
      
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Mock provider availability - skip Sundays and random days
        const dayOfWeek = date.getDay();
        const isAvailable = dayOfWeek !== 0 && Math.random() > 0.2; // 80% availability, no Sundays
        
        if (isAvailable) {
          availableDates[dateString] = {
            marked: true,
            dotColor: '#10b981',
            activeOpacity: 0.8,
            selected: false,
            selectedColor: '#3b82f6',
          };
        } else {
          availableDates[dateString] = {
            disabled: true,
            disableTouchEvent: true,
            textColor: '#d1d5db',
          };
        }
      }
      
      setProviderAvailableDates(availableDates);
    } catch (error) {
      console.error('Error fetching provider availability:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    try {
      setLoading(true);
      setError(null);

      const serviceIds = selectedServices.map(s => s.id);
      
      console.log('🔍 Fetching available slots for:', {
        providerId: provider.id,
        date,
        serviceIds
      });
      
      const response = await comprehensiveBookingService.getAvailableSlots({
        providerId: provider.id,
        date,
        serviceIds,
      });
      
      console.log('📅 Available slots response:', response);
      
      setAvailableSlots(response.slots);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotSelection = (slot: BookingTimeSlot) => {
    setSelectedTimeSlot(slot);
    
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Animate to next step
    setTimeout(() => {
      animateToStep('summary');
    }, 300);
  };

  const handleDateSelection = (day: DateData) => {
    const dateString = day.dateString;
    
    // Check if the date is available
    const dateInfo = providerAvailableDates[dateString];
    if (dateInfo && !dateInfo.disabled) {
      setSelectedDate(dateString);
      
      // Update calendar selection
      const updatedDates = { ...providerAvailableDates };
      
      // Clear previous selection
      Object.keys(updatedDates).forEach(date => {
        if (updatedDates[date].selected) {
          updatedDates[date] = {
            ...updatedDates[date],
            selected: false,
          };
        }
      });
      
      // Set new selection
      updatedDates[dateString] = {
        ...updatedDates[dateString],
        selected: true,
        selectedColor: '#3b82f6',
      };
      
      setProviderAvailableDates(updatedDates);
    }
  };

  const animateToStep = (nextStep: BookingStep) => {
    // Slide out current content
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Change step
      setCurrentStep(nextStep);
      
      // Slide in new content
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleBackStep = () => {
    switch (currentStep) {
      case 'time-selection':
        animateToStep('service-review');
        break;
      case 'summary':
        animateToStep('time-selection');
        break;
      case 'confirmation':
        // Don't allow back from confirmation
        break;
      default:
        onClose();
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleBookingConfirmation = async () => {
    if (!selectedTimeSlot) return;

    // Additional authentication check
    if (!isAuthenticated || !token) {
      Alert.alert(
        'Authentication Error',
        'You must be logged in to book an appointment. Please log in and try again.',
        [
          {
            text: 'OK',
            onPress: () => onClose()
          }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      
      // Create ISO string for the scheduled start time with proper timezone handling
      const [hours, minutes] = selectedTimeSlot.startTime.split(':').map(Number);
      const scheduledStartDateTime = new Date(selectedDate);
      scheduledStartDateTime.setHours(hours, minutes, 0, 0);
      
      console.log('🔍 Booking Request Details:', {
        selectedDate,
        selectedTimeSlot: selectedTimeSlot.startTime,
        localDateTime: scheduledStartDateTime.toLocaleString(),
        isoString: scheduledStartDateTime.toISOString(),
        providerId: provider.id,
        serviceIds: selectedServices.map(s => s.id),
        totalPrice,
        totalDuration,
        clientId,
        isAuthenticated,
        hasToken: !!token
      });
      
      const serviceBooking: ServiceBookingRequest = {
        clientId,
        providerId: provider.id,
        serviceIds: selectedServices.map(s => s.id),
        scheduledStartTime: scheduledStartDateTime.toISOString(),
        totalPrice,
        totalDuration,
        status: 'pending',
        notes: '', // Can be added later
      };

      // Create booking through service
      console.log('🚀 About to create booking...');
      console.log('🔍 Current auth state before booking:', {
        isAuthenticated,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 30)}...` : 'null',
        clientId,
        providerId: provider.id
      });
      
      // Log the exact booking request details
      console.log('📝 Booking request details:', {
        serviceBooking,
        selectedTimeSlot,
        selectedDate,
        scheduledStartDateTime: scheduledStartDateTime.toISOString(),
        timeSlotId: selectedTimeSlot.id,
        timeSlotStartTime: selectedTimeSlot.startTime,
        timeSlotEndTime: selectedTimeSlot.endTime,
        totalDuration: totalDuration,
        calculatedEndTime: new Date(scheduledStartDateTime.getTime() + totalDuration * 60000).toISOString()
      });
      
      // Additional token validation
      if (!token || token.length < 50) {
        throw new Error('Invalid or missing authentication token');
      }
      
      // Validate token before making booking request
      try {
        console.log('🔍 Validating token before booking...');
        await authService.validateToken(token);
        console.log('✅ Token validation successful');
      } catch (tokenError) {
        console.error('❌ Token validation failed:', tokenError);
        throw new Error('Authentication token is invalid or expired');
      }
      
      const response = await comprehensiveBookingService.createBooking(serviceBooking);
      
      const localBooking: LocalBookingRequest = {
        id: response.id,
        clientId,
        providerId: provider.id,
        services: selectedServices,
        timeSlot: selectedTimeSlot,
        totalPrice,
        totalDuration,
        status: 'pending',
        createdAt: new Date(),
      };

      setBookingRequest(localBooking);
      setCurrentStep('confirmation');
      setLoading(false);
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Convert response to ServiceBookingRequest format for onSuccess callback
      const successBooking: ServiceBookingRequest = {
        clientId: response.clientId,
        providerId: response.providerId,
        serviceIds: selectedServices.map(s => s.id),
        scheduledStartTime: scheduledStartDateTime.toISOString(),
        totalPrice: response.totalPrice,
        totalDuration: response.totalDuration,
        status: response.status,
        notes: response.notes || '',
      };
      
      // Call onSuccess callback
      onSuccess(successBooking);
      
      // Auto-close popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
        setTimeout(() => {
          onClose();
        }, 300);
      }, 3000);
      
    } catch (err: any) {
      console.error('Booking creation error:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        responseData: err?.response?.data,
        responseStatus: err?.response?.status,
        responseHeaders: err?.response?.headers,
        stack: err?.stack
      });
      
      // Handle token validation errors
      if (err?.message?.includes('Authentication token is invalid')) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log out and log back in.',
          [
            {
              text: 'Log Out',
              onPress: async () => {
                await logout();
                onClose();
              }
            },
            {
              text: 'Cancel',
              onPress: () => onClose()
            }
          ]
        );
        setError('Authentication token is invalid or expired');
        setLoading(false);
        return;
      }
      
      // Handle specific authentication errors
      if (err?.response?.status === 401) {
        console.log('🔄 401 error detected, attempting to refresh token...');
        
        try {
          // Try to refresh the token
          await refreshToken();
          
          // Retry the booking request
          console.log('🔄 Token refreshed, retrying booking...');
          const response = await comprehensiveBookingService.createBooking(serviceBooking);
          
          // If successful, continue with the rest of the booking logic
          const localBooking: LocalBookingRequest = {
            id: response.id,
            clientId,
            providerId: provider.id,
            services: selectedServices,
            timeSlot: selectedTimeSlot,
            totalPrice,
            totalDuration,
            status: 'pending',
            createdAt: new Date(),
          };

          setBookingRequest(localBooking);
          setCurrentStep('confirmation');
          setLoading(false);
          
          // Show success popup
          setShowSuccessPopup(true);
          
          // Convert response to ServiceBookingRequest format for onSuccess callback
          const successBooking: ServiceBookingRequest = {
            clientId: response.clientId,
            providerId: response.providerId,
            serviceIds: selectedServices.map(s => s.id),
            scheduledStartTime: scheduledStartDateTime.toISOString(),
            totalPrice: response.totalPrice,
            totalDuration: response.totalDuration,
            status: response.status,
            notes: response.notes || '',
          };
          
          // Call onSuccess callback
          onSuccess(successBooking);
          
          // Auto-close popup after 3 seconds
          setTimeout(() => {
            setShowSuccessPopup(false);
            setTimeout(() => {
              onClose();
            }, 300);
          }, 3000);
          
          return; // Exit the function successfully
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          Alert.alert(
            'Authentication Error',
            'Your session has expired. Please log in again to book an appointment.',
            [
              {
                text: 'OK',
                onPress: () => onClose()
              }
            ]
          );
          return;
        }
      }
      
      // Extract error message from API response
      let errorMessage = 'Failed to create booking';
      if (err?.response?.data?.errorMessage) {
        errorMessage = err.response.data.errorMessage;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      console.log('🔍 Final error message:', errorMessage);
      
      setError(errorMessage);
      setLoading(false);
      
      // Show detailed error alert
      Alert.alert(
        'Booking Error', 
        `${errorMessage}\n\nPlease try selecting a different time slot or refreshing the available times.`,
        [
          {
            text: 'Refresh Times',
            onPress: () => {
              setError(null);
              if (selectedDate) {
                fetchAvailableSlots(selectedDate);
              }
            }
          },
          {
            text: 'OK',
            onPress: () => {
              setError(null);
            }
          }
        ]
      );
    }
  };

  // Success popup render function
  const renderSuccessPopup = () => {
    if (!showSuccessPopup) return null;

    return (
      <View style={styles.successPopupOverlay}>
        <View style={[styles.successPopup, { backgroundColor: colors.background.secondary }]}>
          {/* Animated checkmark icon */}
          <View style={[styles.successIconContainer, { backgroundColor: colors.status.success + '20' }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.status.success }]}>
              <Ionicons name="checkmark" size={32} color={colors.text.inverse} />
            </View>
          </View>
          
          <Text style={[styles.successTitle, { color: colors.text.primary }]}>
            Booking Confirmed! 🎉
          </Text>
          
          <Text style={[styles.successMessage, { color: colors.text.secondary }]}>
            Your appointment with{' '}
            <Text style={[styles.providerName, { color: colors.primary }]}>
              {provider.fullName}
            </Text>
            {' '}has been successfully booked. You'll receive reminders before your appointment.
          </Text>
          
          <View style={[styles.successDetails, { backgroundColor: colors.background.tertiary }]}>
            <View style={styles.successDetailRow}>
              <View style={styles.successDetailItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={[styles.successDetailLabel, { color: colors.text.secondary }]}>
                  Date
                </Text>
              </View>
              <Text style={[styles.successDetailValue, { color: colors.text.primary }]}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            
            <View style={styles.successDetailRow}>
              <View style={styles.successDetailItem}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.successDetailLabel, { color: colors.text.secondary }]}>
                  Time
                </Text>
              </View>
              <Text style={[styles.successDetailValue, { color: colors.text.primary }]}>
                {selectedTimeSlot ? formatTime(selectedTimeSlot.startTime) : 'TBD'}
              </Text>
            </View>
            
            <View style={styles.successDetailRow}>
              <View style={styles.successDetailItem}>
                <Ionicons name="list-outline" size={16} color={colors.primary} />
                <Text style={[styles.successDetailLabel, { color: colors.text.secondary }]}>
                  Services
                </Text>
              </View>
              <Text style={[styles.successDetailValue, { color: colors.text.primary }]}>
                {selectedServices.map(s => s.name).join(', ')}
              </Text>
            </View>
            
            <View style={[styles.successDetailRow, styles.totalRow]}>
              <View style={styles.successDetailItem}>
                <Ionicons name="card-outline" size={16} color={colors.status.success} />
                <Text style={[styles.successDetailLabel, { color: colors.text.secondary }]}>
                  Total
                </Text>
              </View>
              <Text style={[styles.successDetailValue, styles.totalValue, { color: colors.status.success }]}>
                ${totalPrice.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={[styles.successActions, { borderTopColor: colors.border.primary }]}>
            <TouchableOpacity 
              style={[styles.successActionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowSuccessPopup(false);
                onClose();
              }}
            >
              <Text style={[styles.successActionText, { color: colors.text.inverse }]}>
                Great!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'service-review': return 'Review Services';
      case 'time-selection': return 'Select Time';
      case 'summary': return 'Booking Summary';
      case 'confirmation': return 'Booking Confirmed';
      default: return 'Book Appointment';
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'service-review', title: 'Services', icon: 'list-outline' },
      { id: 'time-selection', title: 'Schedule', icon: 'calendar-outline' },
      { id: 'summary', title: 'Summary', icon: 'checkmark-outline' },
      { id: 'confirmation', title: 'Complete', icon: 'trophy-outline' }
    ];
    
    return (
      <View style={styles.modernStepIndicator}>
        {/* Progress bar background */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.border.primary }]} />
          <Animated.View 
            style={[
              styles.progressBar,
              { 
                backgroundColor: colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]} 
          />
        </View>
        
        {/* Step indicators */}
        <View style={styles.stepIndicatorRow}>
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            
            return (
              <View key={step.id} style={styles.stepIndicatorItem}>
                <View style={[
                  styles.modernStepCircle,
                  { 
                    backgroundColor: isActive ? colors.primary : isCompleted ? colors.accent : colors.background.tertiary,
                    borderColor: isActive ? colors.primary : isCompleted ? colors.accent : colors.border.primary,
                    transform: [{ scale: isActive ? 1.1 : 1 }]
                  }
                ]}>
                  <Ionicons 
                    name={step.icon as any} 
                    size={16} 
                    color={isActive || isCompleted ? colors.text.inverse : colors.text.secondary} 
                  />
                </View>
                <Text style={[
                  styles.stepIndicatorText,
                  { 
                    color: isActive ? colors.primary : isCompleted ? colors.accent : colors.text.secondary,
                    fontWeight: isActive ? '600' : '400'
                  }
                ]}>
                  {step.title}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderServiceReview = () => (
    <Animated.View style={[
      styles.stepContent,
      {
        opacity: fadeAnim,
        transform: [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          },
          { scale: scaleAnim }
        ]
      }
    ]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Selected Services
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Review your selected services before scheduling
          </Text>
        </View>

        {/* Services */}
        <View style={styles.servicesContainer}>
          {selectedServices.map((service, index) => (
            <Animated.View 
              key={service.id} 
              style={[
                styles.modernServiceCard,
                { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.primary,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30 * (index + 1), 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.serviceCardContent}>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.modernServiceName, { color: colors.text.primary }]}>
                    {service.name}
                  </Text>
                  <Text style={[styles.modernServiceDescription, { color: colors.text.secondary }]}>
                    {service.description}
                  </Text>
                  <View style={styles.serviceMeta}>
                    <View style={styles.serviceMetaItem}>
                      <Ionicons name="time-outline" size={14} color={colors.primary} />
                      <Text style={[styles.serviceMetaText, { color: colors.text.secondary }]}>
                        {service.estimatedDurationMinutes || 60} min
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.modernServicePrice}>
                  <Text style={[styles.modernPriceText, { color: colors.accent }]}>
                    ${service.price || 0}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
        
        {/* Total Summary */}
        <View style={[styles.modernTotalSection, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
          <LinearGradient
            colors={[colors.primary + '10', colors.accent + '10']}
            style={styles.totalGradient}
          >
            <View style={styles.totalRow}>
              <View style={styles.totalItem}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
                  Total Duration
                </Text>
              </View>
              <Text style={[styles.totalValue, { color: colors.text.primary }]}>
                {totalDuration} minutes
              </Text>
            </View>
            <View style={styles.totalRow}>
              <View style={styles.totalItem}>
                <Ionicons name="card-outline" size={18} color={colors.accent} />
                <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
                  Total Price
                </Text>
              </View>
              <Text style={[styles.modernTotalPrice, { color: colors.accent }]}>
                ${totalPrice.toFixed(2)}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[styles.modernContinueButton, { backgroundColor: colors.primary }]}
          onPress={() => animateToStep('time-selection')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.buttonGradient}
          >
            <Text style={[styles.modernContinueText, { color: colors.text.inverse }]}>
              Continue to Time Selection
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Back Button */}
        <TouchableOpacity 
          style={[styles.modernBackButton, { backgroundColor: colors.background.tertiary }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.modernBackText, { color: colors.text.secondary }]}>
            Back to Provider
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );

  const renderTimeSelection = () => (
    <Animated.View style={[
      styles.stepContent,
      {
        opacity: fadeAnim,
        transform: [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          },
          { scale: scaleAnim }
        ]
      }
    ]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Choose Your Time
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Select your preferred date and time slot
          </Text>
        </View>
        
        {/* Calendar Section */}
        <View style={[styles.modernCalendarSection, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
          <View style={styles.calendarHeader}>
            <View style={styles.calendarTitleContainer}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.modernCalendarTitle, { color: colors.text.primary }]}>
                Select Date
              </Text>
            </View>
          </View>
          
          {calendarLoading ? (
            <View style={styles.modernLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.modernLoadingText, { color: colors.text.secondary }]}>
                Loading available dates...
              </Text>
            </View>
          ) : (
            <Calendar
              style={styles.modernCalendar}
              theme={{
                backgroundColor: colors.background.secondary,
                calendarBackground: colors.background.secondary,
                textSectionTitleColor: colors.text.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.text.inverse,
                todayTextColor: colors.primary,
                dayTextColor: colors.text.primary,
                textDisabledColor: colors.text.secondary,
                dotColor: colors.accent,
                selectedDotColor: colors.text.inverse,
                arrowColor: colors.primary,
                monthTextColor: colors.text.primary,
                indicatorColor: colors.primary,
                textDayFontWeight: '600',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
              onDayPress={handleDateSelection}
              markedDates={providerAvailableDates}
              minDate={new Date().toISOString().split('T')[0]}
              maxDate={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              hideExtraDays={true}
              firstDay={1}
              showWeekNumbers={false}
              disableMonthChange={false}
              hideDayNames={false}
              showSixWeeks={false}
            />
          )}
        </View>

        {/* Time Slots Section */}
        {selectedDate && !calendarLoading && (
          <View style={[styles.modernTimeSlotsSection, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
            <View style={styles.timeSlotsHeader}>
              <View style={styles.timeSlotsTitle}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={[styles.modernTimeSlotsTitle, { color: colors.text.primary }]}>
                  Available Times
                </Text>
              </View>
              <Text style={[styles.timeSlotsSubtitle, { color: colors.text.secondary }]}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric'
                })}
              </Text>
            </View>

            {loading && (
              <View style={styles.modernLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.modernLoadingText, { color: colors.text.secondary }]}>
                  Loading available times...
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.modernErrorContainer}>
                <Ionicons name="warning-outline" size={32} color={colors.status.error} />
                <Text style={[styles.modernErrorText, { color: colors.status.error }]}>
                  {error}
                </Text>
                <TouchableOpacity 
                  style={[styles.modernRetryButton, { backgroundColor: colors.primary }]}
                  onPress={() => fetchAvailableSlots(selectedDate)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modernRetryText, { color: colors.text.inverse }]}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && availableSlots.length === 0 && (
              <View style={styles.modernEmptyContainer}>
                <Ionicons name="time-outline" size={48} color={colors.text.secondary} />
                <Text style={[styles.modernEmptyText, { color: colors.text.secondary }]}>
                  No available times
                </Text>
                <Text style={[styles.modernEmptySubtext, { color: colors.text.secondary }]}>
                  Please select a different date
                </Text>
              </View>
            )}

            {!loading && !error && availableSlots.length > 0 && (
              <View style={styles.modernSlotsGrid}>
                {availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.modernSlotButton,
                      {
                        backgroundColor: slot.isAvailable ? colors.background.primary : colors.background.tertiary,
                        borderColor: slot.isAvailable ? colors.primary : colors.border.primary,
                      },
                      !slot.isAvailable && styles.modernSlotDisabled,
                    ]}
                    onPress={() => slot.isAvailable && handleTimeSlotSelection(slot)}
                    disabled={!slot.isAvailable}
                    activeOpacity={0.8}
                  >
                    {slot.isAvailable ? (
                      <LinearGradient
                        colors={[colors.primary + '10', colors.accent + '10']}
                        style={styles.slotGradient}
                      >
                        <Text style={[styles.modernSlotTime, { color: colors.text.primary }]}>
                          {formatTime(slot.startTime)}
                        </Text>
                        <Text style={[styles.modernSlotDuration, { color: colors.text.secondary }]}>
                          {formatTime(slot.endTime)}
                        </Text>
                        <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                      </LinearGradient>
                    ) : (
                      <View style={styles.slotDisabledContent}>
                        <Text style={[styles.modernSlotTimeDisabled, { color: colors.text.secondary }]}>
                          {formatTime(slot.startTime)}
                        </Text>
                        <Ionicons name="close-circle" size={16} color={colors.text.secondary} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );

  const renderSummary = () => (
    <Animated.View style={[
      styles.stepContent,
      {
        opacity: fadeAnim,
        transform: [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          },
          { scale: scaleAnim }
        ]
      }
    ]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Booking Summary
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Please review your booking details
          </Text>
        </View>

        {/* Provider Details Card */}
        <View style={[styles.modernSummaryCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
          <LinearGradient
            colors={[colors.accent + '10', colors.primary + '10']}
            style={styles.summaryCardGradient}
          >
            <View style={styles.summaryCardHeader}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="person-outline" size={24} color={colors.accent} />
              </View>
              <Text style={[styles.modernSummaryLabel, { color: colors.text.secondary }]}>
                Provider
              </Text>
            </View>
            <Text style={[styles.modernSummaryValue, { color: colors.text.primary }]}>
              {provider.fullName}
            </Text>
          </LinearGradient>
        </View>

        {/* Date & Time Card */}
        <View style={[styles.modernSummaryCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
          <LinearGradient
            colors={[colors.primary + '15', colors.accent + '15']}
            style={styles.summaryCardGradient}
          >
            <View style={styles.summaryCardHeader}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.modernSummaryLabel, { color: colors.text.secondary }]}>
                Date & Time
              </Text>
            </View>
            <Text style={[styles.modernSummaryValue, { color: colors.text.primary }]}>
              {selectedTimeSlot?.date}
            </Text>
            <Text style={[styles.modernSummaryDescription, { color: colors.text.secondary }]}>
              {formatTime(selectedTimeSlot?.startTime || '')} - {formatTime(selectedTimeSlot?.endTime || '')}
            </Text>
          </LinearGradient>
        </View>

        {/* Services Card */}
        <View style={[styles.modernSummaryCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
          <LinearGradient
            colors={[colors.primary + '10', colors.accent + '10']}
            style={styles.summaryCardGradient}
          >
            <View style={styles.summaryCardHeader}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="cut-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.modernSummaryLabel, { color: colors.text.secondary }]}>
                Services
              </Text>
            </View>
            {selectedServices.map((service, index) => (
              <View key={service.id} style={styles.serviceRow}>
                <View style={styles.serviceBullet}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                </View>
                <Text style={[styles.modernSummaryValue, { color: colors.text.primary }]}>
                  {service.name}
                </Text>
                <Text style={[styles.modernSummaryPrice, { color: colors.text.secondary }]}>
                  ${service.price}
                </Text>
              </View>
            ))}
          </LinearGradient>
        </View>

        {/* Duration & Price Card */}
        <View style={[styles.modernSummaryCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
          <LinearGradient
            colors={[colors.accent + '10', colors.primary + '10']}
            style={styles.summaryCardGradient}
          >
            <View style={styles.summaryDetailsRow}>
              <View style={styles.summaryDetailItem}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="time-outline" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.modernSummaryLabel, { color: colors.text.secondary }]}>
                  Duration
                </Text>
                <Text style={[styles.modernSummaryValue, { color: colors.text.primary }]}>
                  {totalDuration} min
                </Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryDetailItem}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="card-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.modernSummaryLabel, { color: colors.text.secondary }]}>
                  Subtotal
                </Text>
                <Text style={[styles.modernSummaryValue, { color: colors.text.primary }]}>
                  ${totalPrice}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Total Card */}
        <View style={[styles.modernTotalCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.totalCardGradient}
          >
            <View style={styles.totalCardContent}>
              <Text style={[styles.modernTotalLabel, { color: colors.text.inverse }]}>
                Total Amount
              </Text>
              <Text style={[styles.modernTotalValue, { color: colors.text.inverse }]}>
                ${totalPrice}
              </Text>
            </View>
            <View style={styles.totalCardIcon}>
              <Ionicons name="checkmark-circle" size={32} color={colors.text.inverse} />
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.modernButtonRow}>
          <TouchableOpacity 
            style={[styles.modernBackButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}
            onPress={() => setCurrentStep('time-selection')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
            <Text style={[styles.modernBackButtonText, { color: colors.text.primary }]}>
              Back
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modernConfirmButton, { backgroundColor: colors.primary }]}
            onPress={handleBookingConfirmation}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                style={styles.confirmButtonGradient}
              >
                <Text style={[styles.modernConfirmButtonText, { color: colors.text.inverse }]}>
                  Confirm Booking
                </Text>
                <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.confirmationIcon}>
        <Ionicons name="checkmark-circle" size={80} color="#10b981" />
      </View>
      
      <Text style={styles.confirmationTitle}>Booking Request Sent!</Text>
      <Text style={styles.confirmationMessage}>
        Your booking request has been sent to {provider.fullName}. 
        You'll receive a notification once they confirm your appointment.
      </Text>

      <View style={styles.confirmationDetails}>
        <Text style={styles.confirmationLabel}>Booking Status:</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>PENDING CONFIRMATION</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.doneButton}
        onPress={onClose}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'service-review': return renderServiceReview();
      case 'time-selection': return renderTimeSelection();
      case 'summary': return renderSummary();
      case 'confirmation': return renderConfirmation();
      default: return renderServiceReview();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
          <TouchableOpacity 
            onPress={currentStep === 'service-review' ? onClose : handleBackStep}
            style={styles.closeButton}
          >
            <Ionicons 
              name={currentStep === 'service-review' ? 'close' : 'arrow-back'} 
              size={24} 
              color={colors.text.primary} 
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>{getStepTitle()}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderStepIndicator()}
        {renderCurrentStep()}
        {renderSuccessPopup()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modern styles for the updated UI
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    height: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  
  // Step indicator modern styles
  modernStepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  progressBarContainer: {
    position: 'relative',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepIndicatorItem: {
    flex: 1,
    alignItems: 'center',
  },
  modernStepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepConnector: {
    position: 'absolute',
    top: 19,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e5e7eb',
    zIndex: -1,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Modern content styles
  sectionHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  
  // Modern service card styles
  servicesContainer: {
    marginBottom: 24,
  },
  serviceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  modernServiceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  modernServiceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  modernServicePrice: {
    alignItems: 'flex-end',
  },
  modernPriceText: {
    fontSize: 20,
    fontWeight: '700',
  },
  modernTotalSection: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  totalGradient: {
    padding: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  modernTotalPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  modernContinueButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modernContinueText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  modernBackText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modernServiceCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceCardGradient: {
    padding: 16,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  serviceCardPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  serviceCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceCardDuration: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Modern calendar styles
  modernCalendarSection: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  calendarHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernCalendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modernCalendar: {
    borderRadius: 0,
  },
  modernLoadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  modernLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  
  // Modern time slots styles
  modernTimeSlotsSection: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  timeSlotsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timeSlotsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modernTimeSlotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeSlotsSubtitle: {
    fontSize: 14,
    marginLeft: 28,
  },
  modernErrorContainer: {
    padding: 32,
    alignItems: 'center',
  },
  modernErrorText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  modernRetryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modernRetryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modernEmptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  modernEmptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  modernEmptySubtext: {
    marginTop: 4,
    fontSize: 14,
  },
  modernSlotsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modernSlotButton: {
    width: (Dimensions.get('window').width - 64) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernSlotDisabled: {
    opacity: 0.6,
  },
  slotGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotDisabledContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernSlotTime: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  modernSlotDuration: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  modernSlotTimeDisabled: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  // Modern summary styles
  modernSummaryCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCardGradient: {
    padding: 16,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIconContainer: {
    marginRight: 12,
  },
  modernSummaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modernSummaryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  modernSummaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceBullet: {
    marginRight: 8,
  },
  summaryDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  modernTotalCard: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  totalCardGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalCardContent: {
    flex: 1,
  },
  modernTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.9,
  },
  modernTotalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  totalCardIcon: {
    marginLeft: 16,
  },
  modernNotesCard: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modernNotesInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  
  // Modern button styles
  modernButtonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },
  modernBackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modernBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modernConfirmButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modernConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },

  // Original/Legacy styles
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 1,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  servicePrice: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  totalSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  totalValuePrice: {
    fontSize: 20,
    color: '#10b981',
    fontWeight: 'bold',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  backToProviderButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  backToProviderButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  calendarSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calendarLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  calendar: {
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  calendarLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  calendarLoadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  timeSlotsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyTimeSlotsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTimeSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyTimeSlotsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  slotsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  slotTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  slotTimeDisabled: {
    color: '#9ca3af',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summarySection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  summaryServiceItem: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 2,
  },
  summaryTotalLabel: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: 24,
    color: '#10b981',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
    flex: 0.45,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  confirmationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  confirmationIcon: {
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  confirmationDetails: {
    alignItems: 'center',
    marginBottom: 32,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Success popup styles
  successPopupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  successPopup: {
    margin: 32,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    minWidth: Dimensions.get('window').width * 0.8,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  providerName: {
    fontWeight: '600',
  },
  successDetails: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  successDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  successDetailLabel: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  successDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  successActions: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  successActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  successActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Legacy styles for backward compatibility
  successDetailsText: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default ComprehensiveBookingModal;
