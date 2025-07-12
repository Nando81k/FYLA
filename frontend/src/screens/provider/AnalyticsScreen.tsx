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
import { useAuth } from '@/context/AuthContext';
import { analyticsService } from '@/services/analyticsService';
import {
  AnalyticsData,
  AnalyticsPeriod,
  AppointmentStatus,
} from '@/types';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.MONTH);

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
        value: formatCurrency(analytics.totalRevenue),
        icon: 'cash' as keyof typeof Ionicons.glyphMap,
        color: '#059669',
        bgColor: '#dcfce7',
      },
      {
        title: 'Total Appointments',
        value: analytics.totalAppointments.toString(),
        icon: 'calendar' as keyof typeof Ionicons.glyphMap,
        color: '#3b82f6',
        bgColor: '#dbeafe',
      },
      {
        title: 'Most Booked Service',
        value: analytics.mostBookedService?.name || 'No data',
        subtitle: analytics.mostBookedService ? `${analytics.mostBookedService.bookingCount} bookings` : undefined,
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
    if (!analytics?.appointmentsByStatus.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointments by Status</Text>
        <View style={styles.statusContainer}>
          {analytics.appointmentsByStatus.map((statusData, index) => (
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
    if (!analytics?.topServices.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Services</Text>
        <View style={styles.servicesContainer}>
          {analytics.topServices.slice(0, 5).map((service, index) => (
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
          {renderAppointmentsByStatus()}
          {renderTopServices()}
        </View>
      </ScrollView>
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
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  refreshButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#8b5cf6',
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
    gap: 16,
    marginBottom: 32,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusItem: {
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginBottom: 4,
  },
  statusProgress: {
    height: '100%',
    borderRadius: 3,
  },
  statusPercentage: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  servicesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  serviceStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export default AnalyticsScreen;
