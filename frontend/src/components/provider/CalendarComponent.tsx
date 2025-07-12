import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { TimeSlot, CalendarDay } from '@/services/calendarService';
import { Appointment } from '@/types';

interface CalendarComponentProps {
  calendar: CalendarDay[];
  appointments: Appointment[];
  onDateSelect: (date: string) => void;
  onTimeSlotPress: (slot: TimeSlot) => void;
  onCreateAvailability: (date: string) => void;
  isLoading?: boolean;
  selectedDate: string | null;
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
  calendar,
  appointments,
  onDateSelect,
  onTimeSlotPress,
  onCreateAvailability,
  isLoading = false,
  selectedDate,
}) => {
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<CalendarDay | null>(null);

  const prepareMarkedDates = () => {
    const marked: { [date: string]: any } = {};
    
    calendar.forEach(day => {
      const hasAppointments = day.timeSlots.some(slot => slot.isBooked);
      const hasAvailability = day.timeSlots.some(slot => slot.isAvailable);
      
      marked[day.date] = {
        marked: hasAppointments,
        dotColor: hasAppointments ? '#10b981' : hasAvailability ? '#3b82f6' : '#d1d5db',
        selected: day.date === selectedDate,
        selectedColor: '#8b5cf6',
      };
    });
    
    return marked;
  };

  const handleDayPress = (day: DateData) => {
    const dayData = calendar.find(d => d.date === day.dateString);
    if (dayData) {
      setSelectedDayData(dayData);
      onDateSelect(day.dateString);
      setShowTimeSlots(true);
    }
  };

  const renderTimeSlot = ({ item: slot }: { item: TimeSlot }) => {
    const appointment = appointments.find(apt => 
      slot.appointmentId && apt.id === slot.appointmentId
    );

    return (
      <TouchableOpacity
        style={[
          styles.timeSlot,
          slot.isBooked && styles.bookedSlot,
          slot.isAvailable && styles.availableSlot,
          !slot.isAvailable && !slot.isBooked && styles.unavailableSlot,
        ]}
        onPress={() => onTimeSlotPress(slot)}
        disabled={!slot.isAvailable && !slot.isBooked}
      >
        <View style={styles.timeSlotContent}>
          <Text style={[
            styles.timeSlotTime,
            slot.isBooked && styles.bookedText,
            slot.isAvailable && styles.availableText,
          ]}>
            {formatTimeSlot(slot.startTime, slot.endTime)}
          </Text>
          
          {slot.isBooked && appointment && (
            <View style={styles.appointmentInfo}>
              <Text style={styles.clientName}>
                {appointment.client?.fullName || 'Client'}
              </Text>
              <Text style={styles.serviceName}>
                {appointment.services[0]?.service.name || 'Service'}
              </Text>
            </View>
          )}
          
          {slot.isAvailable && (
            <Text style={styles.availableText}>Available</Text>
          )}
        </View>
        
        <Ionicons
          name={
            slot.isBooked ? 'person' : 
            slot.isAvailable ? 'add-circle-outline' : 
            'lock-closed'
          }
          size={20}
          color={
            slot.isBooked ? '#10b981' : 
            slot.isAvailable ? '#3b82f6' : 
            '#9ca3af'
          }
        />
      </TouchableOpacity>
    );
  };

  const formatTimeSlot = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return `${start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })} - ${end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  const renderTimeSlotsModal = () => (
    <Modal
      visible={showTimeSlots}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTimeSlots(false)}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>
              {selectedDayData ? formatDate(selectedDayData.date) : 'Schedule'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedDayData?.timeSlots.filter(s => s.isBooked).length || 0} appointments • {' '}
              {selectedDayData?.timeSlots.filter(s => s.isAvailable).length || 0} available slots
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => selectedDayData && onCreateAvailability(selectedDayData.date)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#8b5cf6" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        ) : (
          <FlatList
            data={selectedDayData?.timeSlots || []}
            renderItem={renderTimeSlot}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.timeSlotsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateTitle}>No time slots</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Add availability for this day
                </Text>
                <TouchableOpacity
                  style={styles.createAvailabilityButton}
                  onPress={() => selectedDayData && onCreateAvailability(selectedDayData.date)}
                >
                  <Text style={styles.createAvailabilityText}>Create Availability</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate || new Date().toISOString().split('T')[0]}
        markedDates={prepareMarkedDates()}
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#374151',
          selectedDayBackgroundColor: '#8b5cf6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#8b5cf6',
          dayTextColor: '#1f2937',
          textDisabledColor: '#d1d5db',
          dotColor: '#8b5cf6',
          selectedDotColor: '#ffffff',
          arrowColor: '#8b5cf6',
          monthTextColor: '#1f2937',
          indicatorColor: '#8b5cf6',
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '400',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Has Appointments</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#d1d5db' }]} />
          <Text style={styles.legendText}>No Availability</Text>
        </View>
      </View>

      {renderTimeSlotsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  timeSlotsList: {
    padding: 24,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bookedSlot: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  availableSlot: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  unavailableSlot: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  timeSlotContent: {
    flex: 1,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  bookedText: {
    color: '#065f46',
  },
  availableText: {
    color: '#1e40af',
  },
  appointmentInfo: {
    marginTop: 4,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#065f46',
  },
  serviceName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createAvailabilityButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createAvailabilityText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CalendarComponent;
