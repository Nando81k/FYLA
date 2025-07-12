import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/context/AuthContext';
import { businessHoursService } from '@/services/businessHoursService';
import {
  BusinessHours,
  BusinessHoursRequest,
  DayOfWeek,
  dayNames,
  defaultBusinessHours,
} from '@/types';

interface DaySchedule extends BusinessHoursRequest {
  id?: number;
}

const BusinessHoursScreen: React.FC = () => {
  const { token } = useAuth();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultBusinessHours);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<{
    visible: boolean;
    dayIndex: number;
    type: 'open' | 'close';
  }>({ visible: false, dayIndex: 0, type: 'open' });

  useEffect(() => {
    loadBusinessHours();
  }, [token]);

  const loadBusinessHours = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const businessHours = await businessHoursService.getBusinessHours(token);
      
      if (businessHours.length > 0) {
        // Convert API response to schedule format
        const scheduleData: DaySchedule[] = defaultBusinessHours.map(day => {
          const existingHours = businessHours.find(bh => bh.dayOfWeek === day.dayOfWeek);
          return existingHours ? {
            id: existingHours.id,
            dayOfWeek: existingHours.dayOfWeek,
            openTime: existingHours.openTime,
            closeTime: existingHours.closeTime,
            isOpen: existingHours.isOpen,
          } : day;
        });
        setSchedule(scheduleData);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load business hours'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!token) return;

    setIsSaving(true);
    try {
      await businessHoursService.updateBusinessHours(token, {
        businessHours: schedule,
      });
      
      Alert.alert('Success', 'Business hours updated successfully!');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update business hours'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDayStatus = (dayIndex: number) => {
    setSchedule(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, isOpen: !day.isOpen } : day
    ));
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(prev => ({ ...prev, visible: false }));
    
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5); // HH:mm format
      const { dayIndex, type } = showTimePicker;
      
      setSchedule(prev => prev.map((day, index) => 
        index === dayIndex 
          ? { ...day, [type === 'open' ? 'openTime' : 'closeTime']: timeString }
          : day
      ));
    }
  };

  const showTimePickerForDay = (dayIndex: number, type: 'open' | 'close') => {
    setShowTimePicker({ visible: true, dayIndex, type });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const parseTimeString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  const renderDaySchedule = (day: DaySchedule, index: number) => (
    <View key={day.dayOfWeek} style={styles.dayContainer}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayName}>{dayNames[day.dayOfWeek]}</Text>
        <Switch
          value={day.isOpen}
          onValueChange={() => toggleDayStatus(index)}
          trackColor={{ false: '#f3f4f6', true: '#c7d2fe' }}
          thumbColor={day.isOpen ? '#8b5cf6' : '#9ca3af'}
        />
      </View>
      
      {day.isOpen && (
        <View style={styles.timeContainer}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => showTimePickerForDay(index, 'open')}
          >
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.timeText}>{formatTime(day.openTime)}</Text>
          </TouchableOpacity>
          
          <Text style={styles.timeSeparator}>to</Text>
          
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => showTimePickerForDay(index, 'close')}
          >
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.timeText}>{formatTime(day.closeTime)}</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!day.isOpen && (
        <Text style={styles.closedText}>Closed</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading business hours...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Business Hours</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.subtitle}>
            Set your working hours for each day of the week. Clients will only be able to book appointments during these hours.
          </Text>

          <View style={styles.scheduleContainer}>
            {schedule.map((day, index) => renderDaySchedule(day, index))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveSchedule}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Business Hours</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker - Wheel/Spinner in Modal */}
      {showTimePicker.visible && (
        <Modal
          visible={showTimePicker.visible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker({ ...showTimePicker, visible: false })}
        >
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerModal}>
              <View style={styles.timePickerModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowTimePicker({ ...showTimePicker, visible: false })}
                  style={styles.timePickerCancelButton}
                >
                  <Text style={styles.timePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerModalTitle}>
                  Select {showTimePicker.type === 'open' ? 'Opening' : 'Closing'} Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker({ ...showTimePicker, visible: false })}
                  style={styles.timePickerConfirmButton}
                >
                  <Text style={styles.timePickerConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timePickerWrapper}>
                <DateTimePicker
                  value={parseTimeString(
                    showTimePicker.type === 'open' 
                      ? schedule[showTimePicker.dayIndex].openTime
                      : schedule[showTimePicker.dayIndex].closeTime
                  )}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  style={styles.timePickerLarge}
                  textColor="#000000"
                />
              </View>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  scheduleContainer: {
    gap: 16,
    marginBottom: 32,
  },
  dayContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  closedText: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Time Picker Styles - Bottom Sheet Style
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for iPhone
  },
  timePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  timePickerWrapper: {
    padding: 20,
    paddingTop: 0,
  },
  timePickerLarge: {
    width: '100%',
    height: 200,
  },
  timePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerCancelText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
  timePickerConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerConfirmText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BusinessHoursScreen;
