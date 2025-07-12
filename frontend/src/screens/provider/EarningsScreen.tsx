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
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { analyticsService } from '@/services/analyticsService';
import { EarningsData, AnalyticsPeriod } from '@/types/analytics';

const { width: screenWidth } = Dimensions.get('window');

const EarningsScreen: React.FC = () => {
  const { token } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.MONTH);

  useEffect(() => {
    loadEarnings();
  }, [selectedPeriod, token]);

  const loadEarnings = async (refresh = false) => {
    if (!token) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const earningsData = await analyticsService.getEarningsData(token, selectedPeriod);
      setEarnings(earningsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load earnings data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

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

  const renderEarningsOverview = () => {
    if (!earnings) return null;

    const cards = [
      {
        title: 'Total Earnings',
        value: formatCurrency(earnings.totalEarnings),
        icon: 'cash' as keyof typeof Ionicons.glyphMap,
        color: '#059669',
        bgColor: '#dcfce7',
      },
      {
        title: 'Available Payout',
        value: formatCurrency(earnings.availableForPayout),
        icon: 'card' as keyof typeof Ionicons.glyphMap,
        color: '#3b82f6',
        bgColor: '#dbeafe',
      },
      {
        title: 'Pending Payouts',
        value: formatCurrency(earnings.pendingPayouts),
        icon: 'time' as keyof typeof Ionicons.glyphMap,
        color: '#f59e0b',
        bgColor: '#fef3c7',
      },
      {
        title: 'Net Earnings',
        value: formatCurrency(earnings.netEarnings),
        icon: 'trending-up' as keyof typeof Ionicons.glyphMap,
        color: '#8b5cf6',
        bgColor: '#ede9fe',
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
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPayoutInfo = () => {
    if (!earnings) return null;

    return (
      <View style={styles.payoutContainer}>
        <Text style={styles.sectionTitle}>Payout Information</Text>
        <View style={styles.payoutCard}>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutLabel}>Last Payout</Text>
            <Text style={styles.payoutValue}>
              {earnings.lastPayoutDate ? formatDate(earnings.lastPayoutDate) : 'No payouts yet'}
            </Text>
          </View>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutLabel}>Next Payout</Text>
            <Text style={styles.payoutValue}>
              {earnings.nextPayoutDate ? formatDate(earnings.nextPayoutDate) : 'TBD'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.payoutButton}
            onPress={() => Alert.alert('Coming Soon', 'Payout request feature will be available soon!')}
          >
            <Ionicons name="card-outline" size={20} color="white" />
            <Text style={styles.payoutButtonText}>Request Payout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFeesBreakdown = () => {
    if (!earnings) return null;

    return (
      <View style={styles.feesContainer}>
        <Text style={styles.sectionTitle}>Fees Breakdown</Text>
        <View style={styles.feesCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Gross Earnings</Text>
            <Text style={styles.feeValue}>{formatCurrency(earnings.totalEarnings)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Platform Fee (2.5%)</Text>
            <Text style={[styles.feeValue, styles.feeDeduction]}>
              -{formatCurrency(earnings.platformFee)}
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Processing Fee</Text>
            <Text style={[styles.feeValue, styles.feeDeduction]}>
              -{formatCurrency(earnings.processingFee)}
            </Text>
          </View>
          <View style={[styles.feeRow, styles.netRow]}>
            <Text style={styles.netLabel}>Net Earnings</Text>
            <Text style={styles.netValue}>{formatCurrency(earnings.netEarnings)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTaxInfo = () => {
    if (!earnings) return null;

    return (
      <View style={styles.taxContainer}>
        <Text style={styles.sectionTitle}>Tax Information</Text>
        <View style={styles.taxCard}>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Taxable Income</Text>
            <Text style={styles.taxValue}>{formatCurrency(earnings.totalTaxableIncome)}</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Estimated Taxes (25%)</Text>
            <Text style={styles.taxValue}>{formatCurrency(earnings.estimatedTaxes)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.taxButton}
            onPress={() => Alert.alert('Coming Soon', 'Tax document download will be available soon!')}
          >
            <Ionicons name="document-text-outline" size={16} color="#3b82f6" />
            <Text style={styles.taxButtonText}>Download Tax Documents</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading earnings...</Text>
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
            onRefresh={() => loadEarnings(true)}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Earnings</Text>
          
          {renderPeriodSelector()}
          {renderEarningsOverview()}
          {renderPayoutInfo()}
          {renderFeesBreakdown()}
          {renderTaxInfo()}
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
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  payoutContainer: {
    marginBottom: 24,
  },
  payoutCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  payoutLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  payoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  feesContainer: {
    marginBottom: 24,
  },
  feesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  feeLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  feeDeduction: {
    color: '#ef4444',
  },
  netRow: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 8,
  },
  netLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  netValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  taxContainer: {
    marginBottom: 24,
  },
  taxCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taxLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  taxValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  taxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  taxButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EarningsScreen;
