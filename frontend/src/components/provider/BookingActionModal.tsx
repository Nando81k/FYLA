import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { comprehensiveBookingService } from '../../services/comprehensiveBookingService';

interface BookingActionModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  action: 'confirm' | 'cancel';
  clientName: string;
  serviceName: string;
  appointmentTime: string;
  onSuccess: () => void;
}

const BookingActionModal: React.FC<BookingActionModalProps> = ({
  visible,
  onClose,
  bookingId,
  action,
  clientName,
  serviceName,
  appointmentTime,
  onSuccess,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const styles = createStyles(colors, typography, spacing, borderRadius, shadows);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      if (action === 'confirm') {
        await comprehensiveBookingService.confirmBooking(bookingId, notes);
      } else {
        await comprehensiveBookingService.cancelBooking(bookingId, notes);
      }
      
      Alert.alert(
        'Success',
        `Appointment ${action === 'confirm' ? 'confirmed' : 'cancelled'} successfully!`,
        [{ text: 'OK', onPress: () => {
          onSuccess();
          onClose();
        }}]
      );
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      Alert.alert('Error', `Failed to ${action} appointment`);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = () => {
    return action === 'confirm' ? '#10b981' : '#ef4444';
  };

  const getActionText = () => {
    return action === 'confirm' ? 'Confirm' : 'Cancel';
  };

  const getActionIcon = () => {
    return action === 'confirm' ? 'checkmark-circle' : 'close-circle';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>{getActionText()} Appointment</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Action Icon */}
            <View style={[styles.actionIcon, { backgroundColor: getActionColor() + '20' }]}>
              <Ionicons name={getActionIcon()} size={48} color={getActionColor()} />
            </View>

            {/* Appointment Details */}
            <View style={styles.appointmentDetails}>
              <Text style={styles.sectionTitle}>Appointment Details</Text>
              
              <View style={styles.detailRow}>
                <Ionicons name="person" size={20} color="#6b7280" />
                <Text style={styles.detailText}>Client: {clientName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="medical" size={20} color="#6b7280" />
                <Text style={styles.detailText}>Service: {serviceName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="time" size={20} color="#6b7280" />
                <Text style={styles.detailText}>Time: {appointmentTime}</Text>
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>
                {action === 'confirm' ? 'Confirmation Notes' : 'Cancellation Reason'}
                <Text style={styles.optional}> (Optional)</Text>
              </Text>
              
              <Text style={styles.notesDescription}>
                {action === 'confirm' 
                  ? 'Add any special instructions or reminders for the client:'
                  : 'Please provide a reason for cancellation that will be visible to the client:'
                }
              </Text>
              
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                placeholder={action === 'confirm' 
                  ? 'e.g., Please arrive 10 minutes early. Bring a valid ID.'
                  : 'e.g., Emergency came up, please reschedule.'
                }
                value={notes}
                onChangeText={setNotes}
                maxLength={500}
              />
              
              <Text style={styles.characterCount}>
                {notes.length}/500 characters
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: getActionColor() }]}
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Processing...' : getActionText()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
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
  actionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  appointmentDetails: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  optional: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6b7280',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
  },
  confirmButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

const createStyles = (colors: any, typography: any, spacing: any, borderRadius: any, shadows: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  closeButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  actionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  appointmentDetails: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  optional: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.normal,
    color: colors.text.accent,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  notesSection: {
    marginBottom: spacing.xl,
  },
  notesDescription: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  notesInput: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.size.sm,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
    ...shadows.md,
  },
  confirmButtonText: {
    textAlign: 'center',
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});

export default BookingActionModal;
