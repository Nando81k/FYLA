import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ScrollView,
  Dimensions,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { searchService } from '@/services/searchService';
import { locationService, LocationCoordinates } from '@/services/locationService';
import MapComponent, { MarkerData } from '@/components/shared/MapComponent';
import SearchFilterModal from '@/components/search/SearchFilterModal';
import SmartBookingSuggestionsModal from '@/components/booking/SmartBookingSuggestionsModal';
import {
  SearchRequest,
  SearchResponse,
  SearchSuggestion,
  RecentSearch,
  SavedSearch,
  SearchFilters,
  ContentSearchResult,
  UserSearchResult,
  LocationSearchResult,
} from '@/types/search';
import { ProviderProfile, ServiceProviderTag } from '@/types';
import { ClientSearchStackParamList } from '@/types';

type SearchNavigationProp = StackNavigationProp<ClientSearchStackParamList>;

const { width: screenWidth } = Dimensions.get('window');

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

const EnhancedSearchScreen: React.FC = () => {
  const { token, user } = useAuth();
  const navigation = useNavigation<SearchNavigationProp>();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'search' | 'discover'>('discover');
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'providers' | 'content' | 'users'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Data state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchSuggestion[]>([]);
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance'
  });
  
  // Expanded posts state
  const [expandedProvider, setExpandedProvider] = useState<ProviderProfile | null>(null);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        if (searchQuery.length >= 2) {
          loadSuggestions();
          setShowSuggestions(true);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [searchQuery]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadRecentSearches(),
        loadSavedSearches(),
        loadTrendingSearches(),
        getCurrentLocation(),
      ]);
    } catch (error) {
      console.warn('Failed to load initial data:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const recent = await searchService.getRecentSearches();
      setRecentSearches(recent);
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const saved = await searchService.getSavedSearches();
      setSavedSearches(saved);
    } catch (error) {
      console.warn('Failed to load saved searches:', error);
    }
  };

  const loadTrendingSearches = async () => {
    try {
      const trending = await searchService.getTrendingSearches();
      setTrendingSearches(trending);
    } catch (error) {
      console.warn('Failed to load trending searches:', error);
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

  const loadSuggestions = async () => {
    try {
      const newSuggestions = await searchService.getSearchSuggestions(searchQuery);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.warn('Failed to load suggestions:', error);
    }
  };

  const performSearch = async (query: string = searchQuery, searchFilters: SearchFilters = filters) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchMode('search');
    setShowSuggestions(false);

    try {
      const searchRequest: SearchRequest = {
        query: query.trim(),
        type: activeTab === 'all' ? undefined : activeTab,
        filters: searchFilters,
        location: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: searchFilters.distance?.max || 25
        } : undefined,
        pagination: {
          page: 1,
          limit: 20
        }
      };

      const response = await searchService.universalSearch(searchRequest);
      setSearchResults(response);
      
      // Reload recent searches to include this one
      await loadRecentSearches();
    } catch (error) {
      Alert.alert(
        'Search Error',
        error instanceof Error ? error.message : 'Failed to perform search'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.query);
    performSearch(suggestion.query);
  };

  const handleRecentSearchPress = (recent: RecentSearch) => {
    setSearchQuery(recent.query);
    if (recent.filters) {
      setFilters(recent.filters);
    }
    performSearch(recent.query);
  };

  const clearRecentSearches = async () => {
    try {
      await searchService.clearRecentSearches();
      setRecentSearches([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear recent searches');
    }
  };

  const saveCurrentSearch = async () => {
    if (!searchQuery.trim() || !searchResults) return;

    try {
      const savedSearch = await searchService.saveSearch({
        name: searchQuery.trim(),
        query: searchQuery.trim(),
        filters,
        location: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: filters.distance?.max || 25
        } : undefined,
        notifyOnNew: false,
        isActive: true
      });

      setSavedSearches(prev => [savedSearch, ...prev]);
      Alert.alert('Saved', 'Search has been saved to your collection');
    } catch (error) {
      Alert.alert('Error', 'Failed to save search');
    }
  };

  const removeSavedSearch = async (id: string) => {
    try {
      await searchService.removeSavedSearch(id);
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to remove saved search');
    }
  };

  const prepareMapMarkers = (): MarkerData[] => {
    if (!searchResults) return [];

    return searchResults.providers
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

  const filteredResults = useMemo(() => {
    if (!searchResults) return null;

    switch (activeTab) {
      case 'providers':
        return { ...searchResults, content: [], users: [], locations: [] };
      case 'content':
        return { ...searchResults, providers: [], users: [], locations: [] };
      case 'users':
        return { ...searchResults, providers: [], content: [], locations: [] };
      default:
        return searchResults;
    }
  }, [searchResults, activeTab]);

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
            <Text style={styles.distanceText}>
              {provider.distance < 1 
                ? `${Math.round(provider.distance * 1000)}m away`
                : `${provider.distance.toFixed(1)}km away`
              }
            </Text>
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
          <View style={styles.postsPreviewHeader}>
            <Text style={styles.postsPreviewTitle}>Recent Work</Text>
            <TouchableOpacity
              onPress={() => handleExpandPosts(provider)}
              style={styles.expandPostsButton}
            >
              <Text style={styles.expandPostsText}>
                View all {provider.posts.length}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.postsScrollView}
            contentContainerStyle={styles.postsScrollContent}
          >
            {provider.posts.map((post, index) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postThumbnail}
                onPress={() => handleExpandPosts(provider)}
              >
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
              </TouchableOpacity>
            ))}
          </ScrollView>
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

  const renderContentCard = ({ item: content }: { item: ContentSearchResult }) => (
    <TouchableOpacity 
      style={styles.contentCard}
      onPress={() => navigation.navigate('PostDetail', { postId: content.id })}
    >
      <View style={styles.contentHeader}>
        <Image
          source={{
            uri: content.authorProfilePicture || 'https://via.placeholder.com/40x40?text=?',
          }}
          style={styles.contentAuthorImage}
        />
        <View style={styles.contentAuthorInfo}>
          <Text style={styles.contentAuthorName}>{content.authorName}</Text>
          <Text style={styles.contentType}>{content.type}</Text>
        </View>
      </View>

      {content.media.length > 0 && (
        <Image
          source={{ uri: content.media[0].thumbnailUrl || content.media[0].url }}
          style={styles.contentImage}
          resizeMode="cover"
        />
      )}

      {content.caption && (
        <Text style={styles.contentCaption} numberOfLines={2}>
          {content.caption}
        </Text>
      )}

      <View style={styles.contentStats}>
        <View style={styles.contentStat}>
          <Ionicons name="heart" size={14} color="#ef4444" />
          <Text style={styles.contentStatText}>{content.likesCount}</Text>
        </View>
        <View style={styles.contentStat}>
          <Ionicons name="chatbubble" size={14} color="#6b7280" />
          <Text style={styles.contentStatText}>{content.commentsCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserCard = ({ item: userResult }: { item: UserSearchResult }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => navigation.navigate('UserProfile', { userId: userResult.id })}
    >
      <Image
        source={{
          uri: userResult.profilePictureUrl || 'https://via.placeholder.com/60x60?text=?',
        }}
        style={styles.userImage}
      />
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{userResult.fullName}</Text>
          {userResult.isServiceProvider && (
            <View style={styles.providerBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            </View>
          )}
        </View>
        
        {userResult.bio && (
          <Text style={styles.userBio} numberOfLines={1}>
            {userResult.bio}
          </Text>
        )}

        <View style={styles.userStats}>
          <Text style={styles.userStat}>{userResult.stats.postsCount} posts</Text>
          <Text style={styles.userStat}>{userResult.stats.followersCount} followers</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>
          {userResult.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={styles.suggestionContent}>
        <Ionicons 
          name={item.type === 'trending' ? 'trending-up' : 'search'} 
          size={16} 
          color="#6b7280" 
        />
        <Text style={styles.suggestionText}>{item.query}</Text>
      </View>
      {item.count && (
        <Text style={styles.suggestionCount}>{item.count}</Text>
      )}
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }: { item: RecentSearch }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchPress(item)}
    >
      <View style={styles.recentSearchContent}>
        <Ionicons name="time" size={16} color="#6b7280" />
        <Text style={styles.recentSearchText}>{item.query}</Text>
      </View>
      <TouchableOpacity
        onPress={async () => {
          try {
            await searchService.removeRecentSearch(item.id);
            setRecentSearches(prev => prev.filter(s => s.id !== item.id));
          } catch (error) {
            // Handle error silently
          }
        }}
      >
        <Ionicons name="close" size={16} color="#6b7280" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderDiscoverSection = () => {
    if (searchMode === 'search') return null;

    return (
      <ScrollView style={styles.discoverContainer} showsVerticalScrollIndicator={false}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.discoverSection}>
            <View style={styles.discoverSectionHeader}>
              <Text style={styles.discoverSectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.discoverSectionAction}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((item, index) => (
              <View key={`recent-${index}`}>
                {renderRecentSearch({ item })}
              </View>
            ))}
          </View>
        )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <View style={styles.discoverSection}>
            <View style={styles.discoverSectionHeader}>
              <Text style={styles.discoverSectionTitle}>Saved Searches</Text>
            </View>
            {savedSearches.map((item, index) => (
              <View key={`saved-${index}`}>
                <TouchableOpacity
                  style={styles.savedSearchItem}
                  onPress={() => {
                    setSearchQuery(item.query);
                    if (item.filters) setFilters(item.filters);
                    performSearch(item.query);
                  }}
                >
                  <View style={styles.savedSearchContent}>
                    <Ionicons name="bookmark" size={16} color="#8b5cf6" />
                    <View>
                      <Text style={styles.savedSearchName}>{item.name}</Text>
                      <Text style={styles.savedSearchQuery}>{item.query}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeSavedSearch(item.id)}>
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Trending Searches */}
        {trendingSearches.length > 0 && (
          <View style={styles.discoverSection}>
            <View style={styles.discoverSectionHeader}>
              <Text style={styles.discoverSectionTitle}>Trending Now</Text>
            </View>
            {trendingSearches.map((item, index) => (
              <View key={`trending-${index}`}>
                <TouchableOpacity
                  style={styles.trendingItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <View style={styles.trendingContent}>
                    <Ionicons name="trending-up" size={16} color="#10b981" />
                    <Text style={styles.trendingText}>{item.query}</Text>
                  </View>
                  <Text style={styles.trendingCount}>{item.count || '0'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Quick Categories */}
        <View style={styles.discoverSection}>
          <Text style={styles.discoverSectionTitle}>Browse Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesContainer}>
              {[
                { name: 'Hair', icon: 'cut', query: 'hair stylist' },
                { name: 'Nails', icon: 'hand-left', query: 'nail artist' },
                { name: 'Makeup', icon: 'brush', query: 'makeup artist' },
                { name: 'Massage', icon: 'hand-right', query: 'massage therapy' },
                { name: 'Skincare', icon: 'leaf', query: 'skincare' },
                { name: 'Eyebrows', icon: 'eye', query: 'eyebrow threading' }
              ].map((category) => (
                <TouchableOpacity
                  key={category.name}
                  style={styles.categoryItem}
                  onPress={() => {
                    setSearchQuery(category.query);
                    performSearch(category.query);
                  }}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name={category.icon as any} size={24} color="#8b5cf6" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    );
  };

  const renderSearchResults = () => {
    if (!filteredResults || isLoading) return null;

    const hasResults = filteredResults.providers.length > 0 || 
                      filteredResults.content.length > 0 || 
                      filteredResults.users.length > 0;

    if (!hasResults) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No results found</Text>
          <Text style={styles.emptyStateSubtitle}>
            Try adjusting your search terms or filters
          </Text>
        </View>
      );
    }

    if (viewMode === 'map' && filteredResults.providers.length > 0) {
      return (
        <View style={styles.mapContainer}>
          <MapComponent
            markers={prepareMapMarkers()}
            onMarkerPress={(marker) => {
              const providerId = parseInt(marker.id);
              navigation.navigate('ProviderDetail', { providerId });
            }}
            showUserLocation={true}
            style={styles.map}
          />
        </View>
      );
    }

    const sections = [
      ...(filteredResults.providers.length > 0 ? [{ type: 'provider', title: `Providers (${filteredResults.providers.length})`, data: filteredResults.providers }] : []),
      ...(filteredResults.content.length > 0 ? [{ type: 'content', title: `Content (${filteredResults.content.length})`, data: filteredResults.content }] : []),
      ...(filteredResults.users.length > 0 ? [{ type: 'user', title: `Users (${filteredResults.users.length})`, data: filteredResults.users }] : [])
    ];

    return (
      <ScrollView 
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, sectionIndex) => (
          <View key={section.type}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
            {section.data.map((item, itemIndex) => {
              if (section.type === 'provider') {
                return (
                  <View key={`provider-${(item as ProviderProfile).id}`}>
                    {renderProviderCard({ item: item as ProviderProfile })}
                  </View>
                );
              } else if (section.type === 'content') {
                return (
                  <View key={`content-${(item as ContentSearchResult).id}`}>
                    {renderContentCard({ item: item as ContentSearchResult })}
                  </View>
                );
              } else if (section.type === 'user') {
                return (
                  <View key={`user-${(item as UserSearchResult).id}`}>
                    {renderUserCard({ item: item as UserSearchResult })}
                  </View>
                );
              }
              return null;
            })}
          </View>
        ))}
      </ScrollView>
    );
  };

  const handleExpandPosts = (provider: ProviderProfile) => {
    setExpandedProvider(provider);
    setShowPostsModal(true);
  };

  const handleClosePostsModal = () => {
    setShowPostsModal(false);
    setExpandedProvider(null);
  };

  const handlePostPress = (postId: string) => {
    handleClosePostsModal();
    navigation.navigate('PostDetail', { postId });
  };

  const handleBookFromPosts = (provider: ProviderProfile) => {
    handleClosePostsModal();
    navigation.navigate('ProviderProfile', { providerId: provider.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        {searchMode === 'search' && searchResults && (
          <TouchableOpacity onPress={saveCurrentSearch}>
            <Ionicons name="bookmark-outline" size={24} color="#8b5cf6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers, content, or users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => performSearch()}
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchMode('discover');
                setSearchResults(null);
                setShowSuggestions(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.query}-${index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Tab Bar */}
      {searchMode === 'search' && (
        <View style={styles.tabBar}>
          {[
            { key: 'all', label: 'All' },
            { key: 'providers', label: 'Providers' },
            { key: 'content', label: 'Content' },
            { key: 'users', label: 'Users' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* View Toggle */}
      {searchMode === 'search' && activeTab === 'all' && filteredResults?.providers && filteredResults.providers.length > 0 && (
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={16} 
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
              size={16} 
              color={viewMode === 'map' ? '#ffffff' : '#8b5cf6'} 
            />
            <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Content */}
      {!isLoading && (
        searchMode === 'discover' ? renderDiscoverSection() : renderSearchResults()
      )}

      {/* Filters Modal */}
      <SearchFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          if (searchQuery) {
            performSearch(searchQuery, newFilters);
          }
        }}
        initialFilters={filters}
      />

      {/* Posts Modal */}
      <Modal
        visible={showPostsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClosePostsModal}
      >
        <View style={styles.postsModalContainer}>
          <View style={styles.postsModalContent}>
            <View style={styles.postsModalHeader}>
              <Text style={styles.postsModalTitle}>Recent Work</Text>
              <TouchableOpacity onPress={handleClosePostsModal}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.postsScrollContent}
            >
              {expandedProvider?.posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postThumbnail}
                  onPress={() => handlePostPress(post.id)}
                >
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
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.postsModalFooter}>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBookFromPosts(expandedProvider!)}
              >
                <Text style={styles.bookButtonText}>
                  Book {expandedProvider?.firstName}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Smart Suggestions Modal */}
      <SmartBookingSuggestionsModal
        visible={showSmartSuggestions}
        onClose={() => setShowSmartSuggestions(false)}
        onBookService={(providerId) => {
          navigation.navigate('ProviderDetail', { providerId });
        }}
      />

      {/* Floating AI Assistant Button */}
      <TouchableOpacity
        style={styles.floatingAIButton}
        onPress={() => setShowSmartSuggestions(true)}
      >
        <Ionicons name="flash" size={24} color="#fff" />
        <Text style={styles.floatingAIButtonText}>AI</Text>
      </TouchableOpacity>

      {/* Smart Suggestions Modal */}
      <SmartBookingSuggestionsModal
        visible={showSmartSuggestions}
        onClose={() => setShowSmartSuggestions(false)}
        onBookService={(providerId) => {
          navigation.navigate('ProviderDetail', { providerId });
        }}
      />
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
  suggestionsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#374151',
  },
  suggestionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
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
  discoverContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  discoverSection: {
    marginBottom: 32,
  },
  discoverSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  discoverSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  discoverSectionAction: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  recentSearchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentSearchText: {
    fontSize: 16,
    color: '#374151',
  },
  savedSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  savedSearchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedSearchName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  savedSearchQuery: {
    fontSize: 14,
    color: '#6b7280',
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  trendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendingText: {
    fontSize: 16,
    color: '#374151',
  },
  trendingCount: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  sectionHeader: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  resultsContainer: {
    paddingBottom: 24,
  },
  // Provider card styles
  providerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  postsPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postsPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  expandPostsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandPostsText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  postsScrollView: {
    flexGrow: 0,
  },
  postsScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  postThumbnail: {
    width: 80,
    height: 80,
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
  // Posts Modal Styles
  postsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  postsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: 24,
    maxHeight: '80%',
  },
  postsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  postsModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  postsModalFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  bookButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
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
  // Content card styles
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  contentAuthorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  contentAuthorInfo: {
    flex: 1,
  },
  contentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  contentType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  contentImage: {
    width: '100%',
    height: 200,
  },
  contentCaption: {
    padding: 16,
    paddingTop: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  contentStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  contentStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contentStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
  // User card styles
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 6,
  },
  providerBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBio: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
  },
  userStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  followButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    color: 'white',
    fontSize: 12,
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
  mapContainer: {
    flex: 1,
    margin: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  floatingAIButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingAIButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default EnhancedSearchScreen;
