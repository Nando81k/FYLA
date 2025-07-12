import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { contentService } from '@/services/contentService';
import { CreatePostRequest } from '@/types/content';

interface CreatePostScreenProps {
  onClose?: () => void;
  onPostCreated?: () => void;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  onClose,
  onPostCreated,
}) => {
  const { token, user } = useAuth();
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: 'image' | 'video';
    name?: string;
  }[]>([]);
  const [locationName, setLocationName] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false, // For simplicity, single selection for now
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaItem = {
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' as const : 'image' as const,
          name: asset.fileName || undefined,
        };
        setSelectedMedia([mediaItem]); // Replace current selection
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaItem = {
          uri: asset.uri,
          type: 'image' as const,
          name: asset.fileName || undefined,
        };
        setSelectedMedia([mediaItem]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleMediaAction = () => {
    Alert.alert(
      'Select Media',
      'Choose how you want to add media to your post',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickMedia },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!token || selectedMedia.length === 0) {
      Alert.alert('Error', 'Please select at least one photo or video');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    setIsPosting(true);
    try {
      const postRequest: CreatePostRequest = {
        caption: caption.trim(),
        mediaFiles: selectedMedia,
        locationName: locationName.trim() || undefined,
        tags: extractHashtags(caption),
      };

      await contentService.createPost(token, postRequest);
      
      Alert.alert(
        'Success!',
        'Your post has been created successfully.',
        [{ text: 'OK', onPress: () => {
          onPostCreated?.();
          onClose?.();
        }}]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create post. Please try again.'
      );
    } finally {
      setIsPosting(false);
    }
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const hashtags: string[] = [];
    let match;
    
    while ((match = hashtagRegex.exec(text)) !== null) {
      hashtags.push(match[1]);
    }
    
    return hashtags;
  };

  const isValidToPost = selectedMedia.length > 0 && caption.trim().length > 0 && !isPosting;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          style={[styles.headerButton, !isValidToPost && styles.disabledButton]}
          disabled={!isValidToPost}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#8b5cf6" />
          ) : (
            <Text style={[styles.postText, !isValidToPost && styles.disabledText]}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <Image
            source={{
              uri: user?.profilePictureUrl || 'https://via.placeholder.com/40x40/e5e7eb/6b7280?text=User',
            }}
            style={styles.profilePicture}
          />
          <Text style={styles.username}>{user?.fullName}</Text>
        </View>

        {/* Caption Input */}
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor="#9ca3af"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2200}
          textAlignVertical="top"
        />

        {/* Location Input */}
        <View style={styles.locationSection}>
          <Ionicons name="location-outline" size={20} color="#6b7280" />
          <TextInput
            style={styles.locationInput}
            placeholder="Add location (optional)"
            placeholderTextColor="#9ca3af"
            value={locationName}
            onChangeText={setLocationName}
            maxLength={100}
          />
        </View>

        {/* Media Selection */}
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Media</Text>
          
          {selectedMedia.length === 0 ? (
            <TouchableOpacity style={styles.addMediaButton} onPress={handleMediaAction}>
              <Ionicons name="camera" size={32} color="#8b5cf6" />
              <Text style={styles.addMediaText}>Add Photo or Video</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedMediaContainer}>
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
                  {media.type === 'video' && (
                    <View style={styles.videoIndicator}>
                      <Ionicons name="play-circle" size={24} color="white" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addMoreButton} onPress={handleMediaAction}>
                <Ionicons name="add" size={24} color="#8b5cf6" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips:</Text>
          <Text style={styles.tipsText}>• Use hashtags (#haircut #style) to reach more people</Text>
          <Text style={styles.tipsText}>• Add your location to help local clients find you</Text>
          <Text style={styles.tipsText}>• Square photos (1:1) look best in the feed</Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  postText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    textAlign: 'right',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  captionInput: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    minHeight: 120,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  mediaSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  addMediaButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  addMediaText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
    marginTop: 8,
  },
  selectedMediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  addMoreButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  tipsSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
});

export default CreatePostScreen;
