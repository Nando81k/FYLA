import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { serviceService } from '@/services/serviceService';
import { Service } from '@/types';
import ServiceModal from '@/components/provider/ServiceModal';

const ServicesScreen: React.FC = () => {
  const { token, user, isLoading: authLoading } = useAuth();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Create styles with theme
  const styles = createStyles(colors, typography, spacing, borderRadius, shadows);

  const loadServices = async (showLoader = true) => {
    if (!token || !user?.id) {
      setIsLoading(false);
      return;
    }
    
    const userId = user.id; // Extract userId after null check
    
    if (showLoader) setIsLoading(true);
    try {
      const servicesData = await serviceService.getProviderServices(userId);
      // Handle both ServiceListResponse and direct array response
      setServices(servicesData.services || servicesData);
    } catch (error) {
      console.error('❌ ServicesScreen loadServices error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load services'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token && user?.id) {
        loadServices();
      }
    }, [token, user?.id])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadServices(false);
  };

  const toggleServiceStatus = async (service: Service) => {
    if (!token) return;
    
    try {
      const updatedService = await serviceService.toggleServiceStatus(
        token,
        service.id,
        !service.isActive
      );
      
      setServices(prev => prev.map(s => 
        s.id === service.id ? updatedService : s
      ));
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update service'
      );
    }
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            
            try {
              await serviceService.deleteService(token, service.id);
              setServices(prev => prev.filter(s => s.id !== service.id));
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete service'
              );
            }
          },
        },
      ]
    );
  };

  const handleAddService = () => {
    setEditingService(null);
    setIsModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingService(null);
  };

  const handleServiceSuccess = (service: Service) => {
    if (editingService) {
      // Update existing service
      setServices(prev => prev.map(s => 
        s.id === service.id ? service : s
      ));
    } else {
      // Add new service
      setServices(prev => [service, ...prev]);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const renderServiceItem = ({ item: service }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.serviceDetails}>
            <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
            <Text style={styles.serviceDuration}>• {formatDuration(service.estimatedDurationMinutes)}</Text>
          </View>
        </View>
        
        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={[
              styles.statusToggle,
              service.isActive ? styles.activeToggle : styles.inactiveToggle
            ]}
            onPress={() => toggleServiceStatus(service)}
          >
            <Text style={[
              styles.statusText,
              service.isActive ? styles.activeText : styles.inactiveText
            ]}>
              {service.isActive ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {service.description && (
        <Text style={styles.serviceDescription}>{service.description}</Text>
      )}
      
      <View style={styles.serviceFooter}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditService(service)}
        >
          <Ionicons name="create" size={16} color={colors.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteService(service)}
        >
          <Ionicons name="trash" size={16} color={colors.status.error} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyStateTitle}>No Services Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first service to start accepting bookings from clients
      </Text>
      <TouchableOpacity 
        style={styles.addFirstServiceButton}
        onPress={handleAddService}
      >
        <Text style={styles.addFirstServiceButtonText}>Add Your First Service</Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading screen while authentication is being checked
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Services</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddService}
        >
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          services.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <ServiceModal
        visible={isModalVisible}
        onClose={handleModalClose}
        onSuccess={handleServiceSuccess}
        editingService={editingService}
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
    marginTop: spacing.lg,
    fontSize: typography.size.md,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.status.success,
  },
  serviceDuration: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  serviceActions: {
    marginLeft: spacing.lg,
  },
  statusToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  activeToggle: {
    backgroundColor: colors.status.success + '20',
    borderColor: colors.status.success,
  },
  inactiveToggle: {
    backgroundColor: colors.status.error + '20',
    borderColor: colors.status.error,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  activeText: {
    color: colors.status.success,
  },
  inactiveText: {
    color: colors.status.error,
  },
  serviceDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  deleteButton: {
    backgroundColor: colors.status.error + '10',
    borderColor: colors.status.error + '30',
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  deleteButtonText: {
    color: colors.status.error,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  addFirstServiceButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  addFirstServiceButtonText: {
    color: colors.text.inverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});

export default ServicesScreen;
