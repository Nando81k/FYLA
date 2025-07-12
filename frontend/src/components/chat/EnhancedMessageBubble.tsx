import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, MessageType, MessageAttachment } from '@/types/chat';
import { User } from '@/types';

interface EnhancedMessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  currentUser: User;
  onLongPress?: (message: Message) => void;
  onReact?: (messageId: number, emoji: string) => void;
  onReply?: (message: Message) => void;
  showDeliveryStatus?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

const { width: screenWidth } = Dimensions.get('window');
const maxBubbleWidth = screenWidth * 0.75;

const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isOwnMessage,
  currentUser,
  onLongPress,
  onReact,
  onReply,
  showDeliveryStatus = true,
  deliveryStatus = 'sent',
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const handleReaction = (emoji: string) => {
    if (onReact) {
      onReact(message.id, emoji);
    }
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    switch (attachment.type) {
      case 'image':
        return (
          <TouchableOpacity
            key={attachment.id}
            onPress={() => handleImagePress(attachment.url)}
            style={styles.imageAttachment}
          >
            <Image
              source={{ uri: attachment.url }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      
      case 'video':
        return (
          <View key={attachment.id} style={styles.videoAttachment}>
            <Image
              source={{ uri: attachment.thumbnailUrl || attachment.url }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
            <View style={styles.videoPlayButton}>
              <Ionicons name="play" size={32} color="white" />
            </View>
            {attachment.duration && (
              <View style={styles.videoDuration}>
                <Text style={styles.videoDurationText}>
                  {Math.floor(attachment.duration / 60)}:{(attachment.duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )}
          </View>
        );
      
      case 'audio':
        return (
          <View key={attachment.id} style={styles.audioAttachment}>
            <Ionicons name="volume-high" size={24} color={isOwnMessage ? 'white' : '#3b82f6'} />
            <Text style={[styles.audioText, isOwnMessage && styles.ownMessageText]}>
              Voice Message
            </Text>
            {attachment.duration && (
              <Text style={[styles.audioDuration, isOwnMessage && styles.ownMessageText]}>
                {Math.floor(attachment.duration / 60)}:{(attachment.duration % 60).toString().padStart(2, '0')}
              </Text>
            )}
          </View>
        );
      
      case 'document':
        return (
          <View key={attachment.id} style={styles.documentAttachment}>
            <Ionicons name="document" size={24} color={isOwnMessage ? 'white' : '#3b82f6'} />
            <View style={styles.documentInfo}>
              <Text style={[styles.documentName, isOwnMessage && styles.ownMessageText]} numberOfLines={1}>
                {attachment.filename}
              </Text>
              <Text style={[styles.documentSize, isOwnMessage && styles.ownMessageText]}>
                {(attachment.size / 1024 / 1024).toFixed(1)} MB
              </Text>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionCounts: { [emoji: string]: number } = {};
    message.reactions.forEach(reaction => {
      reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
    });

    return (
      <View style={styles.reactionsContainer}>
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionBubble}
            onPress={() => handleReaction(emoji)}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDeliveryStatus = () => {
    if (!isOwnMessage || !showDeliveryStatus) return null;

    let icon: string;
    let color: string;

    switch (deliveryStatus) {
      case 'sending':
        icon = 'time';
        color = '#9ca3af';
        break;
      case 'sent':
        icon = 'checkmark';
        color = '#9ca3af';
        break;
      case 'delivered':
        icon = 'checkmark-done';
        color = '#9ca3af';
        break;
      case 'read':
        icon = 'checkmark-done';
        color = '#3b82f6';
        break;
      case 'failed':
        icon = 'alert-circle';
        color = '#ef4444';
        break;
      default:
        return null;
    }

    return (
      <Ionicons name={icon as any} size={14} color={color} style={styles.deliveryIcon} />
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {message.replyTo && (
          <View style={styles.replyContainer}>
            <View style={styles.replyBar} />
            <View style={styles.replyContent}>
              <Text style={styles.replyAuthor}>
                {message.replyTo.senderId === currentUser.id ? 'You' : message.replyTo.sender?.fullName}
              </Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {message.replyTo.content}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
          onLongPress={() => onLongPress?.(message)}
        >
          {message.attachments && message.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {message.attachments.map(renderAttachment)}
            </View>
          )}

          {message.content && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}>
              {message.content}
              {message.isEdited && (
                <Text style={styles.editedText}> (edited)</Text>
              )}
            </Text>
          )}

          <View style={styles.messageFooter}>
            <Text style={[
              styles.timeText,
              isOwnMessage ? styles.ownTimeText : styles.otherTimeText,
            ]}>
              {formatTime(message.sentAt)}
            </Text>
            {renderDeliveryStatus()}
          </View>
        </TouchableOpacity>

        {renderReactions()}

        <View style={styles.messageActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction('👍')}
          >
            <Ionicons name="thumbs-up-outline" size={16} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReply?.(message)}
          >
            <Ionicons name="arrow-undo-outline" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalBackground}
            onPress={() => setShowImageModal(false)}
          >
            <Image
              source={{ uri: selectedImageUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    maxWidth: maxBubbleWidth,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#3b82f6',
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageBubble: {
    maxWidth: maxBubbleWidth,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ownMessage: {
    backgroundColor: '#3b82f6',
  },
  otherMessage: {
    backgroundColor: '#f3f4f6',
  },
  attachmentsContainer: {
    marginBottom: 8,
  },
  imageAttachment: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  videoAttachment: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
  },
  audioAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 4,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoDurationText: {
    color: 'white',
    fontSize: 12,
  },
  audioText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  audioDuration: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#6b7280',
  },
  documentInfo: {
    marginLeft: 8,
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  documentSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1f2937',
  },
  editedText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherTimeText: {
    color: '#9ca3af',
  },
  deliveryIcon: {
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 2,
  },
  messageActions: {
    flexDirection: 'row',
    opacity: 0,
    marginTop: 4,
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalImage: {
    width: screenWidth,
    height: screenWidth,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
});

export default EnhancedMessageBubble;
