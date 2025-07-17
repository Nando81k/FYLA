import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { analyticsService } from '@/services/analyticsService';
import { ClientInsight } from '@/types/analytics';
import { FEATURE_FLAGS } from '@/config/api';

const ClientManagementScreen: React.FC = () => {
  const { token } = useAuth();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  
  const [clients, setClients] = useState<ClientInsight[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all');

  // Create styles with theme
  const createStyles = (colors: any, typography: any, spacing: any, borderRadius: any, shadows: any) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: typography.size.md,
      color: colors.text.primaryecondary,
      fontWeight: typography.weight.medium,
    },
    listContainer: {
      padding: spacing.md,
    },
    header: {
      marginBottom: spacing.lg,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      fontSize: typography.size.md,
      color: colors.text.primary
    },
    filterContainer: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    filterButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      color: colors.text.primaryecondary,
    },
    filterButtonTextActive: {
      color: colors.text.primarynverse,
    },
    summaryContainer: {
      marginBottom: spacing.xs,
    },
    summaryText: {
      fontSize: typography.size.sm,
      color: colors.text.primaryecondary,
      fontWeight: typography.weight.medium,
    },
    clientCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.md,
    },
    clientHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    clientAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: spacing.sm,
    },
    clientInfo: {
      flex: 1,
    },
    clientName: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.xs,
    },
    statusText: {
      fontSize: typography.size.sm,
      color: colors.text.primaryecondary,
    },
    clientActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    actionButton: {
      padding: spacing.xs,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    clientStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    clientFooter: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    lastAppointment: {
      fontSize: typography.size.sm,
      color: colors.text.primaryecondary,
    },
  });

  const styles = createStyles(colors, typography, spacing, borderRadius, shadows);

  useEffect(() => {
    loadClients();
  }, [token]);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, selectedFilter]);

  const loadClients = async (refresh = false) => {
    if (!token) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const clientData = await analyticsService.getClientInsights(token, 50);
      setClients(clientData);
    } catch (error) {
      console.error('Error loading client data:', error);
      Alert.alert(
        'Error', 
        'Failed to load client data. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadClients(refresh) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(client => client.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(client =>
        client.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredClients(filtered);
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      case 'new': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'new': return 'New';
      default: return status;
    }
  };

  const renderFilterButton = (filter: typeof selectedFilter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderClientItem = ({ item }: { item: ClientInsight }) => (
    <TouchableOpacity style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <Image
          source={{
            uri: item.profilePictureUrl || `https://via.placeholder.com/50x50?text=${item.clientName.charAt(0)}`,
          }}
          style={styles.clientAvatar}
        />
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text style={styles.statusText}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.clientActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.clientStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalAppointments}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(item.totalSpent)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.averageRating.toFixed(1)} ⭐</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <View style={styles.clientFooter}>
        <Text style={styles.lastAppointment}>
          Last appointment: {formatDate(item.lastAppointment)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('active', 'Active')}
        {renderFilterButton('new', 'New')}
        {renderFilterButton('inactive', 'Inactive')}
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading clients...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.clientId.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadClients(true)}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default ClientManagementScreen;
