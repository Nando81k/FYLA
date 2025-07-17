import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { contentService } from '../services/contentService';
import { CreateContentPost, ContentService } from '../types/content';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface CreateContentScreenProps {
  navigation: any;
}

const CreateContentScreen: React.FC<CreateContentScreenProps> = ({ navigation }) => {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [userServices, setUserServices] = useState<ContentService[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    // Only load services for service providers
    if (user?.role === 'ServiceProvider') {
      loadUserServices();
    } else {
      setLoadingServices(false);
    }
  }, [user]);

  const loadUserServices = async () => {
    try {
      // TODO: Implement service loading from provider services
      // For now, use empty array
      setUserServices([]);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post.');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be logged in to create posts.');
      return;
    }

    setLoading(true);

    try {
      const postData: CreateContentPost = {
        content: content.trim(),
        imageUrl: selectedImage || undefined,
        serviceIds: selectedServices.length > 0 ? selectedServices : undefined,
      };

      await contentService.createPost(token, postData);
      
      Alert.alert('Success', 'Your post has been created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() || selectedImage || selectedServices.length > 0) {
      Alert.alert(
        'Discard Post?',
        'Are you sure you want to discard this post?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Allow all authenticated users to create content
  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>You must be logged in to create content posts.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={loading || !content.trim()}
          style={[styles.postButton, (!content.trim() || loading) && styles.postButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0095f6" />
          ) : (
            <Text style={styles.postButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfo}>
          {user.profilePictureUrl ? (
            <Image source={{ uri: user.profilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
          )}
          <Text style={styles.userName}>{user.fullName}</Text>
        </View>

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="What would you like to share with your clients?"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={1000}
          textAlignVertical="top"
        />

        {/* Character Count */}
        <Text style={styles.characterCount}>{content.length}/1000</Text>

        {/* Selected Image */}
        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleImagePicker}>
            <Ionicons name="image" size={24} color="#3498db" />
            <Text style={styles.actionButtonText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Services Selection */}
        {userServices.length > 0 && (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Tag Services (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Help clients discover your services by tagging them in your post
            </Text>
            
            {loadingServices ? (
              <ActivityIndicator size="small" color="#3498db" style={styles.servicesLoader} />
            ) : (
              <View style={styles.servicesList}>
                {userServices.map(service => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceItem,
                      selectedServices.includes(service.id) && styles.serviceItemSelected
                    ]}
                    onPress={() => handleServiceToggle(service.id)}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={[
                        styles.serviceName,
                        selectedServices.includes(service.id) && styles.serviceNameSelected
                      ]}>
                        {service.name}
                      </Text>
                      <Text style={[
                        styles.servicePrice,
                        selectedServices.includes(service.id) && styles.servicePriceSelected
                      ]}>
                        ${service.price}
                      </Text>
                    </View>
                    {selectedServices.includes(service.id) && (
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  postButton: {
    // Remove background for minimal look
  },
  postButtonDisabled: {
    opacity: 0.3,
  },
  postButtonText: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 0,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginRight: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  servicesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  servicesLoader: {
    marginVertical: 20,
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceItemSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: 'white',
  },
  servicePrice: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: '500',
  },
  servicePriceSelected: {
    color: 'white',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateContentScreen;
