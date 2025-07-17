import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { TimeSlot } from '@/types/timeSlot';

interface SimpleTimeSlotPickerProps {
  visible: boolean;
  onClose: () => void;
  onSlotSelected: (slot: TimeSlot) => void;
  providerId: number;
  serviceId: number;
  serviceDuration: number;
  clientId: number;
  initialDate?: string;
  minPrice?: number;
  maxPrice?: number;
}

const SimpleTimeSlotPicker: React.FC<SimpleTimeSlotPickerProps> = ({
  visible,
  onClose,
  onSlotSelected,
}) => {
  const handleSlotPress = () => {
    // Mock slot for testing
    const mockSlot: TimeSlot = {
      id: '1',
      startTime: '10:00',
      endTime: '11:00',
      isAvailable: true,
      isBlocked: false,
      providerId: 1,
      serviceId: 1,
      duration: 60,
      price: 50,
    };
    onSlotSelected(mockSlot);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Time Slot</Text>
          
          <TouchableOpacity
            style={styles.slotButton}
            onPress={handleSlotPress}
          >
            <Text style={styles.slotText}>10:00 AM - 11:00 AM</Text>
            <Text style={styles.priceText}>$50</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    width: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  slotButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  slotText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  priceText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  closeText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SimpleTimeSlotPicker;
