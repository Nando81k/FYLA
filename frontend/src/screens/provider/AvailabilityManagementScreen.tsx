import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { useTheme } from '@/theme/ThemeProvider';
import {
  AvailabilityRule,
  AvailabilityOverride,
  BreakInterval,
  CalendarEvent,
} from '@/types/booking';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const ProviderAvailabilityScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    availabilityRules,
    calendarEvents,
    setAvailabilityRules,
    setAvailabilityOverride,
    addCalendarEvent,
    loading,
    error,
    clearError,
  } = useBooking();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  // Create styles with theme
  const styles = createStyles(colors, typography, spacing, borderRadius, shadows);

  // State
  const [localRules, setLocalRules] = useState<AvailabilityRule[]>([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  
  // Override modal state
  const [overrideDate, setOverrideDate] = useState(new Date());
  const [overrideAvailable, setOverrideAvailable] = useState(false);
  const [overrideStartTime, setOverrideStartTime] = useState('09:00');
  const [overrideEndTime, setOverrideEndTime] = useState('17:00');
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideDatePicker, setShowOverrideDatePicker] = useState(false);
  
  // Event modal state
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'holiday' | 'vacation' | 'special_hours' | 'maintenance'>('vacation');
  const [eventStartDate, setEventStartDate] = useState(new Date());
  const [eventEndDate, setEventEndDate] = useState(new Date());
  const [eventDescription, setEventDescription] = useState('');
  const [eventAffectsAvailability, setEventAffectsAvailability] = useState(true);
  const [showEventStartDatePicker, setShowEventStartDatePicker] = useState(false);
  const [showEventEndDatePicker, setShowEventEndDatePicker] = useState(false);

  useEffect(() => {
    if (availabilityRules.length === 0) {
      // Initialize with default rules for all days
      const defaultRules: AvailabilityRule[] = DAYS_OF_WEEK.map((day, index) => ({
        id: `rule_${index}`,
        providerId: user?.id || 0,
        dayOfWeek: index,
        startTime: '09:00',
        endTime: '17:00',
        isActive: index >= 1 && index <= 5, // Monday to Friday by default
        effectiveFrom: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        breakIntervals: [
          {
            id: `break_${index}_lunch`,
            startTime: '12:00',
            endTime: '13:00',
            name: 'Lunch Break',
            isRecurring: true,
          },
        ],
      }));
      setLocalRules(defaultRules);
    } else {
      setLocalRules([...availabilityRules]);
    }
  }, [availabilityRules, user?.id]);

  const handleSaveRules = async () => {
    if (!user?.id) return;

    try {
      await setAvailabilityRules(user.id, localRules);
      Alert.alert('Success', 'Availability rules saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save availability rules');
    }
  };

  const updateRule = useCallback((ruleId: string, updates: Partial<AvailabilityRule>) => {
    setLocalRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  }, []);

  const addBreakInterval = useCallback((ruleId: string) => {
    const newBreak: BreakInterval = {
      id: `break_${Date.now()}`,
      startTime: '15:00',
      endTime: '15:15',
      name: 'Break',
      isRecurring: true,
    };

    setLocalRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { 
            ...rule, 
            breakIntervals: [...(rule.breakIntervals || []), newBreak] 
          }
        : rule
    ));
  }, []);

  const updateBreakInterval = useCallback((
    ruleId: string, 
    breakId: string, 
    updates: Partial<BreakInterval>
  ) => {
    setLocalRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            breakIntervals: rule.breakIntervals?.map(breakInterval =>
              breakInterval.id === breakId 
                ? { ...breakInterval, ...updates }
                : breakInterval
            ),
          }
        : rule
    ));
  }, []);

  const removeBreakInterval = useCallback((ruleId: string, breakId: string) => {
    setLocalRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            breakIntervals: rule.breakIntervals?.filter(breakInterval => 
              breakInterval.id !== breakId
            ),
          }
        : rule
    ));
  }, []);

  const handleCreateOverride = async () => {
    if (!user?.id) return;

    const override: AvailabilityOverride = {
      id: `override_${Date.now()}`,
      providerId: user.id,
      date: overrideDate.toISOString().split('T')[0],
      isAvailable: overrideAvailable,
      customHours: overrideAvailable ? {
        startTime: overrideStartTime,
        endTime: overrideEndTime,
      } : undefined,
      reason: overrideReason,
    };

    try {
      await setAvailabilityOverride(override);
      setShowOverrideModal(false);
      resetOverrideForm();
      Alert.alert('Success', 'Availability override created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create availability override');
    }
  };

  const handleCreateEvent = async () => {
    if (!user?.id || !eventTitle.trim()) return;

    const event: Omit<CalendarEvent, 'id'> = {
      title: eventTitle,
      type: eventType,
      startDate: eventStartDate.toISOString(),
      endDate: eventEndDate.toISOString(),
      allDay: true,
      description: eventDescription,
      affectsAvailability: eventAffectsAvailability,
    };

    try {
      await addCalendarEvent(user.id, event);
      setShowEventModal(false);
      resetEventForm();
      Alert.alert('Success', 'Calendar event created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create calendar event');
    }
  };

  const resetOverrideForm = () => {
    setOverrideDate(new Date());
    setOverrideAvailable(false);
    setOverrideStartTime('09:00');
    setOverrideEndTime('17:00');
    setOverrideReason('');
  };

  const resetEventForm = () => {
    setEventTitle('');
    setEventType('vacation');
    setEventStartDate(new Date());
    setEventEndDate(new Date());
    setEventDescription('');
    setEventAffectsAvailability(true);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const renderAvailabilityRule = (rule: AvailabilityRule) => {
    const isExpanded = expandedRule === rule.id;

    return (
      <View key={rule.id} style={styles.ruleCard}>
        <TouchableOpacity
          style={styles.ruleHeader}
          onPress={() => setExpandedRule(isExpanded ? null : rule.id)}
        >
          <View style={styles.ruleHeaderContent}>
            <Text style={styles.dayName}>
              {DAYS_OF_WEEK[rule.dayOfWeek]}
            </Text>
            <Text style={styles.ruleTime}>
              {rule.isActive 
                ? `${formatTime(rule.startTime)} - ${formatTime(rule.endTime)}`
                : 'Unavailable'
              }
            </Text>
          </View>
          <View style={styles.ruleHeaderActions}>
            <Switch
              value={rule.isActive}
              onValueChange={(value) => updateRule(rule.id, { isActive: value })}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#FFF"
            />
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && rule.isActive && (
          <View style={styles.ruleDetails}>
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={rule.startTime}
                  onChangeText={(value) => updateRule(rule.id, { startTime: value })}
                  placeholder="09:00"
                />
              </View>
              <View style={styles.timeInputGroup}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={rule.endTime}
                  onChangeText={(value) => updateRule(rule.id, { endTime: value })}
                  placeholder="17:00"
                />
              </View>
            </View>

            <View style={styles.breaksSection}>
              <View style={styles.breaksSectionHeader}>
                <Text style={styles.breaksTitle}>Breaks</Text>
                <TouchableOpacity
                  style={styles.addBreakButton}
                  onPress={() => addBreakInterval(rule.id)}
                >
                  <Ionicons name="add" size={16} color="#007AFF" />
                  <Text style={styles.addBreakText}>Add Break</Text>
                </TouchableOpacity>
              </View>

              {rule.breakIntervals?.map((breakInterval) => (
                <View key={breakInterval.id} style={styles.breakInterval}>
                  <TextInput
                    style={styles.breakNameInput}
                    value={breakInterval.name}
                    onChangeText={(value) => updateBreakInterval(rule.id, breakInterval.id, { name: value })}
                    placeholder="Break name"
                  />
                  <View style={styles.breakTimeInputs}>
                    <TextInput
                      style={styles.breakTimeInput}
                      value={breakInterval.startTime}
                      onChangeText={(value) => updateBreakInterval(rule.id, breakInterval.id, { startTime: value })}
                      placeholder="15:00"
                    />
                    <Text style={styles.timeSeparator}>-</Text>
                    <TextInput
                      style={styles.breakTimeInput}
                      value={breakInterval.endTime}
                      onChangeText={(value) => updateBreakInterval(rule.id, breakInterval.id, { endTime: value })}
                      placeholder="15:15"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.removeBreakButton}
                    onPress={() => removeBreakInterval(rule.id, breakInterval.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Availability Settings</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveRules}
          disabled={loading.updating}
        >
          {loading.updating ? (
            <ActivityIndicator color="#007AFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <Text style={styles.sectionDescription}>
            Set your regular availability for each day of the week
          </Text>
          
          {localRules.map(renderAvailabilityRule)}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overrides & Events</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowOverrideModal(true)}
              >
                <Ionicons name="calendar-outline" size={16} color="#007AFF" />
                <Text style={styles.actionButtonText}>Override</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowEventModal(true)}
              >
                <Ionicons name="add-circle-outline" size={16} color="#007AFF" />
                <Text style={styles.actionButtonText}>Event</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {calendarEvents.length > 0 ? (
            calendarEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventType}>{event.type}</Text>
                </View>
                <Text style={styles.eventDate}>
                  {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'} - {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'N/A'}
                </Text>
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No overrides or events scheduled
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Override Modal */}
      <Modal
        visible={showOverrideModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOverrideModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowOverrideModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Availability Override</Text>
            <TouchableOpacity onPress={handleCreateOverride}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowOverrideDatePicker(true)}
              >
                <Text style={styles.dateSelectorText}>
                  {overrideDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Available</Text>
                <Switch
                  value={overrideAvailable}
                  onValueChange={setOverrideAvailable}
                  trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>

            {overrideAvailable && (
              <>
                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.inputLabel}>Start Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={overrideStartTime}
                      onChangeText={setOverrideStartTime}
                      placeholder="09:00"
                    />
                  </View>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.inputLabel}>End Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={overrideEndTime}
                      onChangeText={setOverrideEndTime}
                      placeholder="17:00"
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={styles.textArea}
                value={overrideReason}
                onChangeText={setOverrideReason}
                placeholder="Reason for this override..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {showOverrideDatePicker && (
            <DateTimePicker
              value={overrideDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowOverrideDatePicker(Platform.OS === 'ios');
                if (date) setOverrideDate(date);
              }}
            />
          )}
        </View>
      </Modal>

      {/* Event Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Calendar Event</Text>
            <TouchableOpacity onPress={handleCreateEvent}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Event title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.eventTypeButtons}>
                {[
                  { value: 'vacation', label: 'Vacation' },
                  { value: 'holiday', label: 'Holiday' },
                  { value: 'special_hours', label: 'Special Hours' },
                  { value: 'maintenance', label: 'Maintenance' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.eventTypeButton,
                      eventType === type.value && styles.eventTypeButtonSelected,
                    ]}
                    onPress={() => setEventType(type.value as any)}
                  >
                    <Text style={[
                      styles.eventTypeButtonText,
                      eventType === type.value && styles.eventTypeButtonTextSelected,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowEventStartDatePicker(true)}
                >
                  <Text style={styles.dateSelectorText}>
                    {eventStartDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputGroup}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowEventEndDatePicker(true)}
                >
                  <Text style={styles.dateSelectorText}>
                    {eventEndDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Affects Availability</Text>
                <Switch
                  value={eventAffectsAvailability}
                  onValueChange={setEventAffectsAvailability}
                  trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder="Event description..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {showEventStartDatePicker && (
            <DateTimePicker
              value={eventStartDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEventStartDatePicker(Platform.OS === 'ios');
                if (date) setEventStartDate(date);
              }}
            />
          )}

          {showEventEndDatePicker && (
            <DateTimePicker
              value={eventEndDate}
              mode="date"
              display="default"
              minimumDate={eventStartDate}
              onChange={(event, date) => {
                setShowEventEndDatePicker(Platform.OS === 'ios');
                if (date) setEventEndDate(date);
              }}
            />
          )}
        </View>
      </Modal>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: any, typography: any, spacing: any, borderRadius: any, shadows: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    color: colors.text.primarynverse,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.primaryecondary,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  ruleCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  ruleDay: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  ruleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleToggleText: {
    fontSize: typography.size.sm,
    color: colors.text.primaryecondary,
    marginRight: spacing.sm,
  },
  ruleTime: {
    fontSize: typography.size.sm,
    color: colors.text.primaryecondary,
    marginBottom: spacing.sm,
  },
  ruleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  overrideCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  overrideDate: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  overrideType: {
    fontSize: typography.size.sm,
    color: colors.text.primaryecondary,
    marginBottom: spacing.sm,
  },
  overrideTime: {
    fontSize: typography.size.sm,
    color: colors.text.primaryecondary,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  eventTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontSize: typography.size.sm,
    color: colors.text.primaryecondary,
    marginBottom: spacing.sm,
  },
  eventDescription: {
    fontSize: typography.size.sm,
    color: colors.text.primaryecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addButtonText: {
    color: colors.text.primarynverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  ruleHeaderContent: {
    flex: 1,
  },
  dayName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  ruleHeaderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ruleDetails: {
    padding: spacing.md,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timeInputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  timeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  breaksSection: {
    marginTop: spacing.md,
  },
  breaksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  breaksTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  addBreakButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  addBreakText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  breakInterval: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  breakNameInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  breakTimeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakTimeInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.text.primary,
    flex: 1,
  },
  timeSeparator: {
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  removeBreakButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionDescription: {
    fontSize: typography.size.md,
    color: colors.text.primaryecondary,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventType: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.size.md,
    color: colors.text.primaryecondary,
    textAlign: 'center',
  },
  modalCancel: {
    color: colors.text.primaryecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
  modalSave: {
    color: colors.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  dateSelector: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
  },
  dateSelectorText: {
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.size.md,
    color: colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  eventTypeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  eventTypeButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
  },
  eventTypeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eventTypeButtonText: {
    fontSize: typography.size.sm,
    color: colors.text.primary,
    textAlign: 'center',
  },
  eventTypeButtonTextSelected: {
    color: colors.white,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateInputGroup: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: colors.error,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.white,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});

export default ProviderAvailabilityScreen;
