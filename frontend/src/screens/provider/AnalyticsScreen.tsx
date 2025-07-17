import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { analyticsService } from '@/services/analyticsService';
import {
  AnalyticsData,
  AnalyticsPeriod,
  AppointmentStatus,
} from '@/types';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const { token } = useAuth();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.MONTH);

  // Create styles with theme
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
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      backgroundColor: colors.background.secondary,
      borderBottomWidth: 1,
      borderColor: colors.gray[200]?.light || colors.gray[200],
    },
    title: {
      fontSize: typography.size.xxl,
      fontWeight: typography.weight.bold,
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    refreshButton: {
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.tertiary,
      borderWidth: 1,
      borderColor: colors.gray[200],
      ...shadows.sm,
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: colors.background.tertiary,
      borderRadius: borderRadius.lg,
      padding: spacing.xs,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.gray[200],
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
      color: colors.text.primaryInverse,
      fontWeight: typography.weight.semibold,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    statCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: (screenWidth - 44) / 2,
      borderWidth: 1,
      borderColor: colors.gray[200],
      ...shadows.md,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statLabel: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
      fontWeight: typography.weight.medium,
    },
    statValue: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    statSubtext: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    chartContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.gray[200],
      ...shadows.md,
    },
    chartTitle: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    modernChart: {
      borderRadius: borderRadius.md,
      marginVertical: 0,
    },
    metricsLegend: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing.xs,
    },
    legendText: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    // Overview styles
    overviewContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    overviewCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: (screenWidth - 44) / 2,
      borderWidth: 1,
      borderColor: colors.gray[200],
      ...shadows.md,
    },
    cardIcon: {
      width: 48,
      height: 48,
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
      color: colors.text.secondary,
    },
    // Status styles
    statusContainer: {
      paddingHorizontal: spacing.lg,
    },
    statusItem: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray[200],
      ...shadows.md,
    },
    statusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statusIndicator: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: spacing.sm,
    },
    statusLabel: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      color: colors.text.primary,
    },
    statusCount: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      color: colors.text.primary,
    },
    statusBar: {
      height: 8,
      backgroundColor: colors.background.tertiary,
      borderRadius: borderRadius.sm,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    statusProgress: {
      height: '100%',
      borderRadius: borderRadius.sm,
    },
    statusPercentage: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      textAlign: 'right',
    },
    // Services styles
    servicesContainer: {
      paddingHorizontal: spacing.lg,
    },
    serviceItem: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.gray[200],
      ...shadows.md,
    },
    serviceRank: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    serviceRankText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.bold,
      color: colors.text.primaryInverse,
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    serviceStats: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    serviceRating: {
      alignItems: 'center',
    },
    ratingText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: colors.accent,
      marginLeft: spacing.xs,
    },
    // Chart styles
    modernChartSection: {
      marginBottom: spacing.xl,
    },
    chartHeader: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    modernSectionTitle: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.bold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    chartSubtitle: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    modernChartContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.gray[200],
      ...shadows.md,
    },
    chartSection: {
      marginBottom: spacing.xl,
    },
    chart: {
      borderRadius: borderRadius.md,
    },
    // Layout styles
    scrollContainer: {
      flex: 1,
    },
    content: {
      paddingVertical: spacing.lg,
    },
  });

  const styles = createStyles(colors, typography, spacing, borderRadius, shadows);

  const periods = [
    { key: AnalyticsPeriod.WEEK, label: 'Week' },
    { key: AnalyticsPeriod.MONTH, label: 'Month' },
    { key: AnalyticsPeriod.QUARTER, label: 'Quarter' },
    { key: AnalyticsPeriod.YEAR, label: 'Year' },
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, token]);

  const loadAnalytics = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await analyticsService.getProviderAnalytics(token, {
        period: selectedPeriod,
      });
      setAnalytics(data);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load analytics'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case AppointmentStatus.COMPLETED:
        return '#059669';
      case AppointmentStatus.CONFIRMED:
        return '#3b82f6';
      case AppointmentStatus.PENDING:
        return '#f59e0b';
      case AppointmentStatus.CANCELLED:
        return '#ef4444';
      case AppointmentStatus.NO_SHOW:
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: AppointmentStatus): string => {
    switch (status) {
      case AppointmentStatus.COMPLETED:
        return 'Completed';
      case AppointmentStatus.CONFIRMED:
        return 'Confirmed';
      case AppointmentStatus.PENDING:
        return 'Pending';
      case AppointmentStatus.CANCELLED:
        return 'Cancelled';
      case AppointmentStatus.NO_SHOW:
        return 'No Show';
      default:
        return status;
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period.key)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewCards = () => {
    if (!analytics) return null;

    const cards = [
      {
        title: 'Total Revenue',
        value: formatCurrency(analytics?.totalRevenue || 0),
        icon: 'cash' as keyof typeof Ionicons.glyphMap,
        color: '#059669',
        bgColor: '#dcfce7',
      },
      {
        title: 'Total Appointments',
        value: analytics?.totalAppointments?.toString() || '0',
        icon: 'calendar' as keyof typeof Ionicons.glyphMap,
        color: '#3b82f6',
        bgColor: '#dbeafe',
      },
      {
        title: 'Most Booked Service',
        value: analytics?.mostBookedService?.name || 'No data',
        subtitle: analytics?.mostBookedService ? `${analytics.mostBookedService.bookingCount} bookings` : undefined,
        icon: 'star' as keyof typeof Ionicons.glyphMap,
        color: '#f59e0b',
        bgColor: '#fef3c7',
      },
    ];

    return (
      <View style={styles.overviewContainer}>
        {cards.map((card, index) => (
          <View key={index} style={styles.overviewCard}>
            <View style={[styles.cardIcon, { backgroundColor: card.bgColor }]}>
              <Ionicons name={card.icon} size={24} color={card.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
              {card.subtitle && (
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAppointmentsByStatus = () => {
    if (!analytics?.appointmentsByStatus?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointments by Status</Text>
        <View style={styles.statusContainer}>
          {analytics?.appointmentsByStatus?.map((statusData, index) => (
            <View key={index} style={styles.statusItem}>
              <View style={styles.statusHeader}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(statusData.status) },
                  ]}
                />
                <Text style={styles.statusLabel}>
                  {getStatusLabel(statusData.status)}
                </Text>
                <Text style={styles.statusCount}>{statusData.count}</Text>
              </View>
              <View style={styles.statusBar}>
                <View
                  style={[
                    styles.statusProgress,
                    {
                      width: `${statusData.percentage}%`,
                      backgroundColor: getStatusColor(statusData.status),
                    },
                  ]}
                />
              </View>
              <Text style={styles.statusPercentage}>
                {statusData.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTopServices = () => {
    if (!analytics?.topServices?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Services</Text>
        <View style={styles.servicesContainer}>
          {analytics?.topServices?.slice(0, 5).map((service, index) => (
            <View key={service.serviceId} style={styles.serviceItem}>
              <View style={styles.serviceRank}>
                <Text style={styles.serviceRankText}>{index + 1}</Text>
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={styles.serviceStats}>
                  {service.bookingCount} bookings • {formatCurrency(service.totalRevenue)}
                </Text>
              </View>
              <View style={styles.serviceRating}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.ratingText}>
                  {service.averageRating.toFixed(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Chart configurations
  // Modern chart configuration with gradients and better colors
  const chartConfig = {
    backgroundColor: '#f8fafc',
    backgroundGradientFrom: '#f8fafc',
    backgroundGradientTo: '#f1f5f9',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Modern indigo
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`, // Slate gray
    style: {
      borderRadius: 20,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#6366f1',
      fill: '#ffffff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid
      stroke: '#e2e8f0',
      strokeWidth: 1,
    },
  };

  const modernColors = {
    primary: '#6366f1', // Indigo
    success: '#10b981', // Emerald
    warning: '#f59e0b', // Amber
    danger: '#ef4444', // Red
    info: '#06b6d4', // Cyan
    purple: '#8b5cf6', // Violet
    pink: '#ec4899', // Pink
    orange: '#f97316', // Orange
  };

  const renderRevenueChart = () => {
    if (!analytics?.revenueByPeriod?.length) return null;

    const revenueData = analytics.revenueByPeriod.slice(-7); // Last 7 periods
    const labels = revenueData.map(item => {
      const date = new Date(item.period);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = {
      labels,
      datasets: [
        {
          data: revenueData.map(item => item.revenue),
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <View style={styles.modernChartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.modernSectionTitle}>Revenue Trend</Text>
          <Text style={styles.chartSubtitle}>Last 7 periods</Text>
        </View>
        <View style={styles.modernChartContainer}>
          <LineChart
            data={data}
            width={screenWidth - 100}
            height={160}
            chartConfig={chartConfig}
            bezier
            style={styles.modernChart}
            withShadow={false}
            withDots={true}
            withInnerLines={true}
            withOuterLines={false}
          />
        </View>
      </View>
    );
  };

  const renderAppointmentStatusChart = () => {
    if (!analytics?.appointmentsByStatus?.length) return null;

    const statusColors = [
      modernColors.success, // Completed
      modernColors.primary, // Confirmed
      modernColors.warning, // Pending
      modernColors.danger, // Cancelled
      modernColors.purple, // No Show
    ];

    const pieData = analytics.appointmentsByStatus.map((statusData, index) => ({
      name: statusData.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      population: statusData.count,
      color: statusColors[index % statusColors.length],
      legendFontColor: '#475569',
      legendFontSize: 12,
    }));

    return (
      <View style={styles.modernChartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.modernSectionTitle}>Appointment Status</Text>
          <Text style={styles.chartSubtitle}>Distribution breakdown</Text>
        </View>
        <View style={styles.modernChartContainer}>
          <PieChart
            data={pieData}
            width={screenWidth - 100}
            height={140}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.modernChart}
            center={[(screenWidth - 100) / 2, 70]}
            hasLegend={true}
          />
        </View>
      </View>
    );
  };

  const renderTopServicesChart = () => {
    if (!analytics?.topServices?.length) return null;

    const topServices = analytics.topServices.slice(0, 5);
    const data = {
      labels: topServices.map(service => 
        service.serviceName.length > 10 
          ? service.serviceName.substring(0, 10) + '..'
          : service.serviceName
      ),
      datasets: [
        {
          data: topServices.map(service => service.bookingCount),
          colors: topServices.map((_, index) => {
            const colors = [modernColors.primary, modernColors.success, modernColors.warning, modernColors.info, modernColors.purple];
            return () => colors[index % colors.length];
          }),
        },
      ],
    };

    const barChartConfig = {
      ...chartConfig,
      barPercentage: 0.7,
      fillShadowGradient: modernColors.primary,
      fillShadowGradientOpacity: 0.8,
    };

    return (
      <View style={styles.modernChartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.modernSectionTitle}>Top Services</Text>
          <Text style={styles.chartSubtitle}>By booking count</Text>
        </View>
        <View style={styles.modernChartContainer}>
          <BarChart
            data={data}
            width={screenWidth - 100}
            height={160}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={barChartConfig}
            style={styles.modernChart}
            verticalLabelRotation={0}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            showValuesOnTopOfBars={true}
            fromZero={true}
          />
        </View>
      </View>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!analytics) return null;

    const totalClients = (analytics.newClientsCount || 0) + (analytics.returningClientsCount || 0);
    const returningClientRate = totalClients > 0 ? (analytics.returningClientsCount || 0) / totalClients : 0;

    const data = {
      labels: ['Completion', 'Rating', 'Returning'], // optional
      data: [
        (analytics.completionRate || 0) / 100,
        (analytics.averageRating || 0) / 5,
        returningClientRate,
      ],
    };

    return (
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.chartContainer}>
          <ProgressChart
            data={data}
            width={screenWidth - 80}
            height={180}
            strokeWidth={12}
            radius={28}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1, index?: number) => {
                const colors = ['#10b981', '#f59e0b', '#8b5cf6'];
                return colors[(index || 0) % colors.length];
              },
            }}
            hideLegend={false}
            style={styles.chart}
          />
        </View>
        <View style={styles.metricsLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Completion ({(analytics.completionRate || 0).toFixed(1)}%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Rating ({(analytics.averageRating || 0).toFixed(1)}/5)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#8b5cf6' }]} />
            <Text style={styles.legendText}>Returning Clients ({(returningClientRate * 100).toFixed(1)}%)</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadAnalytics}>
          <Ionicons name="refresh" size={20} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderPeriodSelector()}
          {renderOverviewCards()}
          {renderRevenueChart()}
          {renderAppointmentStatusChart()}
          {renderTopServicesChart()}
          {renderPerformanceMetrics()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


export default AnalyticsScreen;
