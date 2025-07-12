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
import { serviceService } from '@/services/serviceService';
import { Service } from '@/types';
import ServiceModal from '@/components/provider/ServiceModal';

const ServicesScreen: React.FC = () => {
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const loadServices = async (showLoader = true) => {
    if (!token) return;
    
    if (showLoader) setIsLoading(true);
    try {
      const servicesData = await serviceService.getProviderServices(token);
      setServices(servicesData);
    } catch (error) {
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
      loadServices();
    }, [token])
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
          <Ionicons name="create" size={16} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteService(service)}
        >
          <Ionicons name="trash" size={16} color="#ef4444" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list" size={64} color="#d1d5db" />
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Services</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddService}
        >
          <Ionicons name="add" size={24} color="white" />
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
            tintColor="#8b5cf6"
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
  addButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  serviceActions: {
    marginLeft: 16,
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeToggle: {
    backgroundColor: '#dcfce7',
    borderColor: '#059669',
  },
  inactiveToggle: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#dc2626',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 4,
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstServiceButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFirstServiceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServicesScreen;
