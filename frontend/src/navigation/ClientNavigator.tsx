import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { ClientTabParamList, ClientFeedStackParamList, ClientSearchStackParamList, MessagesStackParamList, ProfileStackParamList } from '@/types';
import FeedScreen from '@/screens/client/FeedScreenSimple';
import SearchScreen from '@/screens/client/SearchScreen';
import AIBookingScreen from '@/screens/client/AIBookingScreen';
import ProviderDetailScreen from '@/screens/client/ProviderDetailScreen';
import ClientBookingHistory from '@/screens/client/ClientBookingHistory';
import MessagesScreen from '@/screens/shared/MessagesScreen';
import ChatScreen from '@/screens/shared/ChatScreen';
import ProfileScreen from '@/screens/shared/ProfileScreen';
import NotificationSettingsScreen from '@/screens/shared/NotificationSettingsScreen';
import DeveloperSettingsScreen from '@/screens/shared/DeveloperSettingsScreen';
import UserProfileScreen from '@/screens/shared/UserProfileScreen';
import CommentsScreen from '@/screens/shared/CommentsScreen';
import SavedPostsScreen from '@/screens/shared/SavedPostsScreen';
import NotificationCenterScreen from '@/screens/shared/NotificationCenterScreen';
import NotificationPreferencesScreen from '@/screens/shared/NotificationPreferencesScreen';
import CreatePostScreen from '@/screens/shared/CreatePostScreen';
import CreateContentScreen from '@/screens/CreateContentScreen';

const Tab = createBottomTabNavigator<ClientTabParamList>();
const FeedStack = createStackNavigator<ClientFeedStackParamList>();
const SearchStack = createStackNavigator<ClientSearchStackParamList>();
const MessagesStack = createStackNavigator<MessagesStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const FeedStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <FeedStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.secondary,
          borderBottomColor: colors.border.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          color: colors.text.primary,
        },
        headerBackTitleStyle: {
          color: colors.text.secondary,
        },
      }}
    >
      <FeedStack.Screen 
        name="FeedHome" 
        component={FeedScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ 
          headerShown: true,
          title: 'Profile',
        }}
      />
      <FeedStack.Screen 
        name="Comments" 
        component={CommentsScreen}
        options={{ 
          headerShown: true,
          title: 'Comments',
        }}
      />
      <FeedStack.Screen 
        name="PostDetail" 
        component={FeedScreen} // For now, can create dedicated PostDetailScreen later
        options={{ 
          headerShown: true,
          title: 'Post',
        }}
      />
      <FeedStack.Screen 
        name="SavedPosts" 
        component={SavedPostsScreen}
        options={{ 
          headerShown: true,
          title: 'Saved',
        }}
      />
      <FeedStack.Screen 
        name="Notifications" 
        component={NotificationCenterScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <FeedStack.Screen 
        name="NotificationPreferences" 
        component={NotificationPreferencesScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <FeedStack.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={{ 
          headerShown: true,
          title: 'New Post',
        }}
      />
      <FeedStack.Screen 
        name="CreateContent" 
        component={CreateContentScreen}
        options={{ 
          headerShown: true,
          title: 'Create Content',
        }}
      />
      <FeedStack.Screen 
        name="AIBooking" 
        component={AIBookingScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <FeedStack.Screen 
        name="ProviderDetail" 
        component={ProviderDetailScreen}
        options={{ 
          headerShown: true,
          title: 'Book Appointment',
        }}
      />
    </FeedStack.Navigator>
  );
};

const SearchStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.secondary,
          borderBottomColor: colors.border.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          color: colors.text.primary,
        },
        headerBackTitleStyle: {
          color: colors.text.secondary,
        },
      }}
    >
      <SearchStack.Screen 
        name="SearchHome" 
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen 
        name="ProviderDetail" 
        component={ProviderDetailScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <SearchStack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ 
          headerShown: true,
          title: 'Profile',
        }}
      />
      <SearchStack.Screen 
        name="PostDetail" 
        component={FeedScreen} // For now, can create dedicated PostDetailScreen later
        options={{ 
          headerShown: true,
          title: 'Post',
        }}
      />
      <SearchStack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ 
          headerShown: true,
          title: 'Chat',
        }}
      />
      <SearchStack.Screen 
        name="AIBooking" 
        component={AIBookingScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </SearchStack.Navigator>
  );
};

const MessagesStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <MessagesStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.secondary,
          borderBottomColor: colors.border.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          color: colors.text.primary,
        },
        headerBackTitleStyle: {
          color: colors.text.secondary,
        },
      }}
    >
      <MessagesStack.Screen 
        name="MessagesList" 
        component={MessagesScreen}
        options={{ headerShown: false }}
      />
      <MessagesStack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ 
          headerShown: true,
          title: 'Chat',
        }}
      />
    </MessagesStack.Navigator>
  );
};

const ProfileStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.secondary,
          borderBottomColor: colors.border.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          color: colors.text.primary,
        },
        headerBackTitleStyle: {
          color: colors.text.secondary,
        },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen}
        options={{ 
          headerShown: true,
          title: 'Notification Settings',
        }}
      />
      <ProfileStack.Screen 
        name="DeveloperSettings" 
        component={DeveloperSettingsScreen}
        options={{ 
          headerShown: true,
          title: 'Developer Settings',
        }}
      />
      <ProfileStack.Screen 
        name="SavedPosts" 
        component={SavedPostsScreen}
        options={{ 
          headerShown: true,
          title: 'Saved Posts',
        }}
      />
      <ProfileStack.Screen 
        name="Notifications" 
        component={NotificationCenterScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="NotificationPreferences" 
        component={NotificationPreferencesScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </ProfileStack.Navigator>
  );
};

const ClientNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Feed':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Bookings':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.primary,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Feed" component={FeedStackNavigator} />
      <Tab.Screen name="Search" component={SearchStackNavigator} />
      <Tab.Screen name="Bookings" component={ClientBookingHistory} />
      <Tab.Screen name="Messages" component={MessagesStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default ClientNavigator;
