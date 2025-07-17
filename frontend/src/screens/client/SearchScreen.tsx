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
import { useTheme } from '@/theme/ThemeProvider';
import { providerService } from '@/services/providerService';
import { locationService, LocationCoordinates } from '@/services/locationService';
import MapComponent, { MarkerData } from '@/components/shared/MapComponent';
import DarkModeToggle from '@/components/shared/DarkModeToggle';
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
  const { colors, typography, spacing } = useTheme();
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
      style={[styles.providerCard, { 
        backgroundColor: colors.background.secondary,
        borderColor: colors.primary,
        shadowColor: colors.shadow.light,
      }]}
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
          <View style={[styles.moreTagsIndicator, { backgroundColor: colors.background.tertiary }]}>
            <Text style={[styles.moreTagsText, { color: colors.text.secondary }]}>
              +{provider.tags.length - 4}
            </Text>
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
            <Text style={[styles.providerName, { color: colors.text.primary }]}>
              {provider.fullName}
            </Text>
            {provider.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.ratingRow}>
            {renderStars(provider.averageRating)}
            <Text style={[styles.ratingText, { color: colors.text.secondary }]}>
              {provider.averageRating} ({provider.totalReviews} reviews)
            </Text>
          </View>
          
          {provider.distance && (
            <Text style={[styles.distanceText, { color: colors.primary }]}>
              {formatDistance(provider.distance)}
            </Text>
          )}
        </View>
      </View>

      {provider.bio && (
        <Text style={[styles.providerBio, { color: colors.text.secondary }]} numberOfLines={2}>
          {provider.bio}
        </Text>
      )}

      {/* Enhanced Posts Preview with Scrollable View */}
      {provider.posts && provider.posts.length > 0 && (
        <View style={styles.postsPreview}>
          <View style={styles.postsPreviewHeader}>
            <Text style={[styles.postsPreviewTitle, { color: colors.text.primary }]}>
              Recent Work
            </Text>
            <Text style={[styles.postsCount, { color: colors.text.secondary }]}>
              {provider.posts.length} posts
            </Text>
          </View>
          
          <View style={styles.postsScrollContainer}>
            <FlatList
              data={provider.posts.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(post) => post.id.toString()}
              contentContainerStyle={styles.postsScrollContent}
              renderItem={({ item: post, index }) => (
                <TouchableOpacity 
                  style={[styles.postThumbnail, { 
                    backgroundColor: colors.background.tertiary,
                    borderColor: colors.border.primary,
                  }]}
                  onPress={() => {
                    // Future: Navigate to post detail or provider posts
                    navigation.navigate('ProviderDetail', { providerId: provider.id });
                  }}
                >
                  {post.media && post.media.length > 0 ? (
                    <Image
                      source={{ uri: post.media[0].url }}
                      style={styles.postThumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.postPlaceholder, { backgroundColor: colors.background.tertiary }]}>
                      <Ionicons name="image" size={20} color={colors.text.secondary} />
                    </View>
                  )}
                  
                  {/* Media indicators */}
                  {post.media && post.media[0]?.type === 'video' && (
                    <View style={styles.videoIndicator}>
                      <Ionicons name="play" size={12} color="white" />
                    </View>
                  )}
                  {post.media && post.media.length > 1 && (
                    <View style={styles.multipleMediaIndicator}>
                      <Ionicons name="copy" size={12} color="white" />
                    </View>
                  )}
                  
                  {/* Post engagement overlay */}
                  <View style={styles.postEngagement}>
                    <View style={styles.postEngagementItem}>
                      <Ionicons name="heart" size={10} color="white" />
                      <Text style={styles.postEngagementText}>
                        {Math.floor(Math.random() * 50) + 1}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
            
            {provider.posts.length > 6 && (
              <TouchableOpacity 
                style={[styles.viewAllPostsButton, { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                }]}
                onPress={() => navigation.navigate('ProviderDetail', { providerId: provider.id })}
              >
                <Text style={[styles.viewAllPostsText, { color: colors.text.inverse }]}>
                  View All
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.text.inverse} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Services and pricing */}
      {provider.services.length > 0 && (
        <View style={[styles.servicesPreview, { borderTopColor: colors.border.primary }]}>
          <Text style={[styles.servicePreviewText, { color: colors.status.success }]}>
            Starting from ${Math.min(...provider.services.map(s => s.price))}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.filterModal, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.filterHeader, { 
          backgroundColor: colors.background.secondary, 
          borderBottomColor: colors.border.primary 
        }]}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.filterCancelText, { color: colors.text.secondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.filterTitle, { color: colors.text.primary }]}>
            Filters
          </Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.filterApplyText, { color: colors.primary }]}>
              Apply
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterContent}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text.primary }]}>
              Sort By
            </Text>
            {['distance', 'rating', 'popularity'].map((sortOption) => (
              <TouchableOpacity
                key={sortOption}
                style={[styles.filterOption, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.primary,
                }]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: sortOption as any }))}
              >
                <Text style={[styles.filterOptionText, { color: colors.text.primary }]}>
                  {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
                </Text>
                {filters.sortBy === sortOption && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text.primary }]}>
              Minimum Rating
            </Text>
            {[0, 3, 4, 4.5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[styles.filterOption, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.primary,
                }]}
                onPress={() => setFilters(prev => ({ ...prev, minRating: rating }))}
              >
                <View style={styles.ratingFilterOption}>
                  <Text style={[styles.filterOptionText, { color: colors.text.primary }]}>
                    {rating === 0 ? 'Any Rating' : `${rating}+ Stars`}
                  </Text>
                  {rating > 0 && renderStars(rating)}
                </View>
                {filters.minRating === rating && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Find Providers</Text>
        <DarkModeToggle size={24} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search by name, service, or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.text.secondary}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={[styles.viewToggleContainer, { backgroundColor: colors.background.tertiary }]}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton, 
            { backgroundColor: colors.background.secondary, borderColor: colors.border.primary },
            viewMode === 'list' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={viewMode === 'list' ? colors.text.inverse : colors.primary} 
          />
          <Text style={[
            styles.viewToggleText, 
            { color: viewMode === 'list' ? colors.text.inverse : colors.primary }
          ]}>
            List
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewToggleButton, 
            { backgroundColor: colors.background.secondary, borderColor: colors.border.primary },
            viewMode === 'map' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={viewMode === 'map' ? colors.text.inverse : colors.primary} 
          />
          <Text style={[
            styles.viewToggleText, 
            { color: viewMode === 'map' ? colors.text.inverse : colors.primary }
          ]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Searching providers...
          </Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={providers}
          renderItem={renderProviderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: colors.background.primary }]}>
              <Ionicons name="search" size={64} color={colors.text.tertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
                No providers found
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.text.secondary }]}>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  providerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
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
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  providerBio: {
    fontSize: 14,
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
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  moreTagsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Enhanced Posts Preview Styles
  postsPreview: {
    marginBottom: 12,
  },
  postsPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postsPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  postsCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  postsScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postsScrollContent: {
    paddingRight: 8,
  },
  postThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 8,
    borderWidth: 1,
  },
  postThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  postPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 3,
  },
  multipleMediaIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 3,
  },
  postEngagement: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postEngagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  postEngagementText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  viewAllPostsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    minWidth: 80,
  },
  viewAllPostsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  servicesPreview: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  servicePreviewText: {
    fontSize: 16,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  filterModal: {
    flex: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterCancelText: {
    fontSize: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterApplyText: {
    fontSize: 16,
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
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 16,
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
    borderWidth: 1,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default SearchScreen;
