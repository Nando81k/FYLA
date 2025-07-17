import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { ProviderTabParamList, ProviderDashboardStackParamList, ProviderFeedStackParamList, MessagesStackParamList, ProfileStackParamList } from '../types';
import DashboardScreen from '../screens/provider/DashboardScreen';
import ServicesScreen from '../screens/provider/ServicesScreen';
import AnalyticsScreen from '../screens/provider/AnalyticsScreen';
import MessagesScreen from '../screens/shared/MessagesScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import NotificationSettingsScreen from '../screens/shared/NotificationSettingsScreen';
import NotificationCenterScreen from '../screens/shared/NotificationCenterScreen';
import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import DeveloperSettingsScreen from '../screens/shared/DeveloperSettingsScreen';
import AvailabilityManagementScreen from '../screens/provider/AvailabilityManagementScreen';
import ProviderBookingManagement from '../screens/provider/ProviderBookingManagement';
import PackageManagementScreen from '../screens/provider/PackageManagementScreen';
import ClientManagementScreen from '@/screens/provider/ClientManagementScreen';
import CreateContentScreen from '@/screens/CreateContentScreen';
import FeedScreen from '@/screens/client/FeedScreen';
import UserProfileScreen from '@/screens/shared/UserProfileScreen';
import CommentsScreen from '@/screens/shared/CommentsScreen';

const Tab = createBottomTabNavigator<ProviderTabParamList>();
const DashboardStack = createStackNavigator<ProviderDashboardStackParamList>();
const FeedStack = createStackNavigator<ProviderFeedStackParamList>();
const MessagesStack = createStackNavigator<MessagesStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const DashboardStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <DashboardStack.Navigator
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
      <DashboardStack.Screen 
        name="DashboardHome" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ 
          title: 'Analytics',
          headerBackTitleVisible: false,
        }}
      />
      <DashboardStack.Screen 
        name="AvailabilityManagement" 
        component={AvailabilityManagementScreen}
        options={{ 
          title: 'Availability Management',
          headerBackTitleVisible: false,
        }}
      />
      <DashboardStack.Screen 
        name="BookingManagement" 
        component={ProviderBookingManagement}
        options={{ 
          title: 'Booking Management',
          headerBackTitleVisible: false,
        }}
      />
      <DashboardStack.Screen 
        name="PackageManagement" 
        component={PackageManagementScreen}
        options={{ 
          title: 'Package Management',
          headerBackTitleVisible: false,
        }}
      />
      <DashboardStack.Screen 
        name="ClientManagement" 
        component={ClientManagementScreen}
        options={{ 
          title: 'Client Management',
          headerBackTitleVisible: false,
        }}
      />
      <DashboardStack.Screen 
        name="CreateContent" 
        component={CreateContentScreen}
        options={{ 
          title: 'Create Content',
          headerBackTitleVisible: false,
        }}
      />
    </DashboardStack.Navigator>
  );
};

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
        name="CreateContent" 
        component={CreateContentScreen}
        options={{ 
          title: 'Create Content',
          headerBackTitleVisible: false,
        }}
      />
      <FeedStack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ 
          title: 'Profile',
          headerBackTitleVisible: false,
        }}
      />
      <FeedStack.Screen 
        name="Comments" 
        component={CommentsScreen}
        options={{ 
          title: 'Comments',
          headerBackTitleVisible: false,
        }}
      />
      <FeedStack.Screen 
        name="PostDetail" 
        component={FeedScreen}
        options={{ 
          title: 'Post',
          headerBackTitleVisible: false,
        }}
      />
    </FeedStack.Navigator>
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
      <ProfileStack.Screen 
        name="DeveloperSettings" 
        component={DeveloperSettingsScreen}
        options={{ 
          headerShown: true,
          title: 'Developer Settings',
        }}
      />
    </ProfileStack.Navigator>
  );
};

const ProviderNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Services':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Feed':
              iconName = focused ? 'newspaper' : 'newspaper-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'analytics-outline';
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
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Feed" component={FeedStackNavigator} />
      <Tab.Screen name="Messages" component={MessagesStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default ProviderNavigator;
