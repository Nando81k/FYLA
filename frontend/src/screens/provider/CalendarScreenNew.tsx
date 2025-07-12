import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { appointmentService } from '@/services/appointmentService';
import { Appointment, AppointmentStatus } from '@/types';

const CalendarScreen: React.FC = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [token, selectedDate])
  );

  const loadAppointments = async (refresh = false) => {
    if (!token) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await appointmentService.getProviderAppointments(token, {
        startDate: selectedDate,
        endDate: selectedDate,
      });
      
      setAppointments(response.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert(
        'Error',
        'Failed to load appointments. Please try again.',
        [
          { text: 'Retry', onPress: () => loadAppointments(refresh) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAppointments(true);
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

  const handleAppointmentPress = (appointment: Appointment) => {
    Alert.alert(
      'Appointment Details',
      `Client: ${appointment.client?.fullName}\nTime: ${formatTime(appointment.scheduledStartTime)}\nStatus: ${appointment.status}`,
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Update Status',
          onPress: () => showStatusUpdateOptions(appointment)
        }
      ]
    );
  };

  const showStatusUpdateOptions = (appointment: Appointment) => {
    const statusOptions = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Confirm', onPress: () => updateAppointmentStatus(appointment.id, AppointmentStatus.CONFIRMED) },
      { text: 'Complete', onPress: () => updateAppointmentStatus(appointment.id, AppointmentStatus.COMPLETED) },
      { text: 'Mark No Show', onPress: () => updateAppointmentStatus(appointment.id, AppointmentStatus.NO_SHOW) },
    ];

    Alert.alert('Update Status', 'Choose new status:', statusOptions);
  };

  const updateAppointmentStatus = async (appointmentId: number, newStatus: AppointmentStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
      Alert.alert('Success', 'Appointment status updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment status.');
    }
  };

  const renderAppointment = (appointment: Appointment) => (
    <TouchableOpacity
      key={appointment.id}
      style={[
        styles.appointmentCard,
        { borderLeftColor: getStatusColor(appointment.status) }
      ]}
      onPress={() => handleAppointmentPress(appointment)}
    >
      <View style={styles.appointmentTime}>
        <Text style={styles.timeText}>{formatTime(appointment.scheduledStartTime)}</Text>
        <Text style={styles.durationText}>
          {Math.round((new Date(appointment.scheduledEndTime).getTime() - new Date(appointment.scheduledStartTime).getTime()) / (1000 * 60))} min
        </Text>
      </View>
      <View style={styles.appointmentDetails}>
        <Text style={styles.clientName}>{appointment.client?.fullName || 'Unknown Client'}</Text>
        <Text style={styles.serviceText}>
          {appointment.services?.map(s => s.service?.name).join(', ') || 'Service'}
        </Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
            {appointment.status}
          </Text>
        </View>
      </View>
      <View style={styles.appointmentActions}>
        <Text style={styles.priceText}>${appointment.totalPrice?.toFixed(2) || '0.00'}</Text>
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No Appointments</Text>
      <Text style={styles.emptyStateSubtitle}>
        You have no appointments scheduled for {formatDate(selectedDate)}
      </Text>
    </View>
  );

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity 
          style={styles.todayButton}
          onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('prev')}>
          <Ionicons name="chevron-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('next')}>
          <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(a => a.status === AppointmentStatus.PENDING).length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            ${appointments.reduce((sum, a) => sum + (a.totalPrice || 0), 0).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <ScrollView
        style={styles.appointmentsList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {appointments.length > 0 ? (
          appointments
            .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
            .map(renderAppointment)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
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
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  todayButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentTime: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  appointmentDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  appointmentActions: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
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
  },
});

export default CalendarScreen;
