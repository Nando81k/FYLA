import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StoryGroup } from '@/types/content';

interface StoriesComponentProps {
  storyGroups: StoryGroup[];
  onStoryPress?: (storyGroup: StoryGroup, storyIndex: number) => void;
  onCreateStoryPress?: () => void;
  showCreateStory?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const storyItemWidth = 72;

export const StoriesComponent: React.FC<StoriesComponentProps> = ({
  storyGroups,
  onStoryPress,
  onCreateStoryPress,
  showCreateStory = true,
}) => {
  const renderStoryItem = (storyGroup: StoryGroup, index: number) => {
    const hasUnviewed = storyGroup.hasUnviewedStories;
    
    return (
      <TouchableOpacity
        key={storyGroup.userId}
        style={styles.storyItem}
        onPress={() => onStoryPress?.(storyGroup, 0)}
      >
        <View style={[
          styles.storyImageContainer,
          hasUnviewed && styles.unviewedStoryBorder,
        ]}>
          <Image
            source={{
              uri: storyGroup.user.profilePictureUrl || 
                   'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=User',
            }}
            style={styles.storyImage}
          />
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {storyGroup.user.fullName.split(' ')[0]} {/* First name only */}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCreateStoryItem = () => {
    if (!showCreateStory) return null;
    
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={onCreateStoryPress}
      >
        <View style={styles.createStoryContainer}>
          <View style={styles.createStoryPlaceholder}>
            <Ionicons name="add" size={24} color="white" />
          </View>
          <View style={styles.createStoryIcon}>
            <Ionicons name="add-circle" size={20} color="#8b5cf6" />
          </View>
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          Your story
        </Text>
      </TouchableOpacity>
    );
  };

  if (storyGroups.length === 0 && !showCreateStory) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={storyItemWidth + 12} // item width + margin
        snapToAlignment="start"
      >
        {renderCreateStoryItem()}
        {storyGroups.map((storyGroup, index) => renderStoryItem(storyGroup, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: storyItemWidth,
  },
  storyImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    marginBottom: 8,
  },
  unviewedStoryBorder: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  createStoryContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  createStoryPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  createStoryIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  storyUsername: {
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default StoriesComponent;
