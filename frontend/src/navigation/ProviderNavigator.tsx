import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { ProviderTabParamList, ProviderDashboardStackParamList, MessagesStackParamList, ProfileStackParamList } from '@/types';
import DashboardScreen from '@/screens/provider/DashboardScreen';
import ServicesScreen from '@/screens/provider/ServicesScreen';
import CalendarScreen from '@/screens/provider/CalendarScreen';
import BusinessHoursScreen from '@/screens/provider/BusinessHoursScreen';
import AnalyticsScreen from '@/screens/provider/AnalyticsScreen';
import MessagesScreen from '@/screens/shared/MessagesScreen';
import ChatScreen from '@/screens/shared/ChatScreen';
import ProfileScreen from '@/screens/shared/ProfileScreen';
import NotificationSettingsScreen from '@/screens/shared/NotificationSettingsScreen';
import NotificationCenterScreen from '@/screens/shared/NotificationCenterScreen';
import NotificationPreferencesScreen from '@/screens/shared/NotificationPreferencesScreen';
import DeveloperSettingsScreen from '@/screens/shared/DeveloperSettingsScreen';
import AvailabilityManagementScreen from '@/screens/provider/AvailabilityManagementScreen';
import BookingManagementScreen from '@/screens/provider/BookingManagementScreen';
import PackageManagementScreen from '@/screens/provider/PackageManagementScreen';
import ClientManagementScreen from '@/screens/provider/ClientManagementScreen';

const Tab = createBottomTabNavigator<ProviderTabParamList>();
const DashboardStack = createStackNavigator<ProviderDashboardStackParamList>();
const MessagesStack = createStackNavigator<MessagesStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const DashboardStackNavigator: React.FC = () => {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen 
        name="DashboardHome" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen 
        name="BusinessHours" 
        component={BusinessHoursScreen}
        options={{ 
          title: 'Business Hours',
          headerBackTitleVisible: false,
        }}
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
        component={BookingManagementScreen}
        options={{ 
          title: 'Booking Management',
          headerBackTitleVisible: false,
        }}
      />
      <DashboardStack.Screen 
        name="BookingManagement" 
        component={BookingManagementScreen}
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
        name="Calendar" 
        component={CalendarScreen}
        options={{ 
          title: 'Calendar',
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
    </DashboardStack.Navigator>
  );
};

const MessagesStackNavigator: React.FC = () => {
  return (
    <MessagesStack.Navigator>
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
  return (
    <ProfileStack.Navigator>
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
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
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
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Messages" component={MessagesStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default ProviderNavigator;
