import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimeSlot } from '@/context/TimeSlotContext';
import { TimeSlot, BookingConflict, TimeSlotRequest } from '@/types/timeSlot';

interface TimeSlotPickerProps {
  visible: boolean;
  onClose: () => void;
  onSlotSelected: (slot: TimeSlot) => void;
  providerId: number;
  serviceId: number;
  serviceDuration: number; // in minutes
  clientId: number;
  initialDate?: string;
  minPrice?: number;
  maxPrice?: number;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  visible,
  onClose,
  onSlotSelected,
  providerId,
  serviceId,
  serviceDuration,
  clientId,
  initialDate,
  minPrice,
  maxPrice,
}) => {
  const {
    availability,
    conflicts,
    loading,
    error,
    selectedDate,
    selectedSlot,
    fetchAvailability,
    checkConflicts,
    setSelectedDate,
    setSelectedSlot,
    clearConflicts,
    clearError,
    getAvailabilityForProvider,
    isSlotAvailable,
    formatSlotTime,
  } = useTimeSlot();

  const [selectedDateLocal, setSelectedDateLocal] = useState(
    initialDate || new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (visible && providerId) {
      setSelectedDate(selectedDateLocal);
      loadAvailability();
    }
  }, [visible, providerId, selectedDateLocal]);

  const loadAvailability = useCallback(async () => {
    clearError();
    await fetchAvailability(providerId, selectedDateLocal, {
      serviceId,
      duration: serviceDuration,
      minPrice,
      maxPrice,
    });
  }, [providerId, selectedDateLocal, serviceId, serviceDuration, minPrice, maxPrice]);

  const handleSlotPress = async (slot: TimeSlot) => {
    if (!isSlotAvailable(slot)) {
      return; // Don't allow selecting unavailable slots
    }

    clearConflicts();
    setSelectedSlot(slot);

    // Check for conflicts
    const request: TimeSlotRequest = {
      providerId,
      serviceId,
      requestedStartTime: slot.startTime,
      duration: serviceDuration,
      clientId,
    };

    const conflictResults = await checkConflicts(request);
    
    if (conflictResults.length === 0) {
      // No conflicts, slot can be selected
      onSlotSelected(slot);
    } else {
      // Show conflicts dialog
      showConflictsDialog(conflictResults);
    }
  };

  const showConflictsDialog = (conflicts: BookingConflict[]) => {
    const conflictMessages = conflicts.map(c => c.message).join('\n\n');
    
    Alert.alert(
      'Booking Conflict',
      conflictMessages,
      [
        {
          text: 'View Alternatives',
          onPress: () => showAlternatives(conflicts),
        },
        { text: 'Choose Different Time', style: 'cancel' },
      ]
    );
  };

  const showAlternatives = (conflicts: BookingConflict[]) => {
    const alternatives = conflicts
      .flatMap(c => c.suggestedAlternatives || [])
      .filter((slot, index, array) => 
        array.findIndex(s => s.id === slot.id) === index
      ); // Remove duplicates

    if (alternatives.length === 0) {
      Alert.alert('No Alternatives', 'No alternative time slots are available.');
      return;
    }

    Alert.alert(
      'Alternative Times',
      'Here are some alternative time slots:',
      [
        ...alternatives.slice(0, 3).map((slot, index) => ({
          text: `${formatSlotTime(slot)} ${new Date(slot.startTime).toLocaleDateString()}`,
          onPress: () => onSlotSelected(slot),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderDatePicker = () => {
    const dates = [];
    const today = new Date();
    
    // Generate next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {dates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const isSelected = dateStr === selectedDateLocal;
          const isToday = index === 0;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.dateButton, isSelected && styles.selectedDateButton]}
              onPress={() => setSelectedDateLocal(dateStr)}
            >
              <Text style={[styles.dayText, isSelected && styles.selectedDateText]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>
                {date.getDate()}
              </Text>
              {isToday && (
                <Text style={[styles.todayText, isSelected && styles.selectedDateText]}>
                  Today
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderTimeSlot = ({ item: slot }: { item: TimeSlot }) => {
    const available = isSlotAvailable(slot);
    const isSelected = selectedSlot?.id === slot.id;
    const isBooked = slot.bookingId && !slot.isAvailable;
    const isBlocked = slot.isBlocked;

    let statusText = '';
    let statusColor = '#10b981';

    if (isBlocked) {
      statusText = slot.blockReason || 'Blocked';
      statusColor = '#ef4444';
    } else if (isBooked) {
      statusText = 'Already Booked';
      statusColor = '#f59e0b';
    } else if (!available) {
      statusText = 'Unavailable';
      statusColor = '#6b7280';
    }

    return (
      <TouchableOpacity
        style={[
          styles.slotButton,
          !available && styles.slotButtonDisabled,
          isSelected && styles.slotButtonSelected,
        ]}
        onPress={() => handleSlotPress(slot)}
        disabled={!available}
      >
        <View style={styles.slotContent}>
          <Text style={[
            styles.slotTime,
            !available && styles.slotTimeDisabled,
            isSelected && styles.slotTimeSelected,
          ]}>
            {formatSlotTime(slot)}
          </Text>
          
          {slot.price && (
            <Text style={[
              styles.slotPrice,
              !available && styles.slotPriceDisabled,
              isSelected && styles.slotPriceSelected,
            ]}>
              ${slot.price}
            </Text>
          )}
          
          {!available && (
            <Text style={[styles.slotStatus, { color: statusColor }]}>
              {statusText}
            </Text>
          )}
        </View>

        {available && (
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={isSelected ? '#ffffff' : '#10b981'}
          />
        )}
        
        {isBlocked && (
          <Ionicons name="ban-outline" size={20} color="#ef4444" />
        )}
        
        {isBooked && (
          <Ionicons name="person" size={20} color="#f59e0b" />
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    const availabilityData = getAvailabilityForProvider(providerId, selectedDateLocal);

    if (loading.availability) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading available times...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAvailability}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!availabilityData || availabilityData.slots.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyText}>No available time slots for this date</Text>
          <Text style={styles.emptySubtext}>Try selecting a different date</Text>
        </View>
      );
    }

    const availableSlots = availabilityData.slots.filter(slot => isSlotAvailable(slot));
    const unavailableSlots = availabilityData.slots.filter(slot => !isSlotAvailable(slot));

    return (
      <View style={styles.slotsContainer}>
        {/* Business Hours Info */}
        <View style={styles.businessHoursContainer}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.businessHoursText}>
            Business Hours: {availabilityData.businessHours.startTime} - {availabilityData.businessHours.endTime}
          </Text>
        </View>

        {/* Available Slots */}
        {availableSlots.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Available Times ({availableSlots.length})</Text>
            <FlatList
              data={availableSlots}
              renderItem={renderTimeSlot}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.slotRow}
              style={styles.slotsList}
            />
          </>
        )}

        {/* Unavailable Slots */}
        {unavailableSlots.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Unavailable Times</Text>
            <FlatList
              data={unavailableSlots}
              renderItem={renderTimeSlot}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.slotRow}
              style={styles.slotsList}
            />
          </>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Time Slot</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Date Picker */}
        <View style={styles.datePickerContainer}>
          <Text style={styles.sectionTitle}>Choose Date</Text>
          {renderDatePicker()}
        </View>

        {/* Time Slots */}
        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="person" size={16} color="#f59e0b" />
            <Text style={styles.legendText}>Booked</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="ban" size={16} color="#ef4444" />
            <Text style={styles.legendText}>Blocked</Text>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
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
  headerSpacer: {
    width: 32,
  },
  datePickerContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateScroll: {
    paddingHorizontal: 16,
  },
  dateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    minWidth: 70,
  },
  selectedDateButton: {
    backgroundColor: '#3b82f6',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2,
  },
  selectedDateText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  businessHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  businessHoursText: {
    fontSize: 14,
    color: '#0369a1',
    marginLeft: 8,
  },
  slotsContainer: {
    flex: 1,
  },
  slotsList: {
    flexGrow: 0,
    marginBottom: 16,
  },
  slotRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slotButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  slotButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  slotContent: {
    flex: 1,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  slotTimeDisabled: {
    color: '#9ca3af',
  },
  slotTimeSelected: {
    color: '#ffffff',
  },
  slotPrice: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  slotPriceDisabled: {
    color: '#d1d5db',
  },
  slotPriceSelected: {
    color: '#e5e7eb',
  },
  slotStatus: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
});

export default TimeSlotPicker;
