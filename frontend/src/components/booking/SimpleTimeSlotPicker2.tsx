import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

interface SimpleTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBlocked: boolean;
  providerId: number;
  duration: number;
  price?: number;
}

interface SimpleTimeSlotPickerProps {
  visible: boolean;
  onClose: () => void;
  onSlotSelected: (slot: SimpleTimeSlot) => void;
  providerId: number;
  serviceId: number;
  serviceDuration: number;
  clientId: number;
  initialDate?: string;
}

const SimpleTimeSlotPicker: React.FC<SimpleTimeSlotPickerProps> = ({
  visible,
  onClose,
  onSlotSelected,
}) => {
  const mockSlots: SimpleTimeSlot[] = [
    {
      id: '1',
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: true,
      isBlocked: false,
      providerId: 1,
      duration: 60,
      price: 50,
    },
    {
      id: '2',
      startTime: '10:00',
      endTime: '11:00',
      isAvailable: false,
      isBlocked: true,
      providerId: 1,
      duration: 60,
      price: 50,
    },
    {
      id: '3',
      startTime: '11:00',
      endTime: '12:00',
      isAvailable: true,
      isBlocked: false,
      providerId: 1,
      duration: 60,
      price: 60,
    },
  ];

  if (!visible) {
    return null;
  }

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
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Time Slot</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Available Times</Text>
          
          {mockSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotButton,
                !slot.isAvailable && styles.slotButtonDisabled,
              ]}
              onPress={() => slot.isAvailable && onSlotSelected(slot)}
              disabled={!slot.isAvailable}
            >
              <Text style={styles.slotTime}>
                {slot.startTime} - {slot.endTime}
              </Text>
              {slot.price && (
                <Text style={styles.slotPrice}>${slot.price}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#3b82f6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  slotButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  slotTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  slotPrice: {
    fontSize: 14,
    color: '#10b981',
  },
});

export default SimpleTimeSlotPicker;
