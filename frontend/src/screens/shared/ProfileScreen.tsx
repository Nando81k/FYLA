import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { userService, UpdateProfileRequest } from '@/services/userService';
import { locationService } from '@/services/locationService';
import { UserRole } from '@/types';
import { getEnvironmentInfo } from '@/config/api';
import DarkModeToggle from '@/components/shared/DarkModeToggle';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

const ProfileScreen: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UpdateProfileRequest>({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    phoneNumber: user?.phoneNumber || '',
    profilePictureUrl: user?.profilePictureUrl || '',
    locationLat: user?.locationLat || undefined,
    locationLng: user?.locationLng || undefined,
  });
  const [locationAddress, setLocationAddress] = useState<string>('');

  const isProvider = user?.role === UserRole.PROVIDER;

  const handleSave = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      await userService.updateProfile(token, profileData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        try {
          if (!token) throw new Error('Not authenticated');
          
          const imageUrl = await userService.uploadProfilePicture(token, result.assets[0].uri);
          setProfileData(prev => ({ ...prev, profilePictureUrl: imageUrl }));
          
          // Auto-save image upload
          await userService.updateProfile(token, { 
            ...profileData, 
            profilePictureUrl: imageUrl 
          });
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setProfileData(prev => ({
          ...prev,
          locationLat: location.coordinates.latitude,
          locationLng: location.coordinates.longitude,
        }));
        
        // Format address for display
        const addressParts = [
          location.address,
          location.city,
          location.state,
        ].filter(Boolean);
        
        setLocationAddress(addressParts.join(', ') || 'Location obtained');
      } else {
        Alert.alert('Error', 'Unable to get your current location. Please check your location settings.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load initial address if coordinates exist
    if (profileData.locationLat && profileData.locationLng) {
      locationService.reverseGeocode({
        latitude: profileData.locationLat,
        longitude: profileData.locationLng,
      }).then((result) => {
        const addressParts = [
          result.address,
          result.city,
          result.state,
        ].filter(Boolean);
        setLocationAddress(addressParts.join(', ') || 'Location set');
      }).catch(() => {
        setLocationAddress('Location set');
      });
    }
  }, [profileData.locationLat, profileData.locationLng]);

  const renderProfileImage = () => (
    <TouchableOpacity style={styles.imageContainer} onPress={handleImagePick}>
      {profileData.profilePictureUrl ? (
        <Image source={{ uri: profileData.profilePictureUrl }} style={styles.profileImage} />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: colors.background.tertiary }]}>
          <Ionicons name="person" size={40} color={colors.text.secondary} />
        </View>
      )}
      <View style={[styles.imageOverlay, { backgroundColor: colors.primary }]}>
        <Ionicons name="camera" size={20} color={colors.text.inverse} />
      </View>
    </TouchableOpacity>
  );

  const renderEditableField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    multiline = false,
    placeholder = ''
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[
            styles.input, 
            multiline && styles.textArea,
            { 
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.primary,
              color: colors.text.primary
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: colors.text.primary }]}>{value || 'Not provided'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>My Profile</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={[styles.editButtonText, { color: colors.text.inverse }]}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              )}
            </TouchableOpacity>
            <DarkModeToggle size={24} style={styles.darkModeToggle} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Profile Image */}
          <View style={styles.imageSection}>
            {renderProfileImage()}
            <Text style={[styles.roleTag, { color: colors.text.secondary, backgroundColor: colors.background.secondary }]}>
              {isProvider ? 'Service Provider' : 'Client'}
            </Text>
          </View>

          {/* Profile Fields */}
          <View style={[styles.fieldsContainer, { backgroundColor: colors.background.secondary }]}>
            {renderEditableField(
              'Full Name',
              profileData.fullName || '',
              (text) => setProfileData(prev => ({ ...prev, fullName: text })),
              false,
              'Enter your full name'
            )}

            {renderEditableField(
              'Email',
              user?.email || '',
              () => {}, // Email is not editable
              false
            )}

            {renderEditableField(
              'Phone Number',
              profileData.phoneNumber || '',
              (text) => setProfileData(prev => ({ ...prev, phoneNumber: text })),
              false,
              'Enter your phone number'
            )}

            {renderEditableField(
              isProvider ? 'Business Bio' : 'About Me',
              profileData.bio || '',
              (text) => setProfileData(prev => ({ ...prev, bio: text })),
              true,
              isProvider 
                ? 'Tell clients about your services and experience...'
                : 'Tell us a bit about yourself...'
            )}

            {/* Location Section */}
            {isProvider && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Business Location</Text>
                {isEditing ? (
                  <View style={styles.locationSection}>
                    <Text style={[styles.locationText, { color: colors.text.primary }]}>
                      {locationAddress || 'No location set'}
                    </Text>
                    <TouchableOpacity
                      style={[styles.locationButton, { backgroundColor: colors.background.tertiary }]}
                      onPress={handleGetCurrentLocation}
                      disabled={isLoading}
                    >
                      <Ionicons name="location" size={16} color={colors.primary} />
                      <Text style={[styles.locationButtonText, { color: colors.primary }]}>
                        {profileData.locationLat ? 'Update Location' : 'Get Current Location'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.fieldValue, { color: colors.text.primary }]}>
                    {locationAddress || 'Location not set'}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Provider-specific sections */}
          {isProvider && (
            <View style={styles.providerSection}>
              <TouchableOpacity style={[styles.sectionButton, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.sectionButtonContent}>
                  <Ionicons name="pricetags" size={24} color={colors.primary} />
                  <View style={styles.sectionButtonText}>
                    <Text style={[styles.sectionButtonTitle, { color: colors.text.primary }]}>Service Tags</Text>
                    <Text style={[styles.sectionButtonSubtitle, { color: colors.text.secondary }]}>
                      Set your specialties (Barber, Nail Tech, etc.)
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sectionButton, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.sectionButtonContent}>
                  <Ionicons name="time" size={24} color={colors.primary} />
                  <View style={styles.sectionButtonText}>
                    <Text style={[styles.sectionButtonTitle, { color: colors.text.primary }]}>Business Hours</Text>
                    <Text style={[styles.sectionButtonSubtitle, { color: colors.text.secondary }]}>
                      Set your availability schedule
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sectionButton, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.sectionButtonContent}>
                  <Ionicons name="location" size={24} color={colors.primary} />
                  <View style={styles.sectionButtonText}>
                    <Text style={[styles.sectionButtonTitle, { color: colors.text.primary }]}>Location</Text>
                    <Text style={[styles.sectionButtonSubtitle, { color: colors.text.secondary }]}>
                      Set your service area
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Settings</Text>
            
            <TouchableOpacity 
              style={[styles.settingButton, { backgroundColor: colors.background.secondary }]}
              onPress={() => navigation.navigate('NotificationSettings')}
            >
              <Ionicons name="notifications" size={24} color={colors.text.secondary} />
              <Text style={[styles.settingButtonText, { color: colors.text.primary }]}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingButton, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="shield-checkmark" size={24} color={colors.text.secondary} />
              <Text style={[styles.settingButtonText, { color: colors.text.primary }]}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingButton, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="help-circle" size={24} color={colors.text.secondary} />
              <Text style={[styles.settingButtonText, { color: colors.text.primary }]}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Developer Settings - only show in development */}
            {getEnvironmentInfo().isDevelopment && (
              <TouchableOpacity 
                style={[styles.settingButton, { backgroundColor: colors.background.secondary }]}
                onPress={() => navigation.navigate('DeveloperSettings')}
              >
                <Ionicons name="code-slash" size={24} color={colors.primary} />
                <Text style={[styles.settingButtonText, { color: colors.primary }]}>
                  Developer Settings
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  darkModeToggle: {
    // Additional margin if needed
  },
  content: {
    paddingHorizontal: 24,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTag: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  fieldsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  providerSection: {
    marginBottom: 24,
  },
  sectionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  sectionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  sectionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  sectionButtonSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationSection: {
    flexDirection: 'column',
    gap: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
});

export default ProfileScreen;
