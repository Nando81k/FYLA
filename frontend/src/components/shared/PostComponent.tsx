import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types/content';
import { contentService } from '@/services/contentService';
import { useAuth } from '@/context/AuthContext';

interface PostComponentProps {
  post: Post;
  onLikeUpdate?: (postId: string, isLiked: boolean, likesCount: number) => void;
  onCommentPress?: (post: Post) => void;
  onUserPress?: (userId: number) => void;
  onSaveUpdate?: (postId: string, isSaved: boolean) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const PostComponent: React.FC<PostComponentProps> = ({
  post,
  onLikeUpdate,
  onCommentPress,
  onUserPress,
  onSaveUpdate,
}) => {
  const { token } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handleLike = async () => {
    if (isLiking || !token) return;

    setIsLiking(true);
    try {
      const result = await contentService.toggleLike(token, post.id);
      onLikeUpdate?.(post.id, result.isLiked, result.likesCount);
    } catch (error) {
      Alert.alert('Error', 'Failed to update like. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (isSaving || !token) return;

    setIsSaving(true);
    try {
      const result = await contentService.toggleSave(token, post.id);
      onSaveUpdate?.(post.id, result.isSaved);
    } catch (error) {
      Alert.alert('Error', 'Failed to update save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w`;
  };

  const renderMediaIndicators = () => {
    if (post.media.length <= 1) return null;

    return (
      <View style={styles.mediaIndicators}>
        {post.media.map((_, index) => (
          <View
            key={index}
            style={[
              styles.mediaIndicator,
              index === currentMediaIndex && styles.activeMediaIndicator,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress?.(post.user.id)}
        >
          <Image
            source={{
              uri: post.user.profilePictureUrl || 'https://via.placeholder.com/40x40/e5e7eb/6b7280?text=User',
            }}
            style={styles.profilePicture}
          />
          <View style={styles.userTextInfo}>
            <Text style={styles.username}>{post.user.fullName}</Text>
            {post.location && (
              <Text style={styles.location}>{post.location.name}</Text>
            )}
            {post.user.isServiceProvider && post.user.tags && (
              <Text style={styles.providerTags}>
                {post.user.tags.join(' • ')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Media */}
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: post.media[currentMediaIndex]?.url }}
          style={styles.media}
          resizeMode="cover"
        />
        {post.media[currentMediaIndex]?.type === 'video' && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={50} color="white" />
          </View>
        )}
        {renderMediaIndicators()}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            disabled={isLiking}
          >
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={24}
              color={post.isLiked ? "#ef4444" : "#1f2937"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onCommentPress?.(post)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#1f2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons 
            name={post.isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={post.isSaved ? "#3b82f6" : "#1f2937"} 
          />
        </TouchableOpacity>
      </View>

      {/* Likes and Comments Count */}
      <View style={styles.engagement}>
        {post.likesCount > 0 && (
          <Text style={styles.likesText}>
            {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
          </Text>
        )}
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          <Text style={styles.username}>{post.user.fullName}</Text>{' '}
          {post.caption}
        </Text>
        {post.tags && post.tags.length > 0 && (
          <Text style={styles.hashtags}>
            {post.tags.map(tag => `#${tag}`).join(' ')}
          </Text>
        )}
      </View>

      {/* Comments */}
      {post.commentsCount > 0 && (
        <TouchableOpacity
          style={styles.commentsButton}
          onPress={() => onCommentPress?.(post)}
        >
          <Text style={styles.commentsText}>
            View all {post.commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Time */}
      <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  providerTags: {
    fontSize: 11,
    color: '#8b5cf6',
    marginTop: 1,
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: screenWidth,
    height: screenWidth, // Square aspect ratio
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mediaIndicators: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  mediaIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeMediaIndicator: {
    backgroundColor: 'white',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  engagement: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  hashtags: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 4,
    lineHeight: 20,
  },
  commentsButton: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  commentsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default PostComponent;
