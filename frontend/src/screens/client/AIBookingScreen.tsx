import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { aiBookingService, ServiceRecommendation, TimeSlotRecommendation, PersonalizedBookingFlow } from '@/services/aiBookingService';
import { ClientSearchStackParamList } from '@/types';
import DarkModeToggle from '@/components/shared/DarkModeToggle';

const { width } = Dimensions.get('window');

type AIBookingScreenNavigationProp = StackNavigationProp<ClientSearchStackParamList, 'SearchHome'>;

interface BookingPreferences {
  serviceCategory: string;
  maxPrice: number;
  maxDistance: number;
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
  urgency: 'asap' | 'today' | 'this_week' | 'flexible';
}

const AIBookingScreen: React.FC = () => {
  const navigation = useNavigation<AIBookingScreenNavigationProp>();
  const { token, user } = useAuth();
  const { colors, typography, spacing } = useTheme();
  
  const [step, setStep] = useState<'preferences' | 'recommendations' | 'booking'>('preferences');
  const [preferences, setPreferences] = useState<BookingPreferences>({
    serviceCategory: '',
    maxPrice: 200,
    maxDistance: 25,
    preferredTime: 'flexible',
    urgency: 'flexible',
  });
  const [personalizedFlow, setPersonalizedFlow] = useState<PersonalizedBookingFlow | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ServiceRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const serviceCategories = [
    { id: 'beauty', name: 'Beauty & Spa', icon: '💄', color: '#FF6B9D' },
    { id: 'fitness', name: 'Fitness & Wellness', icon: '💪', color: '#4CAF50' },
    { id: 'hair', name: 'Hair & Styling', icon: '✂️', color: '#9C27B0' },
    { id: 'massage', name: 'Massage & Therapy', icon: '🧘', color: '#2196F3' },
    { id: 'nails', name: 'Nails & Manicure', icon: '💅', color: '#FF9800' },
    { id: 'skincare', name: 'Skincare & Facial', icon: '🧴', color: '#E91E63' },
    { id: 'health', name: 'Health & Medical', icon: '🏥', color: '#f44336' },
    { id: 'other', name: 'Other Services', icon: '🔧', color: '#607D8B' },
  ];

  const timePreferences = [
    { id: 'morning', name: 'Morning (8AM - 12PM)', icon: '🌅' },
    { id: 'afternoon', name: 'Afternoon (12PM - 5PM)', icon: '☀️' },
    { id: 'evening', name: 'Evening (5PM - 9PM)', icon: '🌆' },
    { id: 'flexible', name: 'I\'m Flexible', icon: '🕐' },
  ];

  const urgencyOptions = [
    { id: 'asap', name: 'ASAP (Next 2 hours)', icon: '🚀', color: '#f44336' },
    { id: 'today', name: 'Today', icon: '📅', color: '#FF9800' },
    { id: 'this_week', name: 'This Week', icon: '📆', color: '#4CAF50' },
    { id: 'flexible', name: 'I\'m Flexible', icon: '🕐', color: '#2196F3' },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleGetRecommendations = async () => {
    if (!token || !preferences.serviceCategory) {
      Alert.alert('Error', 'Please select a service category');
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        serviceCategory: preferences.serviceCategory,
        maxPrice: preferences.maxPrice,
        maxDistance: preferences.maxDistance,
        preferredDateTime: getPreferredDateTime(),
        userLocation: user?.location ? {
          latitude: user.location.latitude,
          longitude: user.location.longitude,
        } : undefined,
      };

      const flow = await aiBookingService.getPersonalizedBookingFlow(token, request);
      setPersonalizedFlow(flow);
      setStep('recommendations');
    } catch (error) {
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPreferredDateTime = (): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preferences.urgency) {
      case 'asap':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      case 'today':
        return today.toISOString();
      case 'this_week':
        return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const handleBookService = (recommendation: ServiceRecommendation) => {
    navigation.navigate('ProviderDetail', { providerId: recommendation.providerId });
  };

  const renderPreferencesStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What are you looking for?</Text>
      <Text style={styles.stepSubtitle}>
        Help us find the perfect service for you with AI-powered recommendations
      </Text>

      {/* Service Categories */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Service Category</Text>
        <FlatList
          data={serviceCategories}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryCard,
                preferences.serviceCategory === item.id && styles.selectedCategoryCard,
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, serviceCategory: item.id }))}
            >
              <Text style={styles.categoryEmoji}>{item.icon}</Text>
              <Text style={[
                styles.categoryName,
                preferences.serviceCategory === item.id && styles.selectedCategoryName,
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      </View>

      {/* Budget */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Budget Range</Text>
        <TouchableOpacity
          style={styles.budgetCard}
          onPress={() => setShowPriceModal(true)}
        >
          <Ionicons name="cash-outline" size={24} color="#4CAF50" />
          <Text style={styles.budgetText}>Up to ${preferences.maxPrice}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Distance */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Maximum Distance</Text>
        <TouchableOpacity
          style={styles.budgetCard}
          onPress={() => setShowDistanceModal(true)}
        >
          <Ionicons name="location-outline" size={24} color="#2196F3" />
          <Text style={styles.budgetText}>Within {preferences.maxDistance} miles</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Time Preference */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Preferred Time</Text>
        <FlatList
          data={timePreferences}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.timeCard,
                preferences.preferredTime === item.id && styles.selectedTimeCard,
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, preferredTime: item.id as any }))}
            >
              <Text style={styles.timeEmoji}>{item.icon}</Text>
              <Text style={[
                styles.timeName,
                preferences.preferredTime === item.id && styles.selectedTimeName,
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      </View>

      {/* Urgency */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>When do you need it?</Text>
        <FlatList
          data={urgencyOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.urgencyCard,
                preferences.urgency === item.id && styles.selectedUrgencyCard,
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, urgency: item.id as any }))}
            >
              <View style={[styles.urgencyIcon, { backgroundColor: item.color }]}>
                <Text style={styles.urgencyEmoji}>{item.icon}</Text>
              </View>
              <Text style={[
                styles.urgencyName,
                preferences.urgency === item.id && styles.selectedUrgencyName,
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          !preferences.serviceCategory && styles.disabledButton,
        ]}
        onPress={handleGetRecommendations}
        disabled={!preferences.serviceCategory || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.nextButtonText}>Get AI Recommendations</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRecommendationsStep = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.recommendationsHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('preferences')}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>AI Recommendations</Text>
        <View style={styles.aiIcon}>
          <Ionicons name="flash" size={20} color="#FF6B9D" />
        </View>
      </View>

      {personalizedFlow && (
        <>
          {/* AI Tips */}
          {personalizedFlow.bookingTips.length > 0 && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Smart Tips for You</Text>
              {personalizedFlow.bookingTips.map((tip, index) => (
                <Text key={index} style={styles.tipText}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}

          {/* Recommended Services */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <FlatList
              data={personalizedFlow.recommendedServices}
              keyExtractor={(item) => `${item.serviceId}-${item.providerId}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recommendationCard}
                  onPress={() => handleBookService(item)}
                >
                  <View style={styles.recommendationHeader}>
                    <View style={styles.providerInfo}>
                      {item.providerImage && (
                        <Image 
                          source={{ uri: item.providerImage }} 
                          style={styles.providerImage}
                        />
                      )}
                      <View style={styles.providerDetails}>
                        <Text style={styles.serviceName}>{item.serviceName}</Text>
                        <Text style={styles.providerName}>{item.providerName}</Text>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={16} color="#FFD700" />
                          <Text style={styles.ratingText}>
                            {item.rating} ({item.reviewCount} reviews)
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.confidenceContainer}>
                      <Text style={styles.confidenceText}>
                        {Math.round(item.confidence * 100)}% match
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.recommendationReason}>{item.reason}</Text>

                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetail}>
                      <Ionicons name="cash-outline" size={16} color="#4CAF50" />
                      <Text style={styles.serviceDetailText}>${item.estimatedPrice}</Text>
                    </View>
                    <View style={styles.serviceDetail}>
                      <Ionicons name="time-outline" size={16} color="#2196F3" />
                      <Text style={styles.serviceDetailText}>{item.estimatedDuration} min</Text>
                    </View>
                    {item.distance && (
                      <View style={styles.serviceDetail}>
                        <Ionicons name="location-outline" size={16} color="#FF9800" />
                        <Text style={styles.serviceDetailText}>{item.distance.toFixed(1)} mi</Text>
                      </View>
                    )}
                  </View>

                  {item.specialOffers && item.specialOffers.length > 0 && (
                    <View style={styles.offerContainer}>
                      <Ionicons name="pricetag" size={16} color="#f44336" />
                      <Text style={styles.offerText}>
                        {item.specialOffers[0].title}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          </View>

          {/* Suggested Time Slots */}
          {personalizedFlow.suggestedTimeSlots.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Best Time Slots</Text>
              <FlatList
                data={personalizedFlow.suggestedTimeSlots}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.datetime}
                renderItem={({ item }) => (
                  <View style={styles.timeSlotCard}>
                    <Text style={styles.timeSlotDay}>
                      {new Date(item.datetime).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text style={styles.timeSlotTime}>
                      {new Date(item.datetime).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </Text>
                    <Text style={styles.timeSlotReason}>{item.reason}</Text>
                    <View style={styles.availabilityIndicator}>
                      <Text style={styles.availabilityText}>
                        {item.providerAvailability} availability
                      </Text>
                    </View>
                  </View>
                )}
              />
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderPriceModal = () => (
    <Modal
      visible={showPriceModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPriceModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Budget Range</Text>
          {[50, 100, 150, 200, 300, 500].map((price) => (
            <TouchableOpacity
              key={price}
              style={[
                styles.modalOption,
                preferences.maxPrice === price && styles.selectedModalOption,
              ]}
              onPress={() => {
                setPreferences(prev => ({ ...prev, maxPrice: price }));
                setShowPriceModal(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                preferences.maxPrice === price && styles.selectedModalOptionText,
              ]}>
                Up to ${price}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowPriceModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderDistanceModal = () => (
    <Modal
      visible={showDistanceModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDistanceModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Maximum Distance</Text>
          {[5, 10, 15, 25, 50, 100].map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.modalOption,
                preferences.maxDistance === distance && styles.selectedModalOption,
              ]}
              onPress={() => {
                setPreferences(prev => ({ ...prev, maxDistance: distance }));
                setShowDistanceModal(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                preferences.maxDistance === distance && styles.selectedModalOptionText,
              ]}>
                Within {distance} miles
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowDistanceModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Booking Assistant</Text>
        <View style={styles.headerRight}>
          <Ionicons name="sparkles" size={24} color="#FF6B9D" />
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === 'preferences' && renderPreferencesStep()}
        {step === 'recommendations' && renderRecommendationsStep()}
      </Animated.View>

      {renderPriceModal()}
      {renderDistanceModal()}
    </SafeAreaView>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedCategoryCard: {
    borderColor: '#FF6B9D',
    backgroundColor: '#FFF5F8',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: '#FF6B9D',
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  budgetText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedTimeCard: {
    borderColor: '#2196F3',
    backgroundColor: '#F3F8FF',
  },
  timeEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  timeName: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeName: {
    color: '#2196F3',
    fontWeight: '600',
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedUrgencyCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  urgencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  urgencyEmoji: {
    fontSize: 20,
    color: '#fff',
  },
  urgencyName: {
    fontSize: 16,
    color: '#333',
  },
  selectedUrgencyName: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  aiIcon: {
    marginLeft: 'auto',
  },
  tipsContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  providerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  confidenceContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recommendationReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  offerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  offerText: {
    fontSize: 12,
    color: '#f44336',
    marginLeft: 4,
    fontWeight: '600',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    padding: 12,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
  timeSlotCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timeSlotReason: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  availabilityIndicator: {
    backgroundColor: '#E8F5E8',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availabilityText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: width * 0.8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedModalOption: {
    backgroundColor: '#FF6B9D',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedModalOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AIBookingScreen;
