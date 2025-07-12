import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProviderDashboardStackParamList } from '@/types';
import { analyticsService } from '@/services/analyticsService';
import { useNotifications } from '@/context/NotificationContext';
import NotificationCenter from '@/components/provider/NotificationCenter';
import { 
  AnalyticsData, 
  EarningsData, 
  AppointmentMetrics, 
  AnalyticsPeriod 
} from '@/types/analytics';

type DashboardNavigationProp = StackNavigationProp<ProviderDashboardStackParamList, 'DashboardHome'>;

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigation = useNavigation<DashboardNavigationProp>();
  const { notifications, unreadCount } = useNotifications();
  
  // State management
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.MONTH);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, token]);

  const loadDashboardData = async (refresh = false) => {
    if (!token) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [analyticsData, earningsData, appointmentData] = await Promise.all([
        analyticsService.getProviderAnalytics(token, { period: selectedPeriod }),
        analyticsService.getEarningsData(token, selectedPeriod),
        analyticsService.getAppointmentMetrics(token),
      ]);

      setAnalytics(analyticsData);
      setEarnings(earningsData);
      setAppointments(appointmentData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert(
        'Error', 
        'Failed to load dashboard data. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadDashboardData(refresh) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number | undefined): string => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const quickActions = [
    {
      id: 'business-hours',
      title: 'Business Hours',
      subtitle: 'Set your working hours',
      icon: 'time' as keyof typeof Ionicons.glyphMap,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      onPress: () => navigation.navigate('BusinessHours'),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'View detailed insights',
      icon: 'analytics' as keyof typeof Ionicons.glyphMap,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      onPress: () => navigation.navigate('Analytics'),
    },
    {
      id: 'availability',
      title: 'Availability',
      subtitle: 'Manage your schedule',
      icon: 'time' as keyof typeof Ionicons.glyphMap,
      color: '#06b6d4',
      bgColor: '#cffafe',
      onPress: () => navigation.navigate('AvailabilityManagement'),
    },
    {
      id: 'bookings',
      title: 'Booking Management',
      subtitle: 'View & manage bookings',
      icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
      color: '#10b981',
      bgColor: '#d1fae5',
      onPress: () => navigation.navigate('BookingManagement'),
    },
    {
      id: 'packages',
      title: 'Packages',
      subtitle: 'Create service packages',
      icon: 'gift' as keyof typeof Ionicons.glyphMap,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      onPress: () => navigation.navigate('PackageManagement'),
    },
    {
      id: 'calendar',
      title: 'Calendar',
      subtitle: 'Manage appointments',
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      color: '#10b981',
      bgColor: '#d1fae5',
      onPress: () => navigation.navigate('Calendar'),
    },
    {
      id: 'clients',
      title: 'Client Management',
      subtitle: 'View client insights',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      onPress: () => navigation.navigate('ClientManagement'),
    },
  ];

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {Object.values(AnalyticsPeriod).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewCards = () => {
    if (!analytics || !earnings || !appointments) return null;

    const cards = [
      {
        title: 'Total Revenue',
        value: formatCurrency(analytics?.totalRevenue || 0),
        icon: 'cash' as keyof typeof Ionicons.glyphMap,
        color: '#059669',
        bgColor: '#dcfce7',
        trend: (analytics?.revenueGrowth || 0) > 0 ? 'up' : 'down',
        trendValue: formatPercentage(Math.abs(analytics?.revenueGrowth || 0)),
      },
      {
        title: 'Total Appointments',
        value: (analytics?.totalAppointments || 0).toString(),
        icon: 'calendar' as keyof typeof Ionicons.glyphMap,
        color: '#3b82f6',
        bgColor: '#dbeafe',
        subtitle: `${appointments?.totalUpcoming || 0} upcoming`,
      },
      {
        title: 'Available Payout',
        value: formatCurrency(earnings?.availableForPayout || 0),
        icon: 'card' as keyof typeof Ionicons.glyphMap,
        color: '#8b5cf6',
        bgColor: '#ede9fe',
        subtitle: `${formatCurrency(earnings?.pendingPayouts || 0)} pending`,
      },
      {
        title: 'Average Rating',
        value: (analytics?.averageRating || 0).toFixed(1),
        icon: 'star' as keyof typeof Ionicons.glyphMap,
        color: '#f59e0b',
        bgColor: '#fef3c7',
        subtitle: `${(analytics?.completionRate || 0).toFixed(1)}% completion`,
      },
    ];

    return (
      <View style={styles.overviewContainer}>
        {cards.map((card, index) => (
          <View key={index} style={styles.overviewCard}>
            <View style={[styles.cardIcon, { backgroundColor: card.bgColor }]}>
              <Ionicons name={card.icon} size={20} color={card.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
              {card.subtitle && (
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              )}
              {card.trend && (
                <View style={styles.trendContainer}>
                  <Ionicons 
                    name={card.trend === 'up' ? 'trending-up' : 'trending-down'} 
                    size={12} 
                    color={card.trend === 'up' ? '#059669' : '#ef4444'} 
                  />
                  <Text style={[
                    styles.trendText, 
                    { color: card.trend === 'up' ? '#059669' : '#ef4444' }
                  ]}>
                    {card.trendValue}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAppointmentSummary = () => {
    if (!appointments) return null;

    return (
      <View style={styles.appointmentSummary}>
        <Text style={styles.sectionTitle}>Appointments Summary</Text>
        <View style={styles.appointmentGrid}>
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentNumber}>{appointments.totalToday || 0}</Text>
            <Text style={styles.appointmentLabel}>Today</Text>
          </View>
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentNumber}>{appointments.totalThisWeek || 0}</Text>
            <Text style={styles.appointmentLabel}>This Week</Text>
          </View>
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentNumber}>{appointments.totalUpcoming || 0}</Text>
            <Text style={styles.appointmentLabel}>Upcoming</Text>
          </View>
        </View>
        <View style={styles.appointmentDetails}>
          <View style={styles.appointmentDetailRow}>
            <Text style={styles.appointmentDetailLabel}>Upcoming Revenue</Text>
            <Text style={styles.appointmentDetailValue}>
              {formatCurrency(appointments.upcomingRevenue || 0)}
            </Text>
          </View>
          <View style={styles.appointmentDetailRow}>
            <Text style={styles.appointmentDetailLabel}>Cancellation Rate</Text>
            <Text style={styles.appointmentDetailValue}>
              {formatPercentage(appointments.cancellationRate)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboardData(true)}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Hi {user?.fullName}! 👋</Text>
              <Text style={styles.roleText}>Service Provider</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.notificationButton} 
                onPress={() => setShowNotifications(true)}
              >
                <Ionicons name="notifications-outline" size={24} color="#6b7280" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsButton} onPress={logout}>
                <Ionicons name="log-out-outline" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Period Selector */}
          {renderPeriodSelector()}
          
          {/* Overview Cards */}
          {renderOverviewCards()}

          {/* Appointment Summary */}
          {renderAppointmentSummary()}

          {/* Quick Actions */}
          {renderQuickActions()}
        </View>
      </ScrollView>

      {/* Notification Center */}
      <NotificationCenter
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#3b82f6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: (screenWidth - 44) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  appointmentSummary: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  appointmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  appointmentCard: {
    alignItems: 'center',
    flex: 1,
  },
  appointmentNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  appointmentLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  appointmentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  appointmentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appointmentDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  appointmentDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  quickActionsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: (screenWidth - 44) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
});

export default DashboardScreen;
