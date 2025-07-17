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
import { useTheme } from '@/theme/ThemeProvider';
import { providerService } from '@/services/providerService';
import { serviceService } from '@/services/serviceService';
import { chatService } from '@/services/chatService';
import { locationService } from '@/services/locationService';
import { ProviderProfile, Service, BusinessHours, dayNames, Appointment, UserRole } from '@/types';
import ComprehensiveBookingModal from '../../components/booking/ComprehensiveBookingModal';
import AIBookingRecommendations from '@/components/booking/AIBookingRecommendations';
import DarkModeToggle from '@/components/shared/DarkModeToggle';

type ProviderDetailRouteProp = RouteProp<
  { ProviderDetail: { providerId: number } },
  'ProviderDetail'
>;

const ProviderDetailScreen: React.FC = () => {
  const route = useRoute<ProviderDetailRouteProp>();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { colors, typography, spacing } = useTheme();
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
      // For now, use mock data since reviewService is not available
      const mockReviews = [
        {
          id: 1,
          appointmentId: 1,
          clientId: 1,
          providerId: provider.id,
          rating: 5,
          comment: "Great service! Very professional and friendly.",
          createdAt: new Date().toISOString(),
          client: {
            id: 1,
            fullName: "John Doe",
            profilePictureUrl: "https://via.placeholder.com/40x40?text=JD",
            role: UserRole.CLIENT,
            email: 'john@example.com',
            phoneNumber: '123-456-7890',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          provider: {
            ...provider,
            role: UserRole.PROVIDER,
            email: provider.email || 'provider@example.com',
            phoneNumber: provider.phoneNumber || '123-456-7890',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        {
          id: 2,
          appointmentId: 2,
          clientId: 2,
          providerId: provider.id,
          rating: 4,
          comment: "Good quality work, would recommend.",
          createdAt: new Date().toISOString(),
          client: {
            id: 2,
            fullName: "Jane Smith",
            profilePictureUrl: "https://via.placeholder.com/40x40?text=JS",
            role: UserRole.CLIENT,
            email: 'jane@example.com',
            phoneNumber: '123-456-7891',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          provider: {
            ...provider,
            role: UserRole.PROVIDER,
            email: provider.email || 'provider@example.com',
            phoneNumber: provider.phoneNumber || '123-456-7890',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      ];
      setReviews(mockReviews);
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
    <View style={[styles.reviewCard, { backgroundColor: colors.background.secondary }]}>
      <View style={styles.reviewHeader}>
        <Image
          source={{
            uri: review.client?.profilePictureUrl || 'https://via.placeholder.com/40x40?text=?',
          }}
          style={styles.reviewerImage}
        />
        <View style={styles.reviewerInfo}>
          <Text style={[styles.reviewerName, { color: colors.text.primary }]}>{review.client?.fullName || 'Anonymous'}</Text>
          <View style={styles.reviewRating}>
            {renderStars(review.rating)}
            <Text style={[styles.reviewDate, { color: colors.text.secondary }]}>
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      {review.comment && (
        <Text style={[styles.reviewComment, { color: colors.text.secondary }]}>{review.comment}</Text>
      )}
    </View>
  );

  const renderReviewsContent = () => {
    if (reviewsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading reviews...</Text>
        </View>
      );
    }

    if (reviews.length === 0) {
      return (
        <View style={styles.emptyReviews}>
          <Ionicons name="star-outline" size={48} color={colors.text.secondary} />
          <Text style={[styles.emptyReviewsTitle, { color: colors.text.primary }]}>No Reviews Yet</Text>
          <Text style={[styles.emptyReviewsSubtitle, { color: colors.text.secondary }]}>
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
        style={[
          styles.serviceCard, 
          { backgroundColor: colors.background.secondary, borderColor: colors.border.primary },
          isSelected && { borderColor: colors.primary, backgroundColor: colors.background.tertiary }
        ]}
        onPress={() => handleServiceToggle(service)}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={[styles.serviceName, { color: colors.text.primary }]}>{service.name}</Text>
            <Text style={[styles.servicePrice, { color: colors.accent }]}>${service.price.toFixed(2)}</Text>
          </View>
          <View style={[
            styles.checkbox, 
            { borderColor: colors.border.primary },
            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
            )}
          </View>
        </View>
        {service.description && (
          <Text style={[styles.serviceDescription, { color: colors.text.secondary }]}>{service.description}</Text>
        )}
        <View style={styles.serviceFooter}>
          <View style={styles.serviceDurationContainer}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.serviceDuration, { color: colors.primary }]}>
              {formatDuration(service.estimatedDurationMinutes)}
            </Text>
          </View>
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.selectedBadgeText, { color: colors.text.inverse }]}>Selected</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderBusinessHours = () => {
    if (!provider?.businessHours || provider.businessHours.length === 0) {
      return (
        <Text style={[styles.noHoursText, { color: colors.text.secondary }]}>Business hours not available</Text>
      );
    }

    return (
      <View style={styles.businessHoursContainer}>
        {dayNames.map((day, index) => {
          const dayHours = provider.businessHours.find(bh => bh.dayOfWeek === index);
          return (
            <View key={day} style={styles.businessHourRow}>
              <Text style={[styles.dayText, { color: colors.text.primary }]}>{day}</Text>
              <Text style={[styles.hoursText, { color: colors.text.secondary }]}>
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
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading services...</Text>
              </View>
            </View>
          );
        }
        
        if (services.length === 0) {
          return (
            <View style={styles.tabContent}>
              <View style={styles.emptyReviews}>
                <Ionicons name="list-outline" size={48} color={colors.text.secondary} />
                <Text style={[styles.emptyReviewsTitle, { color: colors.text.primary }]}>No Services Available</Text>
                <Text style={[styles.emptyReviewsSubtitle, { color: colors.text.secondary }]}>
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
                <Text style={[styles.aboutSectionTitle, { color: colors.text.primary }]}>About</Text>
                <Text style={[styles.aboutText, { color: colors.text.secondary }]}>{provider.bio}</Text>
              </View>
            )}
            
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutSectionTitle, { color: colors.text.primary }]}>Specialties</Text>
              <View style={styles.tagsContainer}>
                {provider.tags.map((tag) => (
                  <View key={tag.id} style={[styles.tag, { backgroundColor: colors.background.tertiary }]}>
                    <Text style={[styles.tagText, { color: colors.text.primary }]}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={[styles.aboutSectionTitle, { color: colors.text.primary }]}>Business Hours</Text>
              {renderBusinessHours()}
            </View>

            <View style={styles.aboutSection}>
              <Text style={[styles.aboutSectionTitle, { color: colors.text.primary }]}>Contact</Text>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="call" size={20} color={colors.primary} />
                <Text style={[styles.contactText, { color: colors.text.primary }]}>{provider.phoneNumber}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="mail" size={20} color={colors.primary} />
                <Text style={[styles.contactText, { color: colors.text.primary }]}>{provider.email}</Text>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading provider details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.status.error }]}>Provider not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.favoriteButton, { backgroundColor: colors.background.secondary }]}>
            <Ionicons name="heart-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <DarkModeToggle size={24} style={styles.darkModeToggle} />
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Provider Info */}
        <View style={[styles.providerSection, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.providerImageContainer}>
            <Image
              source={{
                uri: provider.profilePictureUrl || 'https://via.placeholder.com/100x100?text=?',
              }}
              style={styles.providerImage}
            />
            {provider.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: colors.accent }]} />}
          </View>
          
          <View style={styles.providerInfo}>
            <Text style={[styles.providerName, { color: colors.text.primary }]}>{provider.fullName}</Text>
            
            <View style={styles.ratingRow}>
              {renderStars(provider.averageRating)}
              <Text style={[styles.ratingText, { color: colors.text.secondary }]}>
                {provider.averageRating} ({provider.totalReviews} reviews)
              </Text>
            </View>

            {provider.distance && (
              <View style={styles.distanceRow}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={[styles.distanceText, { color: colors.primary }]}>
                  {provider.distance < 1 
                    ? `${Math.round(provider.distance * 1000)}m away`
                    : `${provider.distance.toFixed(1)}km away`
                  }
                </Text>
              </View>
            )}

            {/* Service Tags Preview */}
            <View style={styles.tagsPreview}>
              {provider.tags.slice(0, 3).map((tag) => (
                <View key={tag.id} style={[styles.tagChip, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.tagChipText, { color: colors.text.inverse }]}>{tag.name}</Text>
                </View>
              ))}
              {provider.tags.length > 3 && (
                <Text style={[styles.moreTagsText, { color: colors.text.secondary }]}>
                  +{provider.tags.length - 3} more
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.messageButton, { backgroundColor: colors.background.secondary, borderColor: colors.primary }]}
            onPress={handleMessageProvider}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            <Text style={[styles.messageButtonText, { color: colors.primary }]}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.directionsButton, { backgroundColor: colors.background.secondary, borderColor: colors.primary }]}
            onPress={handleDirections}
          >
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={[styles.directionsButtonText, { color: colors.primary }]}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.background.secondary }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'services' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('services')}
          >
            <Text style={[
              styles.tabText,
              { color: colors.text.primary },
              selectedTab === 'services' && { color: colors.text.inverse }
            ]}>
              Services
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'about' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('about')}
          >
            <Text style={[
              styles.tabText,
              { color: colors.text.primary },
              selectedTab === 'about' && { color: colors.text.inverse }
            ]}>
              About
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'reviews' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('reviews')}
          >
            <Text style={[
              styles.tabText,
              { color: colors.text.primary },
              selectedTab === 'reviews' && { color: colors.text.inverse }
            ]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Floating Book Button */}
      {selectedServices.length > 0 && (
        <View style={[styles.floatingBookButton, { backgroundColor: colors.background.secondary }]}>
          <TouchableOpacity style={[styles.bookFloatingButton, { backgroundColor: colors.primary }]} onPress={handleBookServices}>
            <Text style={[styles.bookFloatingButtonText, { color: colors.text.inverse }]}>
              Book {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''}
            </Text>
            <Text style={[styles.bookFloatingButtonPrice, { color: colors.text.inverse }]}>
              ${selectedServices.reduce((total, service) => total + service.price, 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Booking Modal */}
      {provider && user && (
        <ComprehensiveBookingModal
          visible={isBookingModalVisible}
          onClose={() => setIsBookingModalVisible(false)}
          onSuccess={(booking) => {
            console.log('Booking created:', booking);
            setIsBookingModalVisible(false);
            setSelectedServices([]);
            // You can add notification or navigation logic here
          }}
          provider={provider as any} // Cast to User type since it has the required properties
          selectedServices={selectedServices}
          clientId={user.id}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  darkModeToggle: {
    // Additional margin if needed
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
  providerImageContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
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
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
    marginLeft: 4,
  },
  tagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 12,
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
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
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
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
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
  serviceDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
