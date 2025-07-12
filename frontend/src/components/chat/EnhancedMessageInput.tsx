import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MessageType, MessageAttachment } from '@/types/chat';

interface EnhancedMessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (content: string, type?: MessageType, attachments?: MessageAttachment[]) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: any;
  onCancelReply?: () => void;
}

const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  replyTo,
  onCancelReply,
}) => {
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;

  const handleTextChange = (text: string) => {
    onChangeText(text);
    
    // Handle typing indicator
    if (onTyping) {
      onTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleSend = () => {
    if ((value.trim() || attachments.length > 0) && !disabled) {
      const messageType = attachments.length > 0 ? 
        (attachments[0].type === 'image' ? MessageType.IMAGE : 
         attachments[0].type === 'video' ? MessageType.VIDEO :
         attachments[0].type === 'audio' ? MessageType.AUDIO :
         MessageType.DOCUMENT) : MessageType.TEXT;
      
      onSend(value.trim(), messageType, attachments);
      onChangeText('');
      setAttachments([]);
      
      if (onTyping) {
        onTyping(false);
      }
    }
  };

  const showAttachmentOptions = () => {
    const options = [
      'Camera',
      'Photo Library',
      'Document',
      'Audio Recording',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          handleAttachmentSelection(buttonIndex);
        }
      );
    } else {
      // For Android, we'll use a simple alert for now
      Alert.alert(
        'Select Attachment',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => handleAttachmentSelection(0) },
          { text: 'Photo Library', onPress: () => handleAttachmentSelection(1) },
          { text: 'Document', onPress: () => handleAttachmentSelection(2) },
          { text: 'Audio Recording', onPress: () => handleAttachmentSelection(3) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleAttachmentSelection = async (index: number) => {
    try {
      switch (index) {
        case 0: // Camera
          await pickImageFromCamera();
          break;
        case 1: // Photo Library
          await pickImageFromLibrary();
          break;
        case 2: // Document
          await pickDocument();
          break;
        case 3: // Audio Recording
          await startAudioRecording();
          break;
      }
    } catch (error) {
      console.error('Error selecting attachment:', error);
      Alert.alert('Error', 'Failed to select attachment');
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const attachment: MessageAttachment = {
        id: Date.now().toString(),
        type: asset.type === 'video' ? 'video' : 'image',
        url: asset.uri,
        filename: asset.fileName || 'image.jpg',
        size: asset.fileSize || 0,
        mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      };
      setAttachments([attachment]);
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const attachment: MessageAttachment = {
        id: Date.now().toString(),
        type: asset.type === 'video' ? 'video' : 'image',
        url: asset.uri,
        filename: asset.fileName || 'image.jpg',
        size: asset.fileSize || 0,
        mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      };
      setAttachments([attachment]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const attachment: MessageAttachment = {
          id: Date.now().toString(),
          type: 'document',
          url: asset.uri,
          filename: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream',
        };
        setAttachments([attachment]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const startAudioRecording = async () => {
    // TODO: Implement audio recording with expo-av
    Alert.alert('Audio Recording', 'Audio recording feature coming soon!');
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const renderAttachmentPreview = (attachment: MessageAttachment) => {
    return (
      <View key={attachment.id} style={styles.attachmentPreview}>
        {attachment.type === 'image' || attachment.type === 'video' ? (
          <Image
            source={{ uri: attachment.url }}
            style={styles.attachmentThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.documentPreview}>
            <Ionicons name="document" size={32} color="#3b82f6" />
            <Text style={styles.documentName} numberOfLines={1}>
              {attachment.filename}
            </Text>
          </View>
        )}
        
        {attachment.type === 'video' && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play" size={20} color="white" />
          </View>
        )}
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeAttachment(attachment.id)}
        >
          <Ionicons name="close-circle" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Reply Preview */}
      {replyTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <Text style={styles.replyLabel}>Replying to {replyTo.sender?.fullName}</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {attachments.map(renderAttachmentPreview)}
        </View>
      )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={showAttachmentOptions}
          disabled={disabled}
        >
          <Ionicons name="add" size={24} color={disabled ? '#9ca3af' : '#3b82f6'} />
        </TouchableOpacity>

        <TextInput
          style={[styles.textInput, disabled && styles.disabledInput]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={1000}
          editable={!disabled}
        />

        {value.trim() || attachments.length > 0 ? (
          <TouchableOpacity
            style={[styles.sendButton, disabled && styles.disabledSendButton]}
            onPress={handleSend}
            disabled={disabled}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micButton}
            onPressIn={() => setIsRecording(true)}
            onPressOut={() => setIsRecording(false)}
            disabled={disabled}
          >
            <Animated.View style={[
              styles.micIcon,
              isRecording && { transform: [{ scale: recordingAnimation }] }
            ]}>
              <Ionicons 
                name={isRecording ? "mic" : "mic-outline"} 
                size={20} 
                color={isRecording ? "#ef4444" : "#6b7280"} 
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  replyBar: {
    width: 3,
    height: '100%',
    backgroundColor: '#3b82f6',
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  cancelReplyButton: {
    padding: 4,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },
  attachmentPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  attachmentThumbnail: {
    width: '100%',
    height: '100%',
  },
  documentPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  documentName: {
    fontSize: 8,
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 2,
  },
  videoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 2,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f9fafb',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: '#9ca3af',
  },
  micButton: {
    padding: 8,
    marginLeft: 8,
  },
  micIcon: {
    padding: 4,
  },
});

export default EnhancedMessageInput;
