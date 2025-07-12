import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'messages' | 'appointments' | 'bookings' | 'reviews' | 'system';
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: 'new_messages',
    title: 'New Messages',
    description: 'Get notified when you receive new messages',
    enabled: true,
    category: 'messages',
  },
  {
    id: 'appointment_reminders',
    title: 'Appointment Reminders',
    description: 'Receive reminders before your appointments',
    enabled: true,
    category: 'appointments',
  },
  {
    id: 'appointment_confirmations',
    title: 'Appointment Confirmations',
    description: 'Get notified when appointments are confirmed or cancelled',
    enabled: true,
    category: 'appointments',
  },
  {
    id: 'booking_requests',
    title: 'Booking Requests',
    description: 'Receive notifications for new booking requests (Providers only)',
    enabled: true,
    category: 'bookings',
  },
  {
    id: 'new_reviews',
    title: 'New Reviews',
    description: 'Get notified when you receive new reviews (Providers only)',
    enabled: true,
    category: 'reviews',
  },
  {
    id: 'system_updates',
    title: 'System Updates',
    description: 'Important app updates and announcements',
    enabled: true,
    category: 'system',
  },
];

const NotificationSettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission, requestPermission, getBadgeCount, clearBadge } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    loadPreferences();
    loadBadgeCount();
  }, []);

  const loadPreferences = async () => {
    // TODO: Load preferences from backend
    // For now, use defaults filtered by user role
    const filteredPreferences = defaultPreferences.filter(pref => {
      if (user?.role === 'client') {
        return !['booking_requests', 'new_reviews'].includes(pref.id);
      }
      return true;
    });
    setPreferences(filteredPreferences);
  };

  const loadBadgeCount = async () => {
    try {
      const count = await getBadgeCount();
      setBadgeCount(count);
    } catch (error) {
      console.error('Failed to get badge count:', error);
    }
  };

  const handlePermissionRequest = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        Alert.alert('Success', 'Notification permissions granted!');
      } else {
        Alert.alert(
          'Permission Denied', 
          'You can enable notifications in your device settings.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permission');
    }
  };

  const handlePreferenceToggle = async (preferenceId: string) => {
    setIsLoading(true);
    try {
      const updatedPreferences = preferences.map(pref =>
        pref.id === preferenceId ? { ...pref, enabled: !pref.enabled } : pref
      );
      setPreferences(updatedPreferences);

      // TODO: Save preferences to backend
      // await pushNotificationService.updateNotificationPreferences(user.id, updatedPreferences, token);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preferences');
      // Revert the change
      setPreferences(preferences);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearBadge = async () => {
    try {
      await clearBadge();
      setBadgeCount(0);
      Alert.alert('Success', 'Badge cleared!');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear badge');
    }
  };

  const renderPreferenceSection = (category: string, categoryPreferences: NotificationPreference[]) => (
    <View style={styles.section} key={category}>
      <Text style={styles.sectionTitle}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>
      {categoryPreferences.map(renderPreference)}
    </View>
  );

  const renderPreference = (preference: NotificationPreference) => (
    <View style={styles.preferenceItem} key={preference.id}>
      <View style={styles.preferenceContent}>
        <Text style={styles.preferenceTitle}>{preference.title}</Text>
        <Text style={styles.preferenceDescription}>{preference.description}</Text>
      </View>
      <Switch
        value={preference.enabled && hasPermission}
        onValueChange={() => handlePreferenceToggle(preference.id)}
        disabled={!hasPermission || isLoading}
        trackColor={{ false: '#767577', true: '#8B5CF6' }}
        thumbColor={preference.enabled ? '#FFFFFF' : '#f4f3f4'}
      />
    </View>
  );

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  return (
    <ScrollView style={styles.container}>
      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Permission</Text>
        <View style={styles.permissionItem}>
          <View style={styles.permissionContent}>
            <Ionicons
              name={hasPermission ? 'checkmark-circle' : 'alert-circle'}
              size={24}
              color={hasPermission ? '#10B981' : '#F59E0B'}
            />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>
                {hasPermission ? 'Notifications Enabled' : 'Notifications Disabled'}
              </Text>
              <Text style={styles.permissionDescription}>
                {hasPermission
                  ? 'You will receive push notifications'
                  : 'Enable notifications to receive important updates'
                }
              </Text>
            </View>
          </View>
          {!hasPermission && (
            <TouchableOpacity style={styles.enableButton} onPress={handlePermissionRequest}>
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Badge Management */}
      {hasPermission && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badge Management</Text>
          <View style={styles.badgeItem}>
            <View style={styles.badgeContent}>
              <Text style={styles.badgeTitle}>App Badge Count: {badgeCount}</Text>
              <Text style={styles.badgeDescription}>
                Clear the red badge number on the app icon
              </Text>
            </View>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearBadge}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notification Preferences */}
      {hasPermission && (
        <>
          {Object.entries(groupedPreferences).map(([category, categoryPreferences]) =>
            renderPreferenceSection(category, categoryPreferences)
          )}
        </>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    marginLeft: 12,
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  enableButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeContent: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  preferenceContent: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationSettingsScreen;
