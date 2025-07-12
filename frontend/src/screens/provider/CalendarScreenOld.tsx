import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { calendarService, CalendarDay, TimeSlot } from '@/services/calendarService';
import { appointmentService } from '@/services/appointmentService';
import CalendarComponent from '@/components/provider/CalendarComponent';
import AvailabilityModal, { AvailabilityData } from '@/components/provider/AvailabilityModal';
import { Appointment } from '@/types';

const CalendarScreen: React.FC = () => {
  const { user, token } = useAuth();
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityModalDate, setAvailabilityModalDate] = useState<string>('');
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useFocusEffect(
    React.useCallback(() => {
      loadCalendarData();
    }, [user?.id])
  );

  const loadCalendarData = async () => {
    if (!user?.id || !token) return;

    setIsLoading(true);
    try {
      // Load calendar and appointments for current month
      const [calendarData, appointmentsData] = await Promise.all([
        calendarService.getMockProviderCalendar(user.id, currentYear, currentMonth),
        calendarService.getMockProviderAppointments(
          user.id,
          `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`,
          `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`
        ),
      ]);

      setCalendar(calendarData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert(
        'Error',
        'Failed to load calendar data. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: loadCalendarData },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSlotPress = (slot: TimeSlot) => {
    if (slot.isBooked && slot.appointmentId) {
      // Show appointment details
      const appointment = appointments.find(apt => apt.id === slot.appointmentId);
      if (appointment) {
        showAppointmentDetails(appointment);
      }
    } else if (slot.isAvailable) {
      // Could show booking options or availability management
      Alert.alert(
        'Available Slot',
        `This slot is available for booking: ${calendarService.formatTime(slot.startTime)} - ${calendarService.formatTime(slot.endTime)}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleCreateAvailability = (date: string) => {
    setAvailabilityModalDate(date);
    setShowAvailabilityModal(true);
  };

  const handleSaveAvailability = async (availabilityData: AvailabilityData) => {
    if (!user?.id || !token) return;

    setIsSavingAvailability(true);
    try {
      // Here you would call the real API
      // await calendarService.createAvailability(token, user.id, {
      //   date: availabilityData.date,
      //   timeSlots: availabilityData.timeSlots,
      // });

      // For demo, just show success and reload
      Alert.alert(
        'Success',
        'Availability has been set successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowAvailabilityModal(false);
              loadCalendarData(); // Reload calendar
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save availability'
      );
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const showAppointmentDetails = (appointment: Appointment) => {
    const client = appointment.client;
    const service = appointment.services[0]?.service;
    
    Alert.alert(
      'Appointment Details',
      `Client: ${client?.fullName || 'Unknown'}\n` +
      `Service: ${service?.name || 'Unknown'}\n` +
      `Time: ${calendarService.formatTime(appointment.scheduledStartTime)} - ${calendarService.formatTime(appointment.scheduledEndTime)}\n` +
      `Price: $${appointment.totalPrice}\n` +
      `Status: ${appointment.status}` +
      (appointment.notes ? `\n\nNotes: ${appointment.notes}` : ''),
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Manage',
          onPress: () => showAppointmentActions(appointment),
        },
      ]
    );
  };

  const showAppointmentActions = (appointment: Appointment) => {
    Alert.alert(
      'Manage Appointment',
      'What would you like to do with this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateAppointmentStatus(appointment, 'confirmed'),
        },
        {
          text: 'Complete',
          onPress: () => updateAppointmentStatus(appointment, 'completed'),
        },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () => updateAppointmentStatus(appointment, 'cancelled'),
        },
      ]
    );
  };

  const updateAppointmentStatus = async (appointment: Appointment, status: string) => {
    if (!token) return;

    try {
      // Here you would call the real API
      // await calendarService.updateAppointmentStatus(token, appointment.id, status as any);
      
      Alert.alert(
        'Success',
        `Appointment has been ${status}!`,
        [
          {
            text: 'OK',
            onPress: () => loadCalendarData(), // Reload calendar
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update appointment'
      );
    }
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    const upcoming = appointments
      .filter(apt => new Date(apt.scheduledStartTime) >= today)
      .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
      .slice(0, 3);
    
    return upcoming;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const upcomingAppointments = getUpcomingAppointments();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadCalendarData}
        >
          <Ionicons name="refresh" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{upcomingAppointments.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(apt => calendarService.isToday(apt.scheduledStartTime)).length}
          </Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {calendar.filter(day => day.isAvailable).length}
          </Text>
          <Text style={styles.statLabel}>Available Days</Text>
        </View>
      </View>

      <CalendarComponent
        calendar={calendar}
        appointments={appointments}
        onDateSelect={handleDateSelect}
        onTimeSlotPress={handleTimeSlotPress}
        onCreateAvailability={handleCreateAvailability}
        selectedDate={selectedDate}
        isLoading={false}
      />

      <AvailabilityModal
        visible={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        onSave={handleSaveAvailability}
        selectedDate={availabilityModalDate}
        isLoading={isSavingAvailability}
      />
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default CalendarScreen;
