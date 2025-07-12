import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { contentService } from '@/services/contentService';
import { UserProfile, Post } from '@/types/content';
import PostComponent from '@/components/shared/PostComponent';
import AdvancedBookingModal from '@/components/booking/AdvancedBookingModal';

interface UserProfileScreenProps {
  route: {
    params: {
      userId: number;
    };
  };
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');
const postGridSize = (screenWidth - 6) / 3; // 3 posts per row with 2px gaps

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ route, navigation }) => {
  const { userId } = route.params;
  const { user: currentUser, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const loadProfile = useCallback(async (refresh = false) => {
    if (!token) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [profileData, postsData] = await Promise.all([
        contentService.getUserProfile(token, userId),
        contentService.getUserPosts(token, userId)
      ]);

      setProfile(profileData);
      setPosts(postsData.posts);
      setIsFollowing(profileData.isFollowing);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load profile'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollow = async () => {
    if (isFollowLoading || !token || isOwnProfile) return;

    setIsFollowLoading(true);
    try {
      const result = await contentService.toggleFollow(token, userId);
      setIsFollowing(result.isFollowing);
      setProfile(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          followersCount: result.isFollowing 
            ? prev.stats.followersCount + 1 
            : prev.stats.followersCount - 1,
        },
        isFollowing: result.isFollowing
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (isOwnProfile || !profile) return;
    
    // Navigate to chat screen
    navigation.navigate('Chat', {
      conversationId: 0, // Will be created if doesn't exist
      otherUser: {
        id: profile.id,
        fullName: profile.fullName,
        profilePictureUrl: profile.profilePictureUrl,
      }
    });
  };

  const handleBookAppointment = () => {
    if (isOwnProfile || !profile || !profile.isServiceProvider) return;
    
    // Open the advanced booking modal
    setIsBookingModalVisible(true);
  };

  const handleBookingSuccess = () => {
    setIsBookingModalVisible(false);
    Alert.alert(
      'Booking Confirmed',
      'Your appointment has been successfully booked!',
      [
        {
          text: 'View Bookings',
          onPress: () => navigation.navigate('Bookings')
        },
        { text: 'OK' }
      ]
    );
  };

  const handleLikeUpdate = useCallback((postId: string, isLiked: boolean, likesCount: number) => {
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, isLiked, likesCount }
        : post
    ));
  }, []);

  const handleCommentPress = useCallback((post: Post) => {
    navigation.navigate('Comments', { postId: post.id });
  }, [navigation]);

  const handleUserPress = useCallback((userId: number) => {
    if (userId !== route.params.userId) {
      navigation.push('UserProfile', { userId });
    }
  }, [navigation, route.params.userId]);

  const renderGridPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.gridPost}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
    >
      <Image
        source={{ uri: item.media[0]?.url }}
        style={styles.gridPostImage}
        resizeMode="cover"
      />
      {item.media.length > 1 && (
        <View style={styles.multipleMediaIndicator}>
          <Ionicons name="copy" size={16} color="white" />
        </View>
      )}
      {item.media[0]?.type === 'video' && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={16} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderListPost = ({ item }: { item: Post }) => (
    <PostComponent
      post={item}
      onLikeUpdate={handleLikeUpdate}
      onCommentPress={handleCommentPress}
      onUserPress={handleUserPress}
    />
  );

  const renderHeader = () => {
    if (!profile) return null;

    return (
      <View style={styles.profileHeader}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Image
            source={{
              uri: profile.profilePictureUrl || 'https://via.placeholder.com/120x120/e5e7eb/6b7280?text=User',
            }}
            style={styles.profilePicture}
          />
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{profile.stats.postsCount}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <TouchableOpacity style={styles.stat}>
              <Text style={styles.statNumber}>{profile.stats.followersCount}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat}>
              <Text style={styles.statNumber}>{profile.stats.followingCount}</Text>
              <Text style={styles.statLabel}>following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.displayName}>{profile.fullName}</Text>
            {profile.isServiceProvider && (
              <View style={styles.providerBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.providerBadgeText}>Service Provider</Text>
              </View>
            )}
          </View>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          {profile.isServiceProvider && profile.tags && (
            <View style={styles.tagsContainer}>
              <Ionicons name="pricetag" size={14} color="#8b5cf6" />
              <Text style={styles.providerTags}>
                {profile.tags.join(' • ')}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionButtonsContainer}>
            {/* Follow and Message Buttons Row */}
            <View style={styles.topActionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.followButton,
                  isFollowing && styles.followingButton
                ]}
                onPress={handleFollow}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? "#6b7280" : "white"} />
                ) : (
                  <Text style={[
                    styles.actionButtonText,
                    isFollowing && styles.followingButtonText
                  ]}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.messageButton]}
                onPress={handleMessage}
              >
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>

            {/* Book Appointment Button - Only for Service Providers */}
            {profile.isServiceProvider && (
              <TouchableOpacity
                style={[styles.actionButton, styles.bookButton, styles.fullWidthButton]}
                onPress={handleBookAppointment}
              >
                <Ionicons name="calendar" size={16} color="white" />
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'grid' && styles.activeViewToggle]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons
              name="grid"
              size={20}
              color={viewMode === 'grid' ? '#3b82f6' : '#6b7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'list' && styles.activeViewToggle]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={viewMode === 'list' ? '#3b82f6' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadProfile()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        renderItem={viewMode === 'grid' ? renderGridPost : renderListPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        numColumns={viewMode === 'grid' ? 3 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={viewMode === 'grid' ? styles.gridContainer : undefined}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProfile(true)}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Advanced Booking Modal */}
      {profile?.isServiceProvider && (
        <AdvancedBookingModal
          visible={isBookingModalVisible}
          onClose={() => setIsBookingModalVisible(false)}
          onSuccess={handleBookingSuccess}
          provider={{
            id: profile.id,
            fullName: profile.fullName,
            email: '', // Not available in UserProfile
            phoneNumber: '', // Not available in UserProfile
            bio: profile.bio || '',
            profilePictureUrl: profile.profilePictureUrl,
            locationLat: 0, // Not available
            locationLng: 0, // Not available
            averageRating: 4.8, // Mock data
            totalReviews: 156, // Mock data
            isOnline: true, // Mock data
            tags: (profile.tags || []).map(tag => ({ id: 0, name: tag })),
            services: [
              // Mock services data - in a real app this would come from the API
              {
                id: 1,
                providerId: profile.id,
                name: 'Consultation',
                description: 'Professional consultation service',
                price: 100,
                estimatedDurationMinutes: 60,
                isActive: true,
                createdAt: new Date().toISOString(),
              }
            ],
            businessHours: [], // Mock data
            createdAt: new Date().toISOString(),
          }}
          selectedServices={[]} // Let user select services in modal
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
    color: '#6b7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  profileHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  bioContainer: {
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  providerBadgeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  bio: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    marginTop: 8,
  },
  providerTags: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
    flex: 1,
  },
  actionButtonsContainer: {
    marginBottom: 16,
  },
  topActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  followButton: {
    backgroundColor: '#3b82f6',
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#6b7280',
  },
  messageButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  messageButtonText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#4ade80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fullWidthButton: {
    flex: undefined,
    width: '100%',
  },
  compactButton: {
    flex: 0.32, // Make buttons smaller when there are 3
  },
  viewToggle: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  viewToggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeViewToggle: {
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
  },
  gridContainer: {
    paddingHorizontal: 1,
  },
  gridPost: {
    width: postGridSize,
    height: postGridSize,
    margin: 1,
    position: 'relative',
  },
  gridPostImage: {
    width: '100%',
    height: '100%',
  },
  multipleMediaIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
});

export default UserProfileScreen;
