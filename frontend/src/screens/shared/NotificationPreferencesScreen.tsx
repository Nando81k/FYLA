import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NotificationSettings } from '../../types/notifications';
import { notificationService } from '../../services/notificationService';

const NotificationPreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Get current user ID (you'd implement this based on your auth system)
      const userId = 1; // Placeholder
      const userSettings = await notificationService.getNotificationSettings(userId);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await notificationService.updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date;
  };

  const formatTimeFromDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const onTimeChange = (event: any, selectedDate?: Date, isStart = true) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedDate && settings) {
      const timeString = formatTimeFromDate(selectedDate);
      if (isStart) {
        updateSetting('quietHoursStart', timeString);
      } else {
        updateSetting('quietHoursEnd', timeString);
      }
    }
  };

  const requestNotificationPermission = async () => {
    const hasPermission = await notificationService.requestPermission();
    if (hasPermission) {
      updateSetting('pushEnabled', true);
    } else {
      Alert.alert(
        'Permission Required',
        'To receive push notifications, please enable them in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderSettingRow = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    disabled = false
  ) => (
    <View style={[styles.settingRow, disabled && styles.disabledRow]}>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
        thumbColor={value ? '#8B5CF6' : '#F3F4F6'}
      />
    </View>
  );

  const renderTimeSettingRow = (
    title: string,
    subtitle: string,
    timeValue: string,
    onPress: () => void,
    disabled = false
  ) => (
    <TouchableOpacity
      style={[styles.settingRow, disabled && styles.disabledRow]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.timeValue}>
        <Text style={[styles.timeText, disabled && styles.disabledText]}>
          {formatTime(timeValue)}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={disabled ? '#D1D5DB' : '#9CA3AF'}
        />
      </View>
    </TouchableOpacity>
  );

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Push Notifications */}
        {renderSection(
          'Push Notifications',
          <>
            {renderSettingRow(
              'Enable Push Notifications',
              'Receive notifications even when the app is closed',
              settings.pushEnabled,
              (value) => {
                if (value) {
                  requestNotificationPermission();
                } else {
                  updateSetting('pushEnabled', false);
                }
              }
            )}

            {renderSettingRow(
              'Booking Notifications',
              'New bookings, confirmations, and cancellations',
              settings.bookingNotifications,
              (value) => updateSetting('bookingNotifications', value),
              !settings.pushEnabled
            )}

            {renderSettingRow(
              'Message Notifications',
              'New messages from clients and providers',
              settings.messageNotifications,
              (value) => updateSetting('messageNotifications', value),
              !settings.pushEnabled
            )}

            {renderSettingRow(
              'Social Notifications',
              'Likes, comments, follows, and other social activity',
              settings.socialNotifications,
              (value) => updateSetting('socialNotifications', value),
              !settings.pushEnabled
            )}

            {renderSettingRow(
              'Promotional Notifications',
              'Special offers, discounts, and marketing updates',
              settings.promotionalNotifications,
              (value) => updateSetting('promotionalNotifications', value),
              !settings.pushEnabled
            )}
          </>
        )}

        {/* In-App Notifications */}
        {renderSection(
          'In-App Notifications',
          <>
            {renderSettingRow(
              'In-App Notifications',
              'Show notifications while using the app',
              settings.inAppEnabled,
              (value) => updateSetting('inAppEnabled', value)
            )}

            {renderSettingRow(
              'Sound',
              'Play sound for new notifications',
              settings.soundEnabled,
              (value) => updateSetting('soundEnabled', value),
              !settings.inAppEnabled
            )}

            {renderSettingRow(
              'Vibration',
              'Vibrate device for new notifications',
              settings.vibrationEnabled,
              (value) => updateSetting('vibrationEnabled', value),
              !settings.inAppEnabled
            )}
          </>
        )}

        {/* Quiet Hours */}
        {renderSection(
          'Quiet Hours',
          <>
            {renderSettingRow(
              'Enable Quiet Hours',
              'Disable notifications during specified hours',
              settings.quietHoursEnabled,
              (value) => updateSetting('quietHoursEnabled', value)
            )}

            {renderTimeSettingRow(
              'Start Time',
              'When quiet hours begin',
              settings.quietHoursStart,
              () => {
                if (Platform.OS === 'ios') {
                  setShowStartTimePicker(true);
                } else {
                  setShowStartTimePicker(true);
                }
              },
              !settings.quietHoursEnabled
            )}

            {renderTimeSettingRow(
              'End Time',
              'When quiet hours end',
              settings.quietHoursEnd,
              () => {
                if (Platform.OS === 'ios') {
                  setShowEndTimePicker(true);
                } else {
                  setShowEndTimePicker(true);
                }
              },
              !settings.quietHoursEnabled
            )}
          </>
        )}

        {/* Email Notifications */}
        {renderSection(
          'Email Notifications',
          <>
            {renderSettingRow(
              'Email Notifications',
              'Receive notifications via email',
              settings.emailEnabled,
              (value) => updateSetting('emailEnabled', value)
            )}

            {renderSettingRow(
              'Daily Digest',
              'Receive a daily summary of activity',
              settings.dailyDigest,
              (value) => updateSetting('dailyDigest', value),
              !settings.emailEnabled
            )}

            {renderSettingRow(
              'Weekly Digest',
              'Receive a weekly summary of activity',
              settings.weeklyDigest,
              (value) => updateSetting('weeklyDigest', value),
              !settings.emailEnabled
            )}
          </>
        )}

        {/* SMS Notifications */}
        {renderSection(
          'SMS Notifications',
          <>
            {renderSettingRow(
              'SMS Notifications',
              'Receive notifications via text message',
              settings.smsEnabled,
              (value) => updateSetting('smsEnabled', value)
            )}

            {renderSettingRow(
              'Urgent Only',
              'Only send SMS for urgent notifications',
              settings.urgentSmsOnly,
              (value) => updateSetting('urgentSmsOnly', value),
              !settings.smsEnabled
            )}
          </>
        )}

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                Alert.alert(
                  'Clear Notification History',
                  'This will delete all notifications from your device. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: () => {
                        // Implement clear notification history
                        Alert.alert('Success', 'Notification history cleared');
                      },
                    },
                  ]
                );
              }}
            >
              <View style={styles.actionContent}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>
                  Clear Notification History
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={parseTime(settings.quietHoursStart)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => onTimeChange(event, selectedDate, true)}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={parseTime(settings.quietHoursEnd)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => onTimeChange(event, selectedDate, false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabledRow: {
    opacity: 0.5,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  disabledText: {
    color: '#D1D5DB',
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#8B5CF6',
    marginRight: 8,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});

export default NotificationPreferencesScreen;
