import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { aiBookingService, ServiceRecommendation, TimeSlotRecommendation } from '@/services/aiBookingService';
import { Service } from '@/types';

interface AIBookingRecommendationsProps {
  providerId: number;
  providerName: string;
  services: Service[];
  onSelectService: (serviceId: number) => void;
  onSelectTimeSlot: (timeSlot: string) => void;
  selectedServices: Service[];
}

const AIBookingRecommendations: React.FC<AIBookingRecommendationsProps> = ({
  providerId,
  providerName,
  services,
  onSelectService,
  onSelectTimeSlot,
  selectedServices,
}) => {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
  const [timeSlotRecommendations, setTimeSlotRecommendations] = useState<TimeSlotRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    if (showRecommendations && token) {
      loadRecommendations();
    }
  }, [showRecommendations, token]);

  const loadRecommendations = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const [serviceRecs, timeSlotRecs] = await Promise.all([
        aiBookingService.getServiceRecommendations(token, {
          preferredProviderIds: [providerId],
        }),
        selectedServices.length > 0 
          ? aiBookingService.getTimeSlotRecommendations(token, selectedServices[0].id, providerId)
          : Promise.resolve([])
      ]);

      setRecommendations(serviceRecs.filter(rec => rec.providerId === providerId));
      setTimeSlotRecommendations(timeSlotRecs);
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetOptimalPrice = async (serviceId: number) => {
    if (!token) return;
    
    try {
      const pricing = await aiBookingService.getPricingOptimization(
        token,
        serviceId,
        providerId,
        new Date().toISOString()
      );
      
      Alert.alert(
        'AI Price Optimization',
        `Original Price: $${pricing.originalPrice}\n` +
        `Optimized Price: $${pricing.optimizedPrice}\n` +
        `You save: $${pricing.savingsAmount} (${pricing.savingsPercentage}%)\n\n` +
        `Reason: ${pricing.reason}`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get price optimization');
    }
  };

  const renderServiceRecommendation = ({ item }: { item: ServiceRecommendation }) => (
    <TouchableOpacity
      style={styles.recommendationCard}
      onPress={() => onSelectService(item.serviceId)}
    >
      <View style={styles.recommendationHeader}>
        <View style={styles.recommendationInfo}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.recommendationReason}>{item.reason}</Text>
        </View>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>
            {Math.round(item.confidence * 100)}%
          </Text>
        </View>
      </View>
      
      <View style={styles.serviceDetails}>
        <View style={styles.serviceDetail}>
          <Ionicons name="cash-outline" size={16} color="#4CAF50" />
          <Text style={styles.serviceDetailText}>${item.estimatedPrice}</Text>
        </View>
        <View style={styles.serviceDetail}>
          <Ionicons name="time-outline" size={16} color="#2196F3" />
          <Text style={styles.serviceDetailText}>{item.estimatedDuration} min</Text>
        </View>
        <View style={styles.serviceDetail}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.serviceDetailText}>{item.rating}</Text>
        </View>
      </View>

      {item.specialOffers && item.specialOffers.length > 0 && (
        <View style={styles.offerContainer}>
          <Ionicons name="pricetag" size={16} color="#f44336" />
          <Text style={styles.offerText}>
            {item.specialOffers[0].title}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.priceOptimizationButton}
        onPress={() => handleGetOptimalPrice(item.serviceId)}
      >
        <Ionicons name="flash" size={16} color="#FF6B9D" />
        <Text style={styles.priceOptimizationText}>Get Best Price</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTimeSlotRecommendation = ({ item }: { item: TimeSlotRecommendation }) => (
    <TouchableOpacity
      style={styles.timeSlotCard}
      onPress={() => onSelectTimeSlot(item.datetime)}
    >
      <Text style={styles.timeSlotDate}>
        {new Date(item.datetime).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })}
      </Text>
      <Text style={styles.timeSlotTime}>
        {new Date(item.datetime).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        })}
      </Text>
      <Text style={styles.timeSlotReason}>{item.reason}</Text>
      <View style={[
        styles.availabilityBadge,
        { backgroundColor: getAvailabilityColor(item.providerAvailability) }
      ]}>
        <Text style={styles.availabilityText}>
          {item.providerAvailability}
        </Text>
      </View>
      <View style={styles.priceMultiplierContainer}>
        <Text style={styles.priceMultiplierText}>
          {item.priceMultiplier > 1 ? '+' : ''}{((item.priceMultiplier - 1) * 100).toFixed(0)}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#f44336';
      default: return '#6b7280';
    }
  };

  if (!showRecommendations) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => setShowRecommendations(true)}
        >
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.aiButtonText}>Get AI Recommendations</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color="#FF6B9D" />
        <Text style={styles.headerTitle}>AI Recommendations</Text>
        <TouchableOpacity onPress={() => setShowRecommendations(false)}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B9D" />
          <Text style={styles.loadingText}>Getting personalized recommendations...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Service Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended Services</Text>
              <FlatList
                data={recommendations}
                renderItem={renderServiceRecommendation}
                keyExtractor={(item) => item.serviceId.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Time Slot Recommendations */}
          {timeSlotRecommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Best Time Slots</Text>
              <FlatList
                data={timeSlotRecommendations}
                renderItem={renderTimeSlotRecommendation}
                keyExtractor={(item) => item.datetime}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timeSlotList}
              />
            </View>
          )}

          {/* AI Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>💡 Smart Tips</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                • Book morning slots for better availability and pricing
              </Text>
              <Text style={styles.tipText}>
                • Consider bundling services for potential discounts
              </Text>
              <Text style={styles.tipText}>
                • {providerName} has higher ratings for weekend appointments
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 16,
    overflow: 'hidden',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 20,
    margin: 16,
    borderRadius: 12,
  },
  aiButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    marginBottom: 8,
  },
  offerText: {
    fontSize: 12,
    color: '#f44336',
    marginLeft: 4,
    fontWeight: '600',
  },
  priceOptimizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FF6B9D',
  },
  priceOptimizationText: {
    fontSize: 14,
    color: '#FF6B9D',
    fontWeight: '600',
    marginLeft: 4,
  },
  timeSlotList: {
    paddingLeft: 16,
  },
  timeSlotCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeSlotDate: {
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
  availabilityBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  availabilityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priceMultiplierContainer: {
    alignItems: 'center',
  },
  priceMultiplierText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  tipsSection: {
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default AIBookingRecommendations;
