import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { contentService } from '@/services/contentService';
import { ContentPost as ContentPostType } from '@/types/content';
import ContentPost from '@/components/feed/ContentPost';
import DarkModeToggle from '@/components/shared/DarkModeToggle';

interface FeedScreenProps {
  navigation: any;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  console.log('FeedScreen rendering...');
  
  const { user, token } = useAuth();
  const { colors, typography, spacing } = useTheme();
  const [posts, setPosts] = useState<ContentPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  console.log('FeedScreen state:', { postsLength: posts.length, loading, user: !!user, token: !!token });

  const loadFeed = useCallback(async (page: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await contentService.getFeed(page, 10, token || undefined);
      
      // Ensure response has the expected structure
      if (response && Array.isArray(response.posts)) {
        if (refresh || page === 1) {
          setPosts(response.posts);
          setCurrentPage(1);
        } else {
          setPosts(prev => [...prev, ...response.posts]);
        }
        
        setHasNextPage(response.hasNextPage || false);
        setCurrentPage(page);
      } else {
        console.warn('Unexpected response structure:', response);
        setPosts([]);
        setHasNextPage(false);
      }
    } catch (error) {
      console.error('Failed to load content feed:', error);
      Alert.alert('Error', 'Failed to load content feed. Please try again.');
      setPosts([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    // Load feed regardless of authentication status since content feed should be public
    loadFeed();
  }, []);

  const handleRefresh = () => {
    loadFeed(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      loadFeed(currentPage + 1);
    }
  };

  const handleLike = async (postId: number) => {
    if (!user || !token) {
      Alert.alert('Sign In Required', 'You must be logged in to like posts');
      return;
    }

    try {
      const result = await contentService.toggleLike(token, postId);
      
      // Update the post in the local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLikedByCurrentUser: result.isLiked,
            likesCount: result.isLiked ? post.likesCount + 1 : post.likesCount - 1,
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };

  const handleComment = (postId: number) => {
    // TODO: Navigate to comments screen or show comments modal
    console.log('Handle comment for post:', postId);
    Alert.alert('Comments', 'Comments feature coming soon!');
  };

  const renderPost = ({ item }: { item: ContentPostType }) => (
    <ContentPost
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      currentUserId={user?.id}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text.primary }]}>No posts to show</Text>
        <Text style={[styles.emptySubtext, { color: colors.text.secondary }]}>
          Check back later for new content from service providers!
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>FYLA</Text>
        <View style={styles.headerActions}>
          <DarkModeToggle size={24} style={styles.darkModeToggle} />
          {user && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateContent')}
            >
              <Ionicons name="add-circle-outline" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.messagesButton}>
            <Ionicons name="paper-plane-outline" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStories = () => {
    // Mock stories data - in real app this would come from API
    const stories = [
      { id: 1, userName: 'Your Story', hasStory: false, isOwn: true },
      { id: 2, userName: 'john_doe', hasStory: true, isOwn: false },
      { id: 3, userName: 'beauty_salon', hasStory: true, isOwn: false },
      { id: 4, userName: 'fitness_coach', hasStory: true, isOwn: false },
    ];

    return (
      <View style={[styles.storiesContainer, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <FlatList
          horizontal
          data={stories}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.storyItem}>
              <View style={[styles.storyCircle, item.hasStory && styles.storyWithContent, { borderColor: colors.border.primary }]}>
                {item.isOwn ? (
                  <View style={[styles.addStoryContainer, { backgroundColor: colors.background.secondary }]}>
                    <Ionicons name="add" size={24} color={colors.primary} />
                  </View>
                ) : (
                  <View style={[styles.storyAvatar, { backgroundColor: colors.background.secondary }]}>
                    <Ionicons name="person" size={20} color={colors.text.secondary} />
                  </View>
                )}
              </View>
              <Text style={[styles.storyUsername, { color: colors.text.primary }]} numberOfLines={1}>
                {item.userName}
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.storiesScrollContainer}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading your feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {renderHeader()}
      {renderStories()}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
  },
  createButton: {
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkModeToggle: {
    marginRight: 10,
  },
  messagesButton: {
    marginLeft: 10,
  },
  storiesContainer: {
    borderBottomWidth: 0.5,
    paddingVertical: 10,
  },
  storiesScrollContainer: {
    paddingHorizontal: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 64,
  },
  storyCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  storyWithContent: {
    borderWidth: 2,
    borderColor: '#fd5949',
  },
  addStoryContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyUsername: {
    fontSize: 12,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default FeedScreen;
