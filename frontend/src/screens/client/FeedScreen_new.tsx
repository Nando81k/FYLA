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
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { contentService } from '@/services/contentService';
import { Post, StoryGroup, FeedResponse } from '@/types/content';
import PostComponent from '@/components/shared/PostComponent';
import StoriesComponent from '@/components/shared/StoriesComponent';

const FeedScreen: React.FC = () => {
  const { user, token } = useAuth();
  const [feedData, setFeedData] = useState<FeedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadFeed = useCallback(async (refresh = false) => {
    if (!token) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (!feedData) {
        setIsLoading(true);
      }

      const cursor = refresh ? undefined : feedData?.nextCursor;
      const response = await contentService.getFeed(token, cursor);

      if (refresh) {
        setFeedData(response);
      } else {
        setFeedData(prev => ({
          ...response,
          posts: [...(prev?.posts || []), ...response.posts],
          stories: response.stories, // Stories are always fresh
        }));
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load feed'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [token, feedData]);

  useEffect(() => {
    loadFeed();
  }, []);

  const handleRefresh = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  const handleLoadMore = useCallback(() => {
    if (feedData?.hasMore && !isLoadingMore && !isRefreshing && !isLoading) {
      setIsLoadingMore(true);
      loadFeed();
    }
  }, [feedData?.hasMore, isLoadingMore, isRefreshing, isLoading, loadFeed]);

  const handleLikeUpdate = useCallback((postId: string, isLiked: boolean, likesCount: number) => {
    setFeedData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        posts: prev.posts.map(post =>
          post.id === postId
            ? { ...post, isLiked, likesCount }
            : post
        ),
      };
    });
  }, []);

  const handleCommentPress = useCallback((post: Post) => {
    // TODO: Navigate to comments screen
    Alert.alert('Comments', `Comments for post by ${post.user.fullName}`);
  }, []);

  const handleUserPress = useCallback((userId: number) => {
    // TODO: Navigate to user profile
    Alert.alert('Profile', `Navigate to user profile: ${userId}`);
  }, []);

  const handleStoryPress = useCallback((storyGroup: StoryGroup, storyIndex: number) => {
    // TODO: Navigate to story viewer
    Alert.alert('Story', `View story by ${storyGroup.user.fullName}`);
  }, []);

  const handleCreateStoryPress = useCallback(() => {
    // TODO: Navigate to create story screen
    Alert.alert('Create Story', 'Create a new story');
  }, []);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostComponent
      post={item}
      onLikeUpdate={handleLikeUpdate}
      onCommentPress={handleCommentPress}
      onUserPress={handleUserPress}
    />
  ), [handleLikeUpdate, handleCommentPress, handleUserPress]);

  const renderHeader = useCallback(() => {
    if (!feedData?.stories || feedData.stories.length === 0) return null;
    
    return (
      <StoriesComponent
        storyGroups={feedData.stories}
        onStoryPress={handleStoryPress}
        onCreateStoryPress={handleCreateStoryPress}
        showCreateStory={true}
      />
    );
  }, [feedData?.stories, handleStoryPress, handleCreateStoryPress]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#8b5cf6" />
        <Text style={styles.loadingMoreText}>Loading more posts...</Text>
      </View>
    );
  }, [isLoadingMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>📸</Text>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>
          Follow some service providers to see their posts in your feed
        </Text>
      </View>
    );
  }, [isLoading]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading your feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={feedData?.posts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={3}
        windowSize={10}
      />
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FeedScreen;
