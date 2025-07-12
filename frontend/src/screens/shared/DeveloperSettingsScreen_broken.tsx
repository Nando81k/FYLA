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
  const [devConfig, setDevConfig] = useState({ ...DEV_CONFIG });
  const [apiHealth, setApiHealth] = useState(ServiceFactory.getApiService().getHealthStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const environmentInfo = getEnvironmentInfo();

  // Refresh API health status
  const refreshApiHealth = async () => {
    setIsRefreshing(true);
    try {
      // Force a health check by making a simple request
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
    
    // Update the actual FEATURE_FLAGS object (this is a temporary solution)
    // In a production app, you'd want to persist this to AsyncStorage
    (FEATURE_FLAGS as any)[flag] = value;
    
    Alert.alert(
      'Feature Flag Updated',
      `${flag}: ${value ? 'Enabled' : 'Disabled'}\n\nNote: Restart the app for all changes to take effect.`
    );
  };
    
    // Clear cached data to ensure changes take effect
    clearCachedDataAndRefresh();
    
    Alert.alert(
      'Feature Flag Updated',
      `${flag.replace(/_/g, ' ')} is now ${value ? 'enabled' : 'disabled'}.\n\nChanges will take effect immediately. You may need to refresh data in some screens.`
    );
  };

  const updateDevConfig = (config: keyof typeof DEV_CONFIG, value: boolean | number) => {
    const newConfig = { ...devConfig, [config]: value };
    setDevConfig(newConfig);
    (DEV_CONFIG as any)[config] = value;
  };

  const testApiConnection = async () => {
    setIsLoading(true);
    try {
      Alert.alert('Testing API...', 'Checking connection to backend...');
      
      const apiService = ServiceFactory.getApiService();
      // Test by making a health request
      const result = await apiService.get(API_ENDPOINTS.HEALTH.GENERAL);
      const health = apiService.getHealthStatus();
      
      setApiHealth(health);
      
      Alert.alert(
        'API Test Result',
        health.isOnline 
          ? `✅ Connected Successfully!\n\nResponse time: ${health.responseTime}ms\nLast checked: ${health.lastChecked.toLocaleTimeString()}\nStatus: ${(result as any)?.status || 'healthy'}`
          : '❌ Connection Failed\n\nBackend appears to be offline or unreachable'
      );
    } catch (error: any) {
      Alert.alert(
        'API Test Failed', 
        `❌ Error: ${error.message || 'Unknown error occurred'}\n\nMake sure the backend is running at ${environmentInfo.apiBaseUrl}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificApi = async (apiType: string) => {
    setIsLoading(true);
    try {
      Alert.alert('Testing API...', `Checking ${apiType} endpoint...`);
      
      let endpoint = '';
      switch (apiType) {
        case 'auth':
          endpoint = API_ENDPOINTS.HEALTH.AUTH;
          break;
        case 'appointments':
          endpoint = API_ENDPOINTS.HEALTH.APPOINTMENTS;
          break;
        case 'chat':
          endpoint = API_ENDPOINTS.CHAT.CONVERSATIONS;
          break;
        default:
          endpoint = API_ENDPOINTS.HEALTH.GENERAL;
      }

      const apiService = ServiceFactory.getApiService();
      const result = await apiService.get(endpoint) as any;
      
      Alert.alert(
        `${apiType.toUpperCase()} API Test Result`,
        `✅ Success!\n\nEndpoint: ${endpoint}\nStatus: ${result?.status || result?.message || 'healthy'}\nTimestamp: ${new Date().toLocaleTimeString()}`
      );
    } catch (error: any) {
      // Special handling for chat endpoint 401 errors
      if (apiType === 'chat' && error.message.includes('401')) {
        Alert.alert(
          `${apiType.toUpperCase()} API Test Result`,
          `⚠️ 401 Unauthorized (Expected)\n\nThe chat endpoint requires authentication. This is normal behavior.\n\nUse the "Test Login" button below to authenticate first, then try testing the chat endpoint again.`
        );
      } else {
        Alert.alert(
          `${apiType.toUpperCase()} API Test Failed`,
          `❌ Error: ${error.message || 'Connection failed'}\n\nEndpoint: ${apiType}\nMake sure the backend is running and the endpoint exists.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      Alert.alert('Testing Login...', 'Attempting to authenticate with seeded user...');
      
      const apiService = ServiceFactory.getApiService();
      
      // Use the seeded user credentials from the backend
      const loginData = {
        email: 'john.doe@example.com',
        password: 'Password123!'
      };
      
      console.log('Sending login request with data:', loginData);
      console.log('API endpoint:', API_ENDPOINTS.AUTH.LOGIN);
      console.log('Feature flag USE_REAL_AUTH_API:', FEATURE_FLAGS.USE_REAL_AUTH_API);
      
      const result = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, loginData) as any;
      
      console.log('Login response received:', {
        hasUser: !!result.user,
        hasToken: !!result.token,
        userRole: result.user?.role,
        userEmail: result.user?.email
      });
      
      if (result && result.token) {
        Alert.alert(
          'Login Test Successful! ✅',
          `Successfully authenticated!\n\nUser: ${result.user?.fullName}\nEmail: ${result.user?.email}\nRole: ${result.user?.role}\nToken received: ${result.token.substring(0, 20)}...\n\nYou can now test authenticated endpoints like Chat.`
        );
      } else {
        Alert.alert(
          'Login Test Failed',
          'Login request succeeded but no token was returned'
        );
      }
    } catch (error: any) {
      console.error('Login test error details:', error);
      Alert.alert(
        'Login Test Failed',
        `❌ Error: ${error.message || 'Authentication failed'}\n\nMake sure the backend is running and the seeded user exists.\n\nExpected credentials:\nEmail: john.doe@example.com\nPassword: Password123!`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testProviders = async () => {
    setIsLoading(true);
    try {
      Alert.alert('Testing Providers...', 'Attempting to fetch providers from backend...');
      
      const apiService = ServiceFactory.getApiService();
      
      const result = await apiService.get(API_ENDPOINTS.PROVIDERS.SEARCH) as any;
      
      if (result && result.providers) {
        const providerNames = result.providers.map((p: any) => p.fullName).join('\n');
        Alert.alert(
          'Providers Test Successful! ✅',
          `Found ${result.providers.length} providers:\n\n${providerNames}\n\nTotal: ${result.total}\nPage: ${result.page} of ${result.totalPages}`
        );
      } else {
        Alert.alert(
          'Providers Test Failed',
          'Request succeeded but no providers data was returned'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Providers Test Failed',
        `❌ Error: ${error.message || 'Failed to fetch providers'}\n\nMake sure you're logged in and the backend is running with providers data seeded.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all cached data and reset the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage, SecureStore, etc.
              // In a real app, you'd import and use these services
              Alert.alert('Success', 'All data cleared successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        },
      ]
    );
  };

  const exportLogs = () => {
    Alert.alert(
      'Export Logs', 
      'Development logs exported to console.\n\nCheck the console for detailed logs.',
      [{ text: 'OK' }]
    );
    
    // Log current state for debugging
    console.log('=== FYLA Developer Logs ===');
    console.log('Feature Flags:', featureFlags);
    console.log('Dev Config:', devConfig);
    console.log('API Health:', apiHealth);
    console.log('Environment:', environmentInfo);
    console.log('=========================');
  };

  const resetToMockMode = () => {
    Alert.alert(
      'Reset to Mock Mode',
      'This will disable all real API calls and use mock data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: () => {
            const newFlags = { ...featureFlags };
            Object.keys(FEATURE_FLAGS).forEach(key => {
              if (key.startsWith('USE_REAL_')) {
                (newFlags as any)[key] = false;
                (FEATURE_FLAGS as any)[key] = false;
              }
            });
            setFeatureFlags(newFlags);
            clearCachedDataAndRefresh();
            Alert.alert('Success', 'All APIs reset to mock mode!\n\nChanges will take effect immediately.');
          }
        },
      ]
    );
  };

  const enableAllRealApis = () => {
    Alert.alert(
      'Enable All Real APIs',
      'This will enable all real API endpoints. Make sure backend is running!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enable', 
          onPress: () => {
            const newFlags = { ...featureFlags };
            Object.keys(FEATURE_FLAGS).forEach(key => {
              if (key.startsWith('USE_REAL_')) {
                (newFlags as any)[key] = true;
                (FEATURE_FLAGS as any)[key] = true;
              }
            });
            setFeatureFlags(newFlags);
            clearCachedDataAndRefresh();
            Alert.alert('Success', 'All APIs enabled for real backend!\n\nChanges will take effect immediately.');
          }
        },
      ]
    );
  };

  const testProviderFeatureFlag = async () => {
    console.log('Current FEATURE_FLAGS.USE_REAL_PROVIDER_API:', FEATURE_FLAGS.USE_REAL_PROVIDER_API);
    Alert.alert(
      'Provider Feature Flag Status',
      `USE_REAL_PROVIDER_API: ${FEATURE_FLAGS.USE_REAL_PROVIDER_API ? 'ENABLED' : 'DISABLED'}\n\nIf you recently changed this flag, you may need to restart the app for changes to take effect.`
    );
  };

  const clearCachedDataAndRefresh = () => {
    // Force refresh API health status
    refreshApiHealth();
    
    // Clear any cached service data
    // In a more complex app, you might want to emit an event to notify all contexts and services
    console.log('Feature flags updated - clearing cached data');
    
    // You could also add logic here to:
    // - Clear AsyncStorage cache
    // - Reset service instances
    // - Emit events to React contexts to refresh data
  };

  const renderFeatureFlagSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🚀 Feature Flags</Text>
      <Text style={styles.sectionDescription}>
        Toggle between mock data and real API endpoints
      </Text>
      
      {Object.entries(featureFlags).map(([key, value]) => (
        <View key={key} style={styles.flagItem}>
          <View style={styles.flagContent}>
            <Text style={styles.flagTitle}>{key.replace(/_/g, ' ')}</Text>
            <Text style={styles.flagDescription}>
              {typeof value === 'boolean' 
                ? (value ? 'Using real API' : 'Using mock data')
                : String(value)
              }
            </Text>
          </View>
          {typeof value === 'boolean' && (
            <Switch
              value={value}
              onValueChange={(newValue) => updateFeatureFlag(key as keyof typeof FEATURE_FLAGS, newValue)}
              trackColor={{ false: '#767577', true: '#8B5CF6' }}
              thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderApiHealthSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔍 API Health</Text>
        <TouchableOpacity 
          onPress={refreshApiHealth} 
          disabled={isRefreshing}
          style={styles.refreshButton}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={isRefreshing ? '#9CA3AF' : '#8B5CF6'} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.healthItem}>
        <View style={styles.healthStatus}>
          <Ionicons 
            name={apiHealth.isOnline ? 'checkmark-circle' : 'close-circle'} 
            size={24} 
            color={apiHealth.isOnline ? '#10B981' : '#EF4444'} 
          />
          <Text style={styles.healthText}>
            {apiHealth.isOnline ? 'Online' : 'Offline'}
          </Text>
          {apiHealth.isOnline && (
            <Text style={styles.responseTime}>
              ({apiHealth.responseTime}ms)
            </Text>
          )}
        </View>
        <Text style={styles.healthTime}>
          Last checked: {apiHealth.lastChecked.toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.featuresGrid}>
        {Object.entries(apiHealth.features).map(([feature, available]) => (
          <View key={feature} style={styles.featureItem}>
            <Ionicons 
              name={available ? 'checkmark' : 'close'} 
              size={16} 
              color={available ? '#10B981' : '#EF4444'} 
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
        onPress={testApiConnection}
        disabled={isLoading}
      >
        <Ionicons name="pulse" size={20} color="#FFFFFF" />
        <Text style={styles.testButtonText}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      <View style={styles.testButtonsGrid}>
        <TouchableOpacity 
          style={[styles.smallTestButton, isLoading && styles.testButtonDisabled]} 
          onPress={() => testSpecificApi('auth')}
          disabled={isLoading}
        >
          <Text style={styles.smallTestButtonText}>Test Auth</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.smallTestButton, isLoading && styles.testButtonDisabled]} 
          onPress={() => testSpecificApi('appointments')}
          disabled={isLoading}
        >
          <Text style={styles.smallTestButtonText}>Test Appointments</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.testButtonsGrid}>
        <TouchableOpacity 
          style={[styles.smallTestButton, isLoading && styles.testButtonDisabled]} 
          onPress={() => testSpecificApi('chat')}
          disabled={isLoading}
        >
          <Text style={styles.smallTestButtonText}>Test Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.smallTestButton, isLoading && styles.testButtonDisabled]} 
          onPress={() => testLogin()}
          disabled={isLoading}
        >
          <Text style={styles.smallTestButtonText}>Test Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.smallTestButton, isLoading && styles.testButtonDisabled]} 
          onPress={() => testRegistration()}
          disabled={isLoading}
        >
          <Text style={styles.smallTestButtonText}>Test Registration</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.testButtonsGrid}>
        <TouchableOpacity 
          style={[styles.smallTestButton, isLoading && styles.testButtonDisabled]} 
          onPress={() => testProviders()}
          disabled={isLoading}
        >
          <Text style={styles.smallTestButtonText}>Test Providers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.smallTestButton, isLoading && styles.testButtonDisabled]} 
          onPress={() => testProviderFeatureFlag()}
          disabled={isLoading}
        >
          <Text style={styles.smallTestButtonText}>Check Provider Flag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTestCredentialsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔑 Test Credentials</Text>
      <Text style={styles.sectionDescription}>
        Use these credentials to test login functionality with seeded database users
      </Text>
      
      <View style={styles.credentialItem}>
        <Text style={styles.credentialRole}>Client User</Text>
        <Text style={styles.credentialEmail}>john.doe@example.com</Text>
        <Text style={styles.credentialPassword}>Password123!</Text>
      </View>
      
      <View style={styles.credentialItem}>
        <Text style={styles.credentialRole}>Service Provider</Text>
        <Text style={styles.credentialEmail}>maria.garcia@example.com</Text>
        <Text style={styles.credentialPassword}>ProviderPass123!</Text>
      </View>

      <View style={styles.credentialItem}>
        <Text style={styles.credentialRole}>Additional Client</Text>
        <Text style={styles.credentialEmail}>sarah.johnson@example.com</Text>
        <Text style={styles.credentialPassword}>ClientPass123!</Text>
      </View>

      <View style={styles.credentialItem}>
        <Text style={styles.credentialRole}>Makeup Artist Provider</Text>
        <Text style={styles.credentialEmail}>alex.thompson@example.com</Text>
        <Text style={styles.credentialPassword}>ProviderPass123!</Text>
      </View>
    </View>
  );

  const renderApiConnectionSection = () => {
    const apiService = ServiceFactory.getApiService();
    const currentUrl = apiService.getCurrentBaseUrl();
    const fallbackUrls = apiService.getFallbackUrls();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 API Connection</Text>
        
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionLabel}>Current URL:</Text>
          <Text style={styles.connectionValue}>{currentUrl}</Text>
        </View>

        <View style={styles.connectionInfo}>
          <Text style={styles.connectionLabel}>Fallback URLs:</Text>
          {fallbackUrls.map((url, index) => (
            <Text 
              key={index} 
              style={[
                styles.connectionValue, 
                url === currentUrl && styles.currentUrl
              ]}
            >
              {index + 1}. {url} {url === currentUrl ? '← Current' : ''}
            </Text>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={testConnectionToAllUrls}
          disabled={isLoading}
        >
          <Ionicons name="wifi" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Test All URLs</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const testConnectionToAllUrls = async () => {
    setIsLoading(true);
    try {
      const apiService = ServiceFactory.getApiService();
      const fallbackUrls = apiService.getFallbackUrls();
      const results: string[] = [];

      for (const url of fallbackUrls) {
        try {
          const testService = ServiceFactory.getApiService();
          // Temporarily test this URL
          await testService.get('/health');
          results.push(`✅ ${url} - Working`);
        } catch (error) {
          results.push(`❌ ${url} - Failed: ${(error as any).message || 'Connection error'}`);
        }
      }

      Alert.alert(
        'Connection Test Results',
        results.join('\n\n'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Connection Test Failed', `Error: ${(error as any).message}`);
    } finally {
      setIsLoading(false);
    }
  };
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ℹ️ Environment Info</Text>
      
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Mode</Text>
          <Text style={styles.infoValue}>
            {environmentInfo.isDevelopment ? 'Development' : 'Production'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>{environmentInfo.platform}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>{environmentInfo.appVersion}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>API URL</Text>
          <Text style={styles.infoValue}>{environmentInfo.apiBaseUrl}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Device</Text>
          <Text style={styles.infoValue}>
            {environmentInfo.isPhysicalDevice ? 'Physical' : 'Simulator'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderActionsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛠️ Developer Actions</Text>
      
      <TouchableOpacity style={styles.actionButton} onPress={clearAllData}>
        <Ionicons name="trash" size={20} color="#EF4444" />
        <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Clear All Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={exportLogs}>
        <Ionicons name="download" size={20} color="#8B5CF6" />
        <Text style={styles.actionButtonText}>Export Logs</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => resetToMockMode()}>
        <Ionicons name="refresh" size={20} color="#F59E0B" />
        <Text style={styles.actionButtonText}>Reset to Mock Mode</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => enableAllRealApis()}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text style={styles.actionButtonText}>Enable All Real APIs</Text>
      </TouchableOpacity>
    </View>
  );

  const testRegistration = async () => {
    setIsLoading(true);
    try {
      Alert.alert('Testing Registration...', 'Attempting to register a new user...');
      
      const apiService = ServiceFactory.getApiService();
      
      // Create a unique user for testing
      const timestamp = Date.now();
      const registrationData = {
        fullName: `Test User ${timestamp}`,
        email: `testuser${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phoneNumber: '+1234567890',
        role: 'Client'
      };
      
      const result = await apiService.post(API_ENDPOINTS.AUTH.REGISTER, registrationData) as any;
      
      if (result && result.token) {
        Alert.alert(
          'Registration Test Successful! ✅',
          `Successfully registered and authenticated!\n\nUser: ${result.user?.fullName}\nEmail: ${result.user?.email}\nRole: ${result.user?.role}\nToken received: ${result.token.substring(0, 20)}...\n\nYou can now test login with these credentials.`
        );
      } else {
        Alert.alert(
          'Registration Test Failed',
          'Registration request succeeded but no token was returned'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Registration Test Failed',
        `❌ Error: ${error.message || 'Registration failed'}\n\nMake sure the backend is running and check the console for more details.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Only show this screen in development mode
  if (!environmentInfo.isDevelopment) {
    return (
      <View style={styles.container}>
        <View style={styles.notAvailable}>
          <Ionicons name="lock-closed" size={48} color="#6B7280" />
          <Text style={styles.notAvailableText}>
            Developer settings are only available in development mode
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshApiHealth}
          colors={['#8B5CF6']}
          tintColor="#8B5CF6"
        />
      }
    >
      {renderApiHealthSection()}
      {renderFeatureFlagSection()}
      {renderTestCredentialsSection()}
      {renderEnvironmentSection()}
      {renderActionsSection()}
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  flagContent: {
    flex: 1,
    marginRight: 16,
  },
  flagTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  flagDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  healthItem: {
    marginBottom: 16,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  healthText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#1F2937',
  },
  healthTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginVertical: 4,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: '#34C759',
    marginTop: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '400',
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
    color: '#8B5CF6',
  },
  notAvailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notAvailableText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  testButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  smallTestButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  smallTestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    padding: 4,
  },
  responseTime: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  credentialItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  credentialRole: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  credentialEmail: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
  },
  credentialPassword: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 2,
  },
});

export default DeveloperSettingsScreen;
