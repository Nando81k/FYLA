import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { ProviderProfile, Service } from '@/types';
import ModernBookingModal from '@/components/booking/ModernBookingModal';
import ModernBookingScreen from '@/components/booking/ModernBookingScreen';

const BookingDemoScreen: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  // Mock data for demonstration
  const mockProvider: ProviderProfile = {
    id: 1,
    fullName: 'Sarah Johnson',
    email: 'sarah@example.com',
    phoneNumber: '+1234567890',
    bio: 'Professional hairstylist with 10+ years of experience specializing in modern cuts and color treatments.',
    profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b812b8c5?w=200',
    averageRating: 4.8,
    totalReviews: 127,
    isOnline: true,
    locationLat: 40.7128,
    locationLng: -74.0060,
    distance: 2.1,
    createdAt: '2024-01-01T00:00:00Z',
    tags: [],
    services: [],
    businessHours: [],
    posts: [],
  };

  const mockServices: Service[] = [
    {
      id: 1,
      providerId: 1,
      name: 'Haircut & Style',
      description: 'Professional haircut with styling including wash, cut, and blow-dry.',
      price: 75,
      estimatedDurationMinutes: 60,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      providerId: 1,
      name: 'Color Treatment',
      description: 'Full hair color service with premium products and expert application.',
      price: 120,
      estimatedDurationMinutes: 90,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  const handleBookingSuccess = () => {
    Alert.alert(
      'Success!',
      'Your booking has been confirmed. You will receive a confirmation email shortly.',
      [{ text: 'OK' }]
    );
  };

  const handleBackFromFullScreen = () => {
    setShowFullScreen(false);
  };

  if (showFullScreen) {
    return (
      <ModernBookingScreen
        provider={mockProvider}
        selectedServices={mockServices}
        onBack={handleBackFromFullScreen}
        onSuccess={handleBookingSuccess}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modern Booking Demo</Text>
        <Text style={styles.subtitle}>
          Experience the new streamlined booking flow
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Provider Preview */}
        <View style={styles.providerPreview}>
          <Text style={styles.sectionTitle}>Provider</Text>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{mockProvider.fullName}</Text>
            <Text style={styles.providerBio}>{mockProvider.bio}</Text>
          </View>
        </View>

        {/* Services Preview */}
        <View style={styles.servicesPreview}>
          <Text style={styles.sectionTitle}>Selected Services</Text>
          {mockServices.map((service) => (
            <View key={service.id} style={styles.serviceItem}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>${service.price}</Text>
              </View>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>
          ))}
        </View>

        {/* Booking Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Try the New Booking Experience</Text>
          <Text style={styles.optionsDescription}>
            Choose how you'd like to experience the modern booking flow:
          </Text>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setShowModal(true)}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="layers-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Modal Experience</Text>
              <Text style={styles.optionDescription}>
                Book in an overlay modal with step-by-step guidance
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setShowFullScreen(true)}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="expand-outline" size={24} color="#34C759" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Full Screen Experience</Text>
              <Text style={styles.optionDescription}>
                Immersive full-screen booking with detailed review
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Features Highlight */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="time" size={20} color="#007AFF" />
            <Text style={styles.featureText}>
              <Text style={styles.featureBold}>Choose Time Button:</Text> Single button to select both date and time
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={20} color="#FF9500" />
            <Text style={styles.featureText}>
              <Text style={styles.featureBold}>Slot Reservation:</Text> Automatically reserves time slots while booking
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>
              <Text style={styles.featureBold}>Conflict Detection:</Text> Prevents double-booking with smart conflict resolution
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="calendar" size={20} color="#8B5CF6" />
            <Text style={styles.featureText}>
              <Text style={styles.featureBold}>Modern Calendar:</Text> Beautiful date picker with availability visualization
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modern Booking Modal */}
      <ModernBookingModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleBookingSuccess}
        provider={mockProvider}
        selectedServices={mockServices}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  providerPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  providerInfo: {
    marginBottom: 8,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  providerBio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  servicesPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionsDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  featureBold: {
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default BookingDemoScreen;
