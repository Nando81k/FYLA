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
  RefreshControl,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProviderDashboardStackParamList } from '@/types';
import { analyticsService } from '@/services/analyticsService';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/theme/ThemeProvider';
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
  const { colors, typography, spacing, borderRadius, shadows, isDark, toggleTheme } = useTheme();
  
  // State management
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.MONTH);
  const [showNotifications, setShowNotifications] = useState(false);
  const [themeScale] = useState(new Animated.Value(1));

  // Create styles with theme
  const styles = createStyles(colors, typography, spacing, borderRadius, shadows);

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

  const handleThemeToggle = () => {
    // Animate the theme toggle button
    Animated.sequence([
      Animated.timing(themeScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(themeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    toggleTheme();
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number | undefined): string => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const quickActions = [
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'View detailed insights',
      icon: 'analytics' as keyof typeof Ionicons.glyphMap,
      color: colors.primary,
      bgColor: colors.background.accent,
      onPress: () => navigation.navigate('Analytics'),
    },
    {
      id: 'availability',
      title: 'Availability',
      subtitle: 'Manage your schedule',
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      color: colors.accent,
      bgColor: colors.background.accent,
      onPress: () => navigation.navigate('AvailabilityManagement'),
    },
    {
      id: 'bookings',
      title: 'Booking Management',
      subtitle: 'View & manage bookings',
      icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
      color: colors.status.success,
      bgColor: colors.background.accent,
      onPress: () => navigation.navigate('BookingManagement'),
    },
    {
      id: 'packages',
      title: 'Packages',
      subtitle: 'Create service packages',
      icon: 'gift' as keyof typeof Ionicons.glyphMap,
      color: colors.primary,
      bgColor: colors.background.accent,
      onPress: () => navigation.navigate('PackageManagement'),
    },
    {
      id: 'clients',
      title: 'Client Management',
      subtitle: 'View client insights',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      color: colors.accent,
      bgColor: colors.background.accent,
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
        color: colors.status.success,
        bgColor: colors.background.accent,
        trend: (analytics?.revenueGrowth || 0) > 0 ? 'up' : 'down',
        trendValue: formatPercentage(Math.abs(analytics?.revenueGrowth || 0)),
      },
      {
        title: 'Total Appointments',
        value: (analytics?.totalAppointments || 0).toString(),
        icon: 'calendar' as keyof typeof Ionicons.glyphMap,
        color: colors.primary,
        bgColor: colors.background.accent,
        subtitle: `${appointments?.totalUpcoming || 0} upcoming`,
      },
      {
        title: 'Available Payout',
        value: formatCurrency(earnings?.availableForPayout || 0),
        icon: 'card' as keyof typeof Ionicons.glyphMap,
        color: colors.accent,
        bgColor: colors.background.accent,
        subtitle: `${formatCurrency(earnings?.pendingPayouts || 0)} pending`,
      },
      {
        title: 'Average Rating',
        value: (analytics?.averageRating || 0).toFixed(1),
        icon: 'star' as keyof typeof Ionicons.glyphMap,
        color: colors.accent,
        bgColor: colors.background.accent,
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
            <Text style={[styles.appointmentNumber, { color: colors.primary }]}>{appointments.totalToday || 0}</Text>
            <Text style={styles.appointmentLabel}>Today</Text>
          </View>
          <View style={styles.appointmentCard}>
            <Text style={[styles.appointmentNumber, { color: colors.primary }]}>{appointments.totalThisWeek || 0}</Text>
            <Text style={styles.appointmentLabel}>This Week</Text>
          </View>
          <View style={styles.appointmentCard}>
            <Text style={[styles.appointmentNumber, { color: colors.primary }]}>{appointments.totalUpcoming || 0}</Text>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboardData(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
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
              <Animated.View style={{ transform: [{ scale: themeScale }] }}>
                <TouchableOpacity onPress={handleThemeToggle} style={styles.themeToggle}>
                  <Ionicons 
                    name={isDark ? "sunny" : "moon"} 
                    size={20} 
                    color={colors.text.secondary} 
                  />
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity 
                style={styles.notificationButton} 
                onPress={() => setShowNotifications(true)}
              >
                <Ionicons name="notifications-outline" size={24} color={colors.text.secondary} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsButton} onPress={logout}>
                <Ionicons name="log-out-outline" size={24} color={colors.text.secondary} />
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

const createStyles = (colors: any, typography: any, spacing: any, borderRadius: any, shadows: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  roleText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  themeToggle: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  notificationButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.full,
    minWidth: 16,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  notificationBadgeText: {
    color: colors.text.inverse,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  settingsButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  periodButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  periodButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weight.semibold,
  },
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  overviewCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: (screenWidth - 44) / 2,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: typography.weight.medium,
  },
  cardValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  trendText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    marginLeft: spacing.xs,
  },
  appointmentSummary: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  appointmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  appointmentCard: {
    alignItems: 'center',
    flex: 1,
  },
  appointmentNumber: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  appointmentLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  appointmentDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.lg,
  },
  appointmentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  appointmentDetailLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  appointmentDetailValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  quickActionsContainer: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: (screenWidth - 44) / 2,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default DashboardScreen;
