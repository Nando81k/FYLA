import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { providerService } from '@/services/providerService';
import { locationService, LocationCoordinates } from '@/services/locationService';
import MapComponent, { MarkerData } from '@/components/shared/MapComponent';
import {
  ProviderProfile,
  ProviderSearchRequest,
  FilterOptions,
  ServiceProviderTag,
} from '@/types';

type SearchNavigationProp = StackNavigationProp<any>;

// Tag color schemes for better visibility
const tagColors = [
  { bg: '#EEF2FF', text: '#3730A3' }, // Indigo
  { bg: '#F0F9FF', text: '#0369A1' }, // Sky
  { bg: '#ECFDF5', text: '#059669' }, // Emerald
  { bg: '#FEF3C7', text: '#D97706' }, // Amber
  { bg: '#FCE7F3', text: '#BE185D' }, // Pink
  { bg: '#F3E8FF', text: '#7C3AED' }, // Violet
  { bg: '#FEF2F2', text: '#DC2626' }, // Red
  { bg: '#F0FDF4', text: '#16A34A' }, // Green
];

const getTagColor = (index: number) => tagColors[index % tagColors.length].bg;
const getTagTextColor = (index: number) => tagColors[index % tagColors.length].text;

const SearchScreen: React.FC = () => {
  const { token } = useAuth();
  const navigation = useNavigation<SearchNavigationProp>();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<ServiceProviderTag[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    maxDistance: 25,
    minRating: 0,
    sortBy: 'distance',
  });

  useEffect(() => {
    loadInitialData();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2 || searchQuery.length === 0) {
      const timeoutId = setTimeout(() => {
        searchProviders();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, filters]);

  const loadInitialData = async () => {
    try {
      // Load available tags for filtering
      const tags = await providerService.getServiceProviderTags();
      setAvailableTags(tags);
      
      // Load initial providers
      searchProviders();
    } catch (error) {
      console.warn('Failed to load initial data:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location.coordinates);
      }
    } catch (error) {
      console.warn('Failed to get current location:', error);
    }
  };

  const searchProviders = async () => {
    setIsLoading(true);
    try {
      const searchRequest: ProviderSearchRequest = {
        query: searchQuery || undefined,
        tags: filters.tags.map(tag => tag.id),
        minRating: filters.minRating || undefined,
        sortBy: filters.sortBy,
        limit: 20,
      };

      // Using feature flag-aware provider search
      const response = await providerService.searchProviders(searchRequest);
      setProviders(response.providers);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to search providers'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const prepareMapMarkers = (): MarkerData[] => {
    return providers
      .filter(provider => provider.locationLat && provider.locationLng)
      .map(provider => ({
        id: provider.id.toString(),
        coordinate: {
          latitude: provider.locationLat!,
          longitude: provider.locationLng!,
        },
        title: provider.fullName,
        description: provider.bio || 'No description available',
        color: '#8b5cf6',
      }));
  };

  const handleMarkerPress = (marker: MarkerData) => {
    const providerId = parseInt(marker.id);
    navigation.navigate('ProviderDetail', { providerId });
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
            size={14}
            color="#fbbf24"
          />
        ))}
      </View>
    );
  };

  const renderProviderCard = ({ item: provider }: { item: ProviderProfile }) => (
    <TouchableOpacity 
      style={styles.providerCard}
      onPress={() => navigation.navigate('ProviderDetail', { providerId: provider.id })}
    >
      {/* Tags at the top for better visibility */}
      <View style={styles.tagsContainer}>
        {provider.tags.slice(0, 4).map((tag, index) => (
          <View 
            key={tag.id} 
            style={[
              styles.tag,
              { backgroundColor: getTagColor(index) }
            ]}
          >
            <Text style={[styles.tagText, { color: getTagTextColor(index) }]}>
              {tag.name}
            </Text>
          </View>
        ))}
        {provider.tags.length > 4 && (
          <View style={styles.moreTagsIndicator}>
            <Text style={styles.moreTagsText}>+{provider.tags.length - 4}</Text>
          </View>
        )}
      </View>

      <View style={styles.providerHeader}>
        <Image
          source={{
            uri: provider.profilePictureUrl || 'https://via.placeholder.com/60x60?text=?',
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
            <Text style={styles.distanceText}>{formatDistance(provider.distance)}</Text>
          )}
        </View>
      </View>

      {provider.bio && (
        <Text style={styles.providerBio} numberOfLines={2}>
          {provider.bio}
        </Text>
      )}

      {/* Posts Preview */}
      {provider.posts && provider.posts.length > 0 && (
        <View style={styles.postsPreview}>
          <Text style={styles.postsPreviewTitle}>Recent Work</Text>
          <View style={styles.postsGrid}>
            {provider.posts.slice(0, 3).map((post, index) => (
              <View key={post.id} style={styles.postThumbnail}>
                <Image
                  source={{ uri: post.media[0]?.url }}
                  style={styles.postThumbnailImage}
                  resizeMode="cover"
                />
                {post.media[0]?.type === 'video' && (
                  <View style={styles.videoIndicator}>
                    <Ionicons name="play" size={12} color="white" />
                  </View>
                )}
                {post.media.length > 1 && (
                  <View style={styles.multipleMediaIndicator}>
                    <Ionicons name="copy" size={12} color="white" />
                  </View>
                )}
              </View>
            ))}
            {provider.posts.length > 3 && (
              <View style={styles.morePostsIndicator}>
                <Text style={styles.morePostsText}>+{provider.posts.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {provider.services.length > 0 && (
        <View style={styles.servicesPreview}>
          <Text style={styles.servicePreviewText}>
            Starting from ${Math.min(...provider.services.map(s => s.price))}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.filterCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.filterApplyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            {['distance', 'rating', 'popularity'].map((sortOption) => (
              <TouchableOpacity
                key={sortOption}
                style={styles.filterOption}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: sortOption as any }))}
              >
                <Text style={styles.filterOptionText}>
                  {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
                </Text>
                {filters.sortBy === sortOption && (
                  <Ionicons name="checkmark" size={20} color="#8b5cf6" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            {[0, 3, 4, 4.5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.filterOption}
                onPress={() => setFilters(prev => ({ ...prev, minRating: rating }))}
              >
                <View style={styles.ratingFilterOption}>
                  <Text style={styles.filterOptionText}>
                    {rating === 0 ? 'Any Rating' : `${rating}+ Stars`}
                  </Text>
                  {rating > 0 && renderStars(rating)}
                </View>
                {filters.minRating === rating && (
                  <Ionicons name="checkmark" size={20} color="#8b5cf6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Providers</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, service, or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={viewMode === 'list' ? '#ffffff' : '#8b5cf6'} 
          />
          <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'map' && styles.viewToggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={viewMode === 'map' ? '#ffffff' : '#8b5cf6'} 
          />
          <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Searching providers...</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={providers}
          renderItem={renderProviderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No providers found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Try adjusting your search criteria or filters
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.mapContainer}>
          <MapComponent
            markers={prepareMapMarkers()}
            onMarkerPress={handleMarkerPress}
            showUserLocation={true}
            style={styles.map}
          />
        </View>
      )}

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
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
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  providerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  distanceText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  providerBio: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreTagsIndicator: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Posts Preview Styles
  postsPreview: {
    marginBottom: 12,
  },
  postsPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  postsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  postThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  postThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 2,
  },
  multipleMediaIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 2,
  },
  morePostsIndicator: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  morePostsText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  servicesPreview: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  servicePreviewText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  filterModal: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  filterCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  filterApplyText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  ratingFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8b5cf6',
  },
  viewToggleTextActive: {
    color: '#ffffff',
  },
  mapContainer: {
    flex: 1,
    margin: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

export default SearchScreen;
