import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface AvailabilityModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (availability: AvailabilityData) => void;
  selectedDate: string;
  isLoading?: boolean;
}

export interface AvailabilityData {
  date: string;
  timeSlots: {
    startTime: string;
    endTime: string;
  }[];
  isRecurring?: boolean;
  recurringPattern?: 'weekly' | 'daily';
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  visible,
  onClose,
  onSave,
  selectedDate,
  isLoading = false,
}) => {
  const [timeSlots, setTimeSlots] = useState<{ startTime: Date; endTime: Date }[]>([
    { startTime: new Date(), endTime: new Date() },
  ]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<'weekly' | 'daily'>('weekly');
  const [showPicker, setShowPicker] = useState<{
    visible: boolean;
    slotIndex: number;
    type: 'start' | 'end';
  }>({ visible: false, slotIndex: 0, type: 'start' });

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const newStartTime = new Date(lastSlot.endTime);
    newStartTime.setHours(newStartTime.getHours() + 1);
    
    const newEndTime = new Date(newStartTime);
    newEndTime.setHours(newEndTime.getHours() + 1);
    
    setTimeSlots([...timeSlots, { startTime: newStartTime, endTime: newEndTime }]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index: number, type: 'start' | 'end', time: Date) => {
    const newTimeSlots = [...timeSlots];
    if (type === 'start') {
      newTimeSlots[index].startTime = time;
      // Ensure end time is after start time
      if (time >= newTimeSlots[index].endTime) {
        const newEndTime = new Date(time);
        newEndTime.setHours(newEndTime.getHours() + 1);
        newTimeSlots[index].endTime = newEndTime;
      }
    } else {
      newTimeSlots[index].endTime = time;
    }
    setTimeSlots(newTimeSlots);
  };

  const handleSave = () => {
    // Validate time slots
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      if (slot.startTime >= slot.endTime) {
        Alert.alert('Invalid Time', 'End time must be after start time');
        return;
      }
    }

    // Check for overlapping slots
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slot1 = timeSlots[i];
        const slot2 = timeSlots[j];
        
        if (
          (slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime) ||
          (slot2.startTime < slot1.endTime && slot2.endTime > slot1.startTime)
        ) {
          Alert.alert('Overlapping Times', 'Time slots cannot overlap');
          return;
        }
      }
    }

    const availabilityData: AvailabilityData = {
      date: selectedDate,
      timeSlots: timeSlots.map(slot => ({
        startTime: slot.startTime.toTimeString().slice(0, 5), // HH:MM format
        endTime: slot.endTime.toTimeString().slice(0, 5),
      })),
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : undefined,
    };

    onSave(availabilityData);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatSelectedDate = (): string => {
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Set Availability</Text>
          
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isLoading}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.dateSection}>
            <Text style={styles.sectionTitle}>Date</Text>
            <Text style={styles.selectedDate}>{formatSelectedDate()}</Text>
          </View>

          <View style={styles.timeSlotsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Time Slots</Text>
              <TouchableOpacity onPress={addTimeSlot} style={styles.addSlotButton}>
                <Ionicons name="add" size={20} color="#8b5cf6" />
                <Text style={styles.addSlotText}>Add Slot</Text>
              </TouchableOpacity>
            </View>

            {timeSlots.map((slot, index) => (
              <View key={index} style={styles.timeSlot}>
                <View style={styles.timeSlotHeader}>
                  <Text style={styles.timeSlotTitle}>Slot {index + 1}</Text>
                  {timeSlots.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeTimeSlot(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.timeInputs}>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => setShowPicker({ visible: true, slotIndex: index, type: 'start' })}
                  >
                    <Text style={styles.timeInputLabel}>Start Time</Text>
                    <Text style={styles.timeInputValue}>{formatTime(slot.startTime)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => setShowPicker({ visible: true, slotIndex: index, type: 'end' })}
                  >
                    <Text style={styles.timeInputLabel}>End Time</Text>
                    <Text style={styles.timeInputValue}>{formatTime(slot.endTime)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.recurringSection}>
            <View style={styles.recurringHeader}>
              <Text style={styles.sectionTitle}>Recurring Availability</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                thumbColor={isRecurring ? '#8b5cf6' : '#f3f4f6'}
              />
            </View>

            {isRecurring && (
              <View style={styles.recurringOptions}>
                <TouchableOpacity
                  style={[
                    styles.recurringOption,
                    recurringPattern === 'weekly' && styles.recurringOptionActive,
                  ]}
                  onPress={() => setRecurringPattern('weekly')}
                >
                  <Text
                    style={[
                      styles.recurringOptionText,
                      recurringPattern === 'weekly' && styles.recurringOptionTextActive,
                    ]}
                  >
                    Weekly (same day each week)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.recurringOption,
                    recurringPattern === 'daily' && styles.recurringOptionActive,
                  ]}
                  onPress={() => setRecurringPattern('daily')}
                >
                  <Text
                    style={[
                      styles.recurringOptionText,
                      recurringPattern === 'daily' && styles.recurringOptionTextActive,
                    ]}
                  >
                    Daily (every day)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Time Picker - Wheel/Spinner in Modal */}
        {showPicker.visible && (
          <Modal
            visible={showPicker.visible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPicker({ ...showPicker, visible: false })}
          >
            <View style={styles.timePickerOverlay}>
              <View style={styles.timePickerModal}>
                <View style={styles.timePickerModalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowPicker({ ...showPicker, visible: false })}
                    style={styles.timePickerCancelButton}
                  >
                    <Text style={styles.timePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.timePickerModalTitle}>
                    Select {showPicker.type === 'start' ? 'Start' : 'End'} Time
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPicker({ ...showPicker, visible: false })}
                    style={styles.timePickerConfirmButton}
                  >
                    <Text style={styles.timePickerConfirmText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timePickerWrapper}>
                  <DateTimePicker
                    value={
                      showPicker.type === 'start'
                        ? timeSlots[showPicker.slotIndex].startTime
                        : timeSlots[showPicker.slotIndex].endTime
                    }
                    mode="time"
                    display="spinner"
                    is24Hour={false}
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        updateTimeSlot(showPicker.slotIndex, showPicker.type, selectedTime);
                      }
                    }}
                    style={styles.timePickerLarge}
                    textColor="#000000"
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  dateSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  selectedDate: {
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeSlotsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSlotText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  timeSlot: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSlotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  removeButton: {
    padding: 4,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  timeInputValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  recurringSection: {
    marginBottom: 32,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recurringOptions: {
    gap: 8,
  },
  recurringOption: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recurringOptionActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f3f4f6',
  },
  recurringOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  recurringOptionTextActive: {
    color: '#8b5cf6',
    fontWeight: '500',
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

export default AvailabilityModal;
