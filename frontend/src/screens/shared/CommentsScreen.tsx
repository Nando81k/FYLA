import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { contentService } from '@/services/contentService';
import { Comment, Post, GetCommentsResponse } from '@/types/content';

interface CommentsScreenProps {
  route: {
    params: {
      postId: string;
    };
  };
  navigation: any;
}

interface CommentItemProps {
  comment: Comment;
  onLike?: (commentId: string) => void;
  onReply?: (comment: Comment) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onReply }) => {
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return `${Math.floor(diffInDays / 7)}w`;
  };

  return (
    <View style={styles.commentItem}>
      <Image
        source={{
          uri: comment.user.profilePictureUrl || 'https://via.placeholder.com/32x32/e5e7eb/6b7280?text=User',
        }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentUsername}>{comment.user.fullName}</Text>
          <Text style={styles.commentText}>{comment.content}</Text>
        </View>
        <View style={styles.commentActions}>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
          {comment.likesCount > 0 && (
            <Text style={styles.commentLikes}>
              {comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}
            </Text>
          )}
          <TouchableOpacity onPress={() => onReply?.(comment)}>
            <Text style={styles.commentAction}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.commentLikeButton}
        onPress={() => onLike?.(comment.id)}
      >
        <Ionicons
          name={comment.isLiked ? "heart" : "heart-outline"}
          size={12}
          color={comment.isLiked ? "#ef4444" : "#9ca3af"}
        />
      </TouchableOpacity>
    </View>
  );
};

const CommentsScreen: React.FC<CommentsScreenProps> = ({
  route,
  navigation,
}) => {
  const { postId } = route.params;
  const { token, user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [page, setPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const loadComments = useCallback(async (pageNum = 1, append = false) => {
    if (!token) return;

    try {
      if (pageNum === 1 && !append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await contentService.getComments(token, postId, pageNum, 20);

      if (append) {
        setComments(prev => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }
      
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load comments'
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [token, postId]);

  // Load post data for header
  const loadPost = useCallback(async () => {
    if (!token) return;
    
    try {
      // For now, we'll create a mock post. In a real app, you'd have a getPost endpoint
      setPost({
        id: postId,
        userId: 1,
        caption: 'Loading...',
        media: [],
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isSaved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 1,
          fullName: 'Loading...',
          profilePictureUrl: '',
          isServiceProvider: false,
        },
      });
    } catch (error) {
      console.error('Failed to load post:', error);
    }
  }, [token, postId]);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [loadPost, loadComments]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      setIsLoadingMore(true);
      loadComments(page + 1, true);
    }
  }, [hasMore, isLoadingMore, isLoading, page, loadComments]);

  const handlePostComment = async () => {
    if (!token || !newComment.trim() || !post) return;

    setIsPosting(true);
    try {
      const comment = await contentService.createComment(token, {
        postId: post.id,
        content: newComment.trim(),
        parentCommentId: replyingTo?.id,
      });

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to post comment'
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikeComment = useCallback(async (commentId: string) => {
    if (!token) return;

    try {
      // Optimistically update UI
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likesCount: comment.isLiked ? comment.likesCount - 1 : comment.likesCount + 1,
              }
            : comment
        )
      );

      // TODO: Implement comment like API call
      // await contentService.toggleCommentLike(token, commentId);
    } catch (error) {
      // Revert optimistic update on error
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likesCount: comment.isLiked ? comment.likesCount + 1 : comment.likesCount - 1,
              }
            : comment
        )
      );
      console.error('Failed to like comment:', error);
    }
  }, [token]);

  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.user.fullName} `);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
    setNewComment('');
  }, []);

  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      onLike={handleLikeComment}
      onReply={handleReply}
    />
  ), [handleLikeComment, handleReply]);

  const renderHeader = useCallback(() => {
    if (!post) return null;
    
    return (
      <View style={styles.postPreview}>
        <Image
          source={{ uri: post.media[0]?.url || 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=Post' }}
          style={styles.postImage}
        />
        <View style={styles.postInfo}>
          <Text style={styles.postUsername}>{post.user.fullName}</Text>
          <Text style={styles.postCaption} numberOfLines={2}>
            {post.caption}
          </Text>
        </View>
      </View>
    );
  }, [post]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#8b5cf6" />
      </View>
    );
  }, [isLoadingMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>💬</Text>
        <Text style={styles.emptyTitle}>No comments yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to comment!</Text>
      </View>
    );
  }, [isLoading]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Comments List */}
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          style={styles.commentsList}
        />

        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyText}>
              Replying to <Text style={styles.replyUsername}>{replyingTo.user.fullName}</Text>
            </Text>
            <TouchableOpacity onPress={cancelReply}>
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <Image
            source={{
              uri: user?.profilePictureUrl || 'https://via.placeholder.com/32x32/e5e7eb/6b7280?text=You',
            }}
            style={styles.inputAvatar}
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#9ca3af"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.postButton, (!newComment.trim() || isPosting) && styles.postButtonDisabled]}
            onPress={handlePostComment}
            disabled={!newComment.trim() || isPosting}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <Text style={[styles.postButtonText, (!newComment.trim() || isPosting) && styles.postButtonTextDisabled]}>
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
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
  },
  commentsList: {
    flex: 1,
  },
  postPreview: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  postCaption: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 12,
    gap: 16,
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentLikes: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  commentAction: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  commentLikeButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  replyPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  replyText: {
    fontSize: 13,
    color: '#6b7280',
  },
  replyUsername: {
    fontWeight: '600',
    color: '#8b5cf6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    marginRight: 8,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  postButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default CommentsScreen;
