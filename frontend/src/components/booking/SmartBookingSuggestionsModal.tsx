import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { aiBookingService, PersonalizedBookingFlow } from '@/services/aiBookingService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientSearchStackParamList } from '@/types';

const { width } = Dimensions.get('window');

interface SmartBookingSuggestionsModalProps {
  visible: boolean;
  onClose: () => void;
  onBookService: (providerId: number) => void;
}

type NavigationProp = StackNavigationProp<ClientSearchStackParamList, 'SearchHome'>;

const SmartBookingSuggestionsModal: React.FC<SmartBookingSuggestionsModalProps> = ({
  visible,
  onClose,
  onBookService,
}) => {
  const { token } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [bookingFlow, setBookingFlow] = useState<PersonalizedBookingFlow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && token) {
      loadSmartSuggestions();
    }
  }, [visible, token]);

  const loadSmartSuggestions = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const flow = await aiBookingService.getPersonalizedBookingFlow(token, {
        // Basic request for general recommendations
        maxPrice: 200,
        maxDistance: 25,
      });
      setBookingFlow(flow);
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
      Alert.alert('Error', 'Failed to load smart suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRecommendation = (providerId: number) => {
    onClose();
    onBookService(providerId);
  };

  const handleUseAIAssistant = () => {
    onClose();
    navigation.navigate('AIBooking');
  };

  const renderRecommendationCard = (recommendation: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.recommendationCard}
      onPress={() => handleBookRecommendation(recommendation.providerId)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.providerInfo}>
          {recommendation.providerImage && (
            <Image
              source={{ uri: recommendation.providerImage }}
              style={styles.providerImage}
            />
          )}
          <View style={styles.providerDetails}>
            <Text style={styles.serviceName}>{recommendation.serviceName}</Text>
            <Text style={styles.providerName}>{recommendation.providerName}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>
                {recommendation.rating} ({recommendation.reviewCount})
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${recommendation.estimatedPrice}</Text>
          <Text style={styles.duration}>{recommendation.estimatedDuration}m</Text>
        </View>
      </View>
      
      <Text style={styles.reason}>{recommendation.reason}</Text>
      
      {recommendation.specialOffers && recommendation.specialOffers.length > 0 && (
        <View style={styles.offerBanner}>
          <Ionicons name="flash" size={14} color="#fff" />
          <Text style={styles.offerText}>
            {recommendation.specialOffers[0].title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={24} color="#FF6B9D" />
            <Text style={styles.headerTitle}>Smart Suggestions</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B9D" />
              <Text style={styles.loadingText}>Finding perfect services for you...</Text>
            </View>
          ) : (
            <>
              {/* AI Assistant CTA */}
              <TouchableOpacity
                style={styles.aiAssistantCard}
                onPress={handleUseAIAssistant}
              >
                <View style={styles.aiAssistantContent}>
                  <View style={styles.aiAssistantIcon}>
                    <Ionicons name="flash" size={24} color="#fff" />
                  </View>
                  <View style={styles.aiAssistantText}>
                    <Text style={styles.aiAssistantTitle}>AI Booking Assistant</Text>
                    <Text style={styles.aiAssistantSubtitle}>
                      Get personalized recommendations based on your preferences
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#FF6B9D" />
                </View>
              </TouchableOpacity>

              {/* Quick Tips */}
              {bookingFlow && bookingFlow.bookingTips.length > 0 && (
                <View style={styles.tipsSection}>
                  <Text style={styles.sectionTitle}>💡 Quick Tips</Text>
                  <View style={styles.tipsContainer}>
                    {bookingFlow.bookingTips.slice(0, 3).map((tip, index) => (
                      <Text key={index} style={styles.tipText}>
                        • {tip}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Recommended Services */}
              {bookingFlow && bookingFlow.recommendedServices.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recommended for You</Text>
                  {bookingFlow.recommendedServices
                    .slice(0, 4)
                    .map((recommendation, index) => renderRecommendationCard(recommendation, index))}
                </View>
              )}

              {/* Trending Now */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
                <View style={styles.trendingContainer}>
                  <View style={styles.trendingItem}>
                    <Text style={styles.trendingEmoji}>💄</Text>
                    <Text style={styles.trendingName}>Makeup & Beauty</Text>
                  </View>
                  <View style={styles.trendingItem}>
                    <Text style={styles.trendingEmoji}>💅</Text>
                    <Text style={styles.trendingName}>Nail Art</Text>
                  </View>
                  <View style={styles.trendingItem}>
                    <Text style={styles.trendingEmoji}>💪</Text>
                    <Text style={styles.trendingName}>Fitness Training</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => {
              onClose();
              // Navigate to search screen
            }}
          >
            <Text style={styles.exploreButtonText}>Explore All Services</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  aiAssistantCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#FF6B9D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiAssistantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAssistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B9D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiAssistantText: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  aiAssistantSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipsSection: {
    marginVertical: 16,
  },
  tipsContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  providerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  providerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 2,
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  reason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  offerText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  trendingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingItem: {
    alignItems: 'center',
  },
  trendingEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  trendingName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  exploreButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SmartBookingSuggestionsModal;
