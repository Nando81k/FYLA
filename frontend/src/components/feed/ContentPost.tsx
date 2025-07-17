import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ContentPost as ContentPostType } from '../../types/content';
import { Ionicons } from '@expo/vector-icons';

interface ContentPostProps {
  post: ContentPostType;
  onLike: (postId: number) => Promise<void>;
  onComment: (postId: number) => void;
  currentUserId?: number;
}

const ContentPost: React.FC<ContentPostProps> = ({ post, onLike, onComment, currentUserId }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(post.isLikedByCurrentUser);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount);

  const handleLike = async () => {
    if (isLiking || !currentUserId) return;
    
    setIsLiking(true);
    const wasLiked = localLiked;
    
    // Optimistic update
    setLocalLiked(!wasLiked);
    setLocalLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
      await onLike(post.id);
    } catch (error) {
      // Revert on error
      setLocalLiked(wasLiked);
      setLocalLikesCount(post.likesCount);
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header - Instagram style */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {post.providerProfileImageUrl ? (
            <Image source={{ uri: post.providerProfileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.providerName}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Main Image */}
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      )}

      {/* Action Bar - Instagram style */}
      <View style={styles.actionBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} disabled={isLiking} style={styles.actionButton}>
            <Ionicons 
              name={localLiked ? "heart" : "heart-outline"} 
              size={28} 
              color={localLiked ? "#ff3040" : "#262626"} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment(post.id)} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={28} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={28} color="#262626" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={28} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Likes count */}
      {localLikesCount > 0 && (
        <View style={styles.likesContainer}>
          <Text style={styles.likesText}>
            {localLikesCount === 1 ? '1 like' : `${localLikesCount} likes`}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{post.providerName}</Text>
          {' '}{post.content}
        </Text>
        
        {/* Services as hashtags */}
        {post.services.length > 0 && (
          <View style={styles.servicesContainer}>
            {post.services.map(service => (
              <Text key={service.id} style={styles.serviceHashtag}>
                #{service.name.toLowerCase().replace(/\s+/g, '')} 
              </Text>
            ))}
          </View>
        )}

        {/* Comments preview */}
        {post.commentsCount > 0 && (
          <TouchableOpacity onPress={() => onComment(post.id)}>
            <Text style={styles.viewCommentsText}>
              View all {post.commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}

        {/* Recent comments */}
        {post.recentComments && post.recentComments.map(comment => (
          <View key={comment.id} style={styles.commentContainer}>
            <Text style={styles.commentText}>
              <Text style={styles.commentUsername}>{comment.userName}</Text>
              {' '}{comment.comment}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#c7c7cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  timeAgo: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 1,
  },
  promotionBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promotionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
  },
  postText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f6f6f6',
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  servicePrice: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '600',
  },
  promotionDetails: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 12,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  discountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e74c3c',
    marginBottom: 4,
  },
  expiryText: {
    fontSize: 12,
    color: '#856404',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 12,
  },
  actionButton: {
    marginRight: 18,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  commentsPreview: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentPreview: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  viewAllComments: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginTop: 4,
  },
  // Instagram-style additions
  moreButton: {
    padding: 5,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 2,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    color: '#262626',
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '600',
    color: '#262626',
  },
  serviceHashtag: {
    fontSize: 14,
    color: '#3797f0',
    marginRight: 8,
    marginBottom: 2,
  },
  viewCommentsText: {
    fontSize: 14,
    color: '#8e8e8e',
    marginTop: 4,
    marginBottom: 4,
  },
  commentContainer: {
    marginBottom: 2,
  },
  commentUsername: {
    fontWeight: '600',
    color: '#262626',
  },
});

export default ContentPost;
