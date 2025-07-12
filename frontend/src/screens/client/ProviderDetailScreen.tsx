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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { providerService } from '@/services/providerService';
import { serviceService } from '@/services/serviceService';
import { reviewService } from '@/services/reviewService';
import { chatService } from '@/services/chatService';
import { locationService } from '@/services/locationService';
import { ProviderProfile, Service, BusinessHours, dayNames, Appointment } from '@/types';
import AdvancedBookingModal from '@/components/booking/AdvancedBookingModal';
import AIBookingRecommendations from '@/components/booking/AIBookingRecommendations';

type ProviderDetailRouteProp = RouteProp<
  { ProviderDetail: { providerId: number } },
  'ProviderDetail'
>;

const ProviderDetailScreen: React.FC = () => {
  const route = useRoute<ProviderDetailRouteProp>();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { providerId } = route.params;

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'services' | 'about' | 'reviews'>('services');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [reviews, setReviews] = useState<import('@/types').Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    loadProviderDetails();
  }, [providerId]);

  useEffect(() => {
    if (provider && selectedTab === 'services' && services.length === 0) {
      loadProviderServices();
    }
  }, [provider, selectedTab]);

  useEffect(() => {
    if (selectedTab === 'reviews' && provider && reviews.length === 0) {
      loadReviews();
    }
  }, [selectedTab, provider]);

  const loadProviderDetails = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const providerData = await providerService.getProviderById(providerId);
      setProvider(providerData);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load provider details'
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadProviderServices = async () => {
    if (!token || !provider) return;

    setIsLoadingServices(true);
    try {
      const servicesData = await serviceService.getProviderServices(provider.id);
      setServices(servicesData.services);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load services'
      );
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadReviews = async () => {
    if (!token || !provider) return;

    setReviewsLoading(true);
    try {
      const reviewsData = await reviewService.getMockProviderReviews(provider.id);
      setReviews(reviewsData.reviews);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load reviews'
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
            size={16}
            color="#fbbf24"
          />
        ))}
      </View>
    );
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleSelectService = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      handleServiceToggle(service);
    }
  };

  const handleSelectTimeSlot = (timeSlot: string) => {
    // This would be used to pre-select a time slot in the booking modal
    console.log('Selected time slot:', timeSlot);
    // You could store this in state and pass it to the booking modal
  };

  const handleBookServices = () => {
    if (selectedServices.length === 0) {
      Alert.alert('No Services Selected', 'Please select at least one service to book.');
      return;
    }
    setIsBookingModalVisible(true);
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    setSelectedServices([]);
    setIsBookingModalVisible(false);
    // Optionally navigate to appointments screen or show success message
  };

  const handleMessageProvider = async () => {
    if (!token || !provider) return;

    try {
      // Create or get existing conversation
      const conversation = await chatService.createOrGetConversation(token, provider.id);
      
      // Navigate to chat screen
      (navigation as any).navigate('Chat', {
        conversationId: conversation.id,
        otherUser: provider,
      });
    } catch (error) {
      // For demo purposes, create a mock conversation
      (navigation as any).navigate('Chat', {
        conversationId: 1,
        otherUser: provider,
      });
    }
  };

  const handleDirections = async () => {
    if (!provider || !provider.locationLat || !provider.locationLng) {
      Alert.alert(
        'Location Unavailable',
        'This provider has not shared their location.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await locationService.openDirections(
        {
          latitude: provider.locationLat,
          longitude: provider.locationLng,
        },
        provider.fullName
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open directions. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderReviewItem = ({ item: review }: { item: import('@/types').Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{
            uri: review.client?.profilePictureUrl || 'https://via.placeholder.com/40x40?text=?',
          }}
          style={styles.reviewerImage}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{review.client?.fullName || 'Anonymous'}</Text>
          <View style={styles.reviewRating}>
            {renderStars(review.rating)}
            <Text style={styles.reviewDate}>
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      {review.comment && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
    </View>
  );

  const renderReviewsContent = () => {
    if (reviewsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      );
    }

    if (reviews.length === 0) {
      return (
        <View style={styles.emptyReviews}>
          <Ionicons name="star-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyReviewsTitle}>No Reviews Yet</Text>
          <Text style={styles.emptyReviewsSubtitle}>
            Be the first to leave a review for this provider!
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.reviewsList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderServiceItem = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    
    return (
      <TouchableOpacity 
        key={service.id} 
        style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
        onPress={() => handleServiceToggle(service)}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
          </View>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </View>
        {service.description && (
          <Text style={styles.serviceDescription}>{service.description}</Text>
        )}
        <View style={styles.serviceFooter}>
          <Text style={styles.serviceDuration}>
            {formatDuration(service.estimatedDurationMinutes)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBusinessHours = () => {
    if (!provider?.businessHours || provider.businessHours.length === 0) {
      return (
        <Text style={styles.noHoursText}>Business hours not available</Text>
      );
    }

    return (
      <View style={styles.businessHoursContainer}>
        {dayNames.map((day, index) => {
          const dayHours = provider.businessHours.find(bh => bh.dayOfWeek === index);
          return (
            <View key={day} style={styles.businessHourRow}>
              <Text style={styles.dayText}>{day}</Text>
              <Text style={styles.hoursText}>
                {dayHours?.isOpen 
                  ? `${formatTime(dayHours.openTime)} - ${formatTime(dayHours.closeTime)}`
                  : 'Closed'
                }
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTabContent = () => {
    if (!provider) return null;

    switch (selectedTab) {
      case 'services':
        if (isLoadingServices) {
          return (
            <View style={styles.tabContent}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.loadingText}>Loading services...</Text>
              </View>
            </View>
          );
        }
        
        if (services.length === 0) {
          return (
            <View style={styles.tabContent}>
              <View style={styles.emptyReviews}>
                <Ionicons name="list-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyReviewsTitle}>No Services Available</Text>
                <Text style={styles.emptyReviewsSubtitle}>
                  This provider hasn't added any services yet.
                </Text>
              </View>
            </View>
          );
        }
        
        return (
          <View style={styles.tabContent}>
            {/* AI Recommendations */}
            <AIBookingRecommendations
              providerId={provider.id}
              providerName={provider.fullName}
              services={services}
              selectedServices={selectedServices}
              onSelectService={handleSelectService}
              onSelectTimeSlot={handleSelectTimeSlot}
            />
            
            {/* Services List */}
            {services.filter(s => s.isActive).map(renderServiceItem)}
          </View>
        );
      
      case 'about':
        return (
          <View style={styles.tabContent}>
            {provider.bio && (
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>About</Text>
                <Text style={styles.aboutText}>{provider.bio}</Text>
              </View>
            )}
            
            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>Specialties</Text>
              <View style={styles.tagsContainer}>
                {provider.tags.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>Business Hours</Text>
              {renderBusinessHours()}
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>Contact</Text>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="call" size={20} color="#8b5cf6" />
                <Text style={styles.contactText}>{provider.phoneNumber}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="mail" size={20} color="#8b5cf6" />
                <Text style={styles.contactText}>{provider.email}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            {renderReviewsContent()}
          </View>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading provider details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Provider not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Provider Info */}
        <View style={styles.providerSection}>
          <Image
            source={{
              uri: provider.profilePictureUrl || 'https://via.placeholder.com/100x100?text=?',
            }}
            style={styles.providerImage}
          />
          
          <View style={styles.providerInfo}>
            <View style={styles.providerNameRow}>
              <Text style={styles.providerName}>{provider.fullName}</Text>
              {provider.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.ratingRow}>
              {renderStars(provider.averageRating)}
              <Text style={styles.ratingText}>
                {provider.averageRating} ({provider.totalReviews} reviews)
              </Text>
            </View>

            {provider.distance && (
              <Text style={styles.distanceText}>
                {provider.distance < 1 
                  ? `${Math.round(provider.distance * 1000)}m away`
                  : `${provider.distance.toFixed(1)}km away`
                }
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={handleMessageProvider}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#8b5cf6" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={handleDirections}
          >
            <Ionicons name="location-outline" size={20} color="#8b5cf6" />
            <Text style={styles.directionsButtonText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'services' && styles.activeTab]}
            onPress={() => setSelectedTab('services')}
          >
            <Text style={[styles.tabText, selectedTab === 'services' && styles.activeTabText]}>
              Services
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'about' && styles.activeTab]}
            onPress={() => setSelectedTab('about')}
          >
            <Text style={[styles.tabText, selectedTab === 'about' && styles.activeTabText]}>
              About
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'reviews' && styles.activeTab]}
            onPress={() => setSelectedTab('reviews')}
          >
            <Text style={[styles.tabText, selectedTab === 'reviews' && styles.activeTabText]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Floating Book Button */}
      {selectedServices.length > 0 && (
        <View style={styles.floatingBookButton}>
          <TouchableOpacity style={styles.bookFloatingButton} onPress={handleBookServices}>
            <Text style={styles.bookFloatingButtonText}>
              Book {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.bookFloatingButtonPrice}>
              ${selectedServices.reduce((total, service) => total + service.price, 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Booking Modal */}
      {provider && user && (
        <AdvancedBookingModal
          visible={isBookingModalVisible}
          onClose={() => setIsBookingModalVisible(false)}
          onSuccess={() => handleBookingSuccess({} as Appointment)}
          provider={provider}
          selectedServices={selectedServices}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  providerSection: {
    backgroundColor: 'white',
    margin: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    alignSelf: 'center',
  },
  providerInfo: {
    alignItems: 'center',
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  distanceText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  messageButtonText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  directionsButtonText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceCardSelected: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
    backgroundColor: '#f8faff',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutSection: {
    marginBottom: 24,
  },
  aboutSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  businessHoursContainer: {
    gap: 8,
  },
  businessHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 16,
    color: '#6b7280',
  },
  noHoursText: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 32,
  },
  floatingBookButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  bookFloatingButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookFloatingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bookFloatingButtonPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // Review styles
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  emptyReviews: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyReviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyReviewsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  reviewsList: {
    paddingBottom: 20,
  },
});

export default ProviderDetailScreen;
