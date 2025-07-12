import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { contentService } from '@/services/contentService';
import { Post } from '@/types/content';
import PostComponent from '@/components/shared/PostComponent';

interface SavedPostsScreenProps {
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');
const postGridSize = (screenWidth - 6) / 3; // 3 posts per row with 2px gaps

const SavedPostsScreen: React.FC<SavedPostsScreenProps> = ({ navigation }) => {
  const { token } = useAuth();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadSavedPosts = useCallback(async (refresh = false) => {
    if (!token) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await contentService.getSavedPosts(token);
      setSavedPosts(response.posts);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load saved posts'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadSavedPosts();
  }, [loadSavedPosts]);

  const handleLikeUpdate = useCallback((postId: string, isLiked: boolean, likesCount: number) => {
    setSavedPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, isLiked, likesCount }
        : post
    ));
  }, []);

  const handleCommentPress = useCallback((post: Post) => {
    navigation.navigate('Comments', { postId: post.id });
  }, [navigation]);

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleSaveUpdate = useCallback((postId: string, isSaved: boolean) => {
    if (!isSaved) {
      // If post is unsaved, remove it from the list
      setSavedPosts(prev => prev.filter(post => post.id !== postId));
    }
  }, []);

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
      onSaveUpdate={handleSaveUpdate}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Saved Posts</Text>
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

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No saved posts</Text>
        <Text style={styles.emptySubtitle}>
          Posts you save will appear here
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading saved posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={savedPosts}
        renderItem={viewMode === 'grid' ? renderGridPost : renderListPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        numColumns={viewMode === 'grid' ? 3 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={[
          viewMode === 'grid' ? styles.gridContainer : undefined,
          savedPosts.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadSavedPosts(true)}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeViewToggle: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
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

export default SavedPostsScreen;
