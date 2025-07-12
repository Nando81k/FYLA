import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FEATURE_FLAGS, DEV_CONFIG, getEnvironmentInfo, API_ENDPOINTS } from '@/config/api';
import { ServiceFactory } from '@/services/apiService';

const DeveloperSettingsScreen: React.FC = () => {
  const [featureFlags, setFeatureFlags] = useState({ ...FEATURE_FLAGS });
  const [apiHealth, setApiHealth] = useState(ServiceFactory.getApiService().getHealthStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const environmentInfo = getEnvironmentInfo();

  // Refresh API health status
  const refreshApiHealth = async () => {
    setIsRefreshing(true);
    try {
      await ServiceFactory.getApiService().get(API_ENDPOINTS.HEALTH.GENERAL);
      setApiHealth(ServiceFactory.getApiService().getHealthStatus());
    } catch (error) {
      console.log('Health check failed:', error);
      setApiHealth(ServiceFactory.getApiService().getHealthStatus());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshApiHealth();
  }, []);

  const updateFeatureFlag = (flag: keyof typeof FEATURE_FLAGS, value: boolean) => {
    const newFlags = { ...featureFlags, [flag]: value };
    setFeatureFlags(newFlags);
    (FEATURE_FLAGS as any)[flag] = value;
    Alert.alert(
      'Feature Flag Updated',
      `${flag}: ${value ? 'Enabled' : 'Disabled'}`
    );
  };

  const testApiConnection = async () => {
    setIsLoading(true);
    try {
      const apiService = ServiceFactory.getApiService();
      const currentUrl = apiService.getCurrentBaseUrl();
      const fallbackUrls = apiService.getFallbackUrls();
      
      Alert.alert(
        'API Connection Info',
        `Current URL: ${currentUrl}\n\nAvailable URLs:\n${fallbackUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}`
      );
      
      // Test current connection
      await apiService.get('/health');
      Alert.alert('Connection Test', '✅ Connection successful!');
    } catch (error) {
      Alert.alert('Connection Test', `❌ Connection failed: ${(error as any).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      const apiService = ServiceFactory.getApiService();
      const result = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: 'john.doe@example.com',
        password: 'Password123!'
      }) as any;
      
      if (result && result.token) {
        Alert.alert(
          'Login Test Successful!',
          `User: ${result.user?.fullName}\nEmail: ${result.user?.email}\nRole: ${result.user?.role}`
        );
      } else {
        Alert.alert('Login Test Failed', 'No token received');
      }
    } catch (error: any) {
      Alert.alert('Login Test Failed', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderApiSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🌐 API Status</Text>
      
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Connection:</Text>
        <Text style={[styles.statusValue, { color: apiHealth.isOnline ? '#10B981' : '#EF4444' }]}>
          {apiHealth.isOnline ? '✅ Online' : '❌ Offline'}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Current URL:</Text>
        <Text style={styles.statusValue}>{ServiceFactory.getApiService().getCurrentBaseUrl()}</Text>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={testApiConnection} disabled={isLoading}>
        <Ionicons name="wifi" size={20} color="#3B82F6" />
        <Text style={styles.actionButtonText}>Test Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={testLogin} disabled={isLoading}>
        <Ionicons name="log-in" size={20} color="#10B981" />
        <Text style={styles.actionButtonText}>Test Login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFeatureFlagsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🚩 Feature Flags</Text>
      
      {Object.entries(featureFlags).map(([key, value]) => (
        <View key={key} style={styles.flagRow}>
          <Text style={styles.flagLabel}>{key.replace('USE_REAL_', '').replace('_API', '')}</Text>
          <Switch
            value={value}
            onValueChange={(newValue) => updateFeatureFlag(key as keyof typeof FEATURE_FLAGS, newValue)}
            thumbColor={value ? '#10B981' : '#F3F4F6'}
            trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
          />
        </View>
      ))}
    </View>
  );

  if (!environmentInfo.isDevelopment) {
    return (
      <View style={styles.notAvailable}>
        <Ionicons name="warning" size={48} color="#F59E0B" />
        <Text style={styles.notAvailableText}>Developer Settings</Text>
        <Text style={styles.notAvailableSubtext}>Only available in development mode</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshApiHealth} />
      }
    >
      {renderApiSection()}
      {renderFeatureFlagsSection()}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1F2937',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  flagLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#374151',
  },
  notAvailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  notAvailableText: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    color: '#1F2937',
  },
  notAvailableSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DeveloperSettingsScreen;
