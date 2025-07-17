import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { contentService } from '../services/contentService';
import { ContentPost as ContentPostType } from '../types/content';
import ContentPost from '../components/feed/ContentPost';

const ContentFeedScreen: React.FC = () => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<ContentPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

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
      
      if (refresh || page === 1) {
        setPosts(response.posts);
        setCurrentPage(1);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      
      setHasNextPage(response.hasNextPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load content feed:', error);
      Alert.alert('Error', 'Failed to load content feed. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleRefresh = () => {
    loadFeed(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      loadFeed(currentPage + 1);
    }
  };

  const handleLike = async (postId: number) => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to like posts');
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
      throw error; // Re-throw so ContentPost can handle UI revert
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
        <ActivityIndicator size="small" color="#3498db" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No posts to show</Text>
        <Text style={styles.emptySubtext}>
          Follow some service providers to see their content here!
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  list: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ContentFeedScreen;
