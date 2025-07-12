import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { useNotifications } from '@/context/NotificationContext';
import {
  BookingPackage,
  ServiceDetails,
} from '@/types/booking';
import { Service } from '@/types';

const PackageManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    packages,
    services,
    loading,
    error,
    fetchPackages,
    clearError,
  } = useBooking();
  const { showNotification } = useNotifications();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<BookingPackage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Create/Edit form state
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [totalSessions, setTotalSessions] = useState('');
  const [validityDays, setValidityDays] = useState('365');
  const [price, setPrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('10');
  const [isTransferrable, setIsTransferrable] = useState(false);
  const [terms, setTerms] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Mock services data - in real app this would come from the booking context
  const mockServices: ServiceDetails[] = [
    {
      id: '1',
      name: 'Haircut',
      description: 'Professional haircut',
      duration: 60,
      price: 50,
      category: 'Hair',
      providerId: user?.id || 0,
      isActive: true,
      bookingBuffer: 15,
      advanceBookingDays: 30,
      cancellationPolicy: {
        id: 'policy_1',
        name: 'Standard Policy',
        description: '24 hour cancellation policy',
        noticePeriodHours: 24,
        penaltyPercentage: 50,
        refundPolicy: '50% refund with 24+ hours notice',
      },
    },
    {
      id: '2',
      name: 'Hair Wash & Style',
      description: 'Wash and styling service',
      duration: 45,
      price: 35,
      category: 'Hair',
      providerId: user?.id || 0,
      isActive: true,
      bookingBuffer: 15,
      advanceBookingDays: 30,
      cancellationPolicy: {
        id: 'policy_1',
        name: 'Standard Policy',
        description: '24 hour cancellation policy',
        noticePeriodHours: 24,
        penaltyPercentage: 50,
        refundPolicy: '50% refund with 24+ hours notice',
      },
    },
    {
      id: '3',
      name: 'Hair Color',
      description: 'Professional hair coloring',
      duration: 120,
      price: 120,
      category: 'Hair',
      providerId: user?.id || 0,
      isActive: true,
      bookingBuffer: 30,
      advanceBookingDays: 30,
      cancellationPolicy: {
        id: 'policy_1',
        name: 'Standard Policy',
        description: '24 hour cancellation policy',
        noticePeriodHours: 24,
        penaltyPercentage: 50,
        refundPolicy: '50% refund with 24+ hours notice',
      },
    },
  ];

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchPackages(user.id);
      }
    }, [user?.id])
  );

  const resetForm = () => {
    setPackageName('');
    setPackageDescription('');
    setSelectedServiceIds([]);
    setTotalSessions('');
    setValidityDays('365');
    setPrice('');
    setDiscountPercentage('10');
    setIsTransferrable(false);
    setTerms('');
    setIsActive(true);
  };

  const fillFormWithPackage = (pkg: BookingPackage) => {
    setPackageName(pkg.name);
    setPackageDescription(pkg.description);
    setSelectedServiceIds(pkg.serviceIds);
    setTotalSessions(pkg.totalSessions.toString());
    setValidityDays(pkg.validityDays.toString());
    setPrice(pkg.price.toString());
    setDiscountPercentage(pkg.discountPercentage.toString());
    setIsTransferrable(pkg.isTransferrable);
    setTerms(pkg.terms);
    setIsActive(pkg.isActive);
  };

  const calculateOriginalPrice = (): number => {
    if (selectedServiceIds.length === 0 || !totalSessions) return 0;
    
    const selectedServices = mockServices.filter(service => 
      selectedServiceIds.includes(service.id)
    );
    const servicePrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
    return servicePrice * parseInt(totalSessions);
  };

  const calculateSavings = (): number => {
    const originalPrice = calculateOriginalPrice();
    const packagePrice = parseFloat(price) || 0;
    return originalPrice - packagePrice;
  };

  const validateForm = (): boolean => {
    if (!packageName.trim()) {
      Alert.alert('Error', 'Package name is required');
      return false;
    }
    if (selectedServiceIds.length === 0) {
      Alert.alert('Error', 'Please select at least one service');
      return false;
    }
    if (!totalSessions || parseInt(totalSessions) < 1) {
      Alert.alert('Error', 'Total sessions must be at least 1');
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Price must be greater than 0');
      return false;
    }
    if (!validityDays || parseInt(validityDays) < 1) {
      Alert.alert('Error', 'Validity days must be at least 1');
      return false;
    }
    return true;
  };

  const handleCreatePackage = async () => {
    if (!validateForm()) return;
    if (!user?.id) return;

    const newPackage: Omit<BookingPackage, 'id' | 'createdAt'> = {
      providerId: user.id,
      name: packageName,
      description: packageDescription,
      serviceIds: selectedServiceIds,
      totalSessions: parseInt(totalSessions),
      validityDays: parseInt(validityDays),
      price: parseFloat(price),
      discountPercentage: parseFloat(discountPercentage),
      isTransferrable,
      terms,
      isActive,
    };

    try {
      // TODO: Implement createPackage in booking service
      // await createPackage(newPackage);
      
      showNotification({
        type: 'success',
        title: 'Package Created',
        message: 'Booking package has been created successfully',
      });
      
      setShowCreateModal(false);
      resetForm();
      
      // Refresh packages
      if (user?.id) {
        fetchPackages(user.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create package');
    }
  };

  const handleEditPackage = async () => {
    if (!validateForm() || !selectedPackage) return;

    const updatedPackage: Partial<BookingPackage> = {
      name: packageName,
      description: packageDescription,
      serviceIds: selectedServiceIds,
      totalSessions: parseInt(totalSessions),
      validityDays: parseInt(validityDays),
      price: parseFloat(price),
      discountPercentage: parseFloat(discountPercentage),
      isTransferrable,
      terms,
      isActive,
    };

    try {
      // TODO: Implement updatePackage in booking service
      // await updatePackage(selectedPackage.id, updatedPackage);
      
      showNotification({
        type: 'success',
        title: 'Package Updated',
        message: 'Booking package has been updated successfully',
      });
      
      setShowEditModal(false);
      setSelectedPackage(null);
      resetForm();
      
      // Refresh packages
      if (user?.id) {
        fetchPackages(user.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update package');
    }
  };

  const handleDeletePackage = (pkg: BookingPackage) => {
    Alert.alert(
      'Delete Package',
      `Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement deletePackage in booking service
              // await deletePackage(pkg.id);
              
              showNotification({
                type: 'success',
                title: 'Package Deleted',
                message: 'Booking package has been deleted successfully',
              });
              
              // Refresh packages
              if (user?.id) {
                fetchPackages(user.id);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete package');
            }
          },
        },
      ]
    );
  };

  const handleTogglePackageStatus = async (pkg: BookingPackage) => {
    try {
      // TODO: Implement togglePackageStatus in booking service
      // await togglePackageStatus(pkg.id, !pkg.isActive);
      
      showNotification({
        type: 'success',
        title: 'Package Updated',
        message: `Package ${!pkg.isActive ? 'activated' : 'deactivated'}`,
      });
      
      // Refresh packages
      if (user?.id) {
        fetchPackages(user.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update package status');
    }
  };

  const renderServiceSelection = () => (
    <View style={styles.serviceSelection}>
      <Text style={styles.inputLabel}>Services Included</Text>
      {mockServices.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.serviceOption,
            selectedServiceIds.includes(service.id) && styles.serviceOptionSelected,
          ]}
          onPress={() => {
            if (selectedServiceIds.includes(service.id)) {
              setSelectedServiceIds(prev => prev.filter(id => id !== service.id));
            } else {
              setSelectedServiceIds(prev => [...prev, service.id]);
            }
          }}
        >
          <View style={styles.serviceInfo}>
            <Text style={[
              styles.serviceName,
              selectedServiceIds.includes(service.id) && styles.serviceNameSelected,
            ]}>
              {service.name}
            </Text>
            <Text style={styles.servicePrice}>${service.price}</Text>
          </View>
          <Ionicons
            name={selectedServiceIds.includes(service.id) ? 'checkbox' : 'square-outline'}
            size={24}
            color={selectedServiceIds.includes(service.id) ? '#007AFF' : '#C7C7CC'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPackageCard = ({ item: pkg }: { item: BookingPackage }) => {
    const includedServices = mockServices.filter(service => 
      pkg.serviceIds.includes(service.id)
    );

    return (
      <View style={[styles.packageCard, !pkg.isActive && styles.packageCardInactive]}>
        <View style={styles.packageHeader}>
          <View style={styles.packageInfo}>
            <Text style={styles.packageName}>{pkg.name}</Text>
            <Text style={styles.packageDescription}>{pkg.description}</Text>
          </View>
          <View style={styles.packageActions}>
            <Switch
              value={pkg.isActive}
              onValueChange={() => handleTogglePackageStatus(pkg)}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#FFF"
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedPackage(pkg);
                fillFormWithPackage(pkg);
                setShowEditModal(true);
              }}
            >
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePackage(pkg)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.packageDetails}>
          <View style={styles.packageStat}>
            <Text style={styles.packageStatValue}>{pkg.totalSessions}</Text>
            <Text style={styles.packageStatLabel}>Sessions</Text>
          </View>
          <View style={styles.packageStat}>
            <Text style={styles.packageStatValue}>{pkg.validityDays}</Text>
            <Text style={styles.packageStatLabel}>Days Valid</Text>
          </View>
          <View style={styles.packageStat}>
            <Text style={styles.packageStatValue}>{pkg.discountPercentage}%</Text>
            <Text style={styles.packageStatLabel}>Discount</Text>
          </View>
          <View style={styles.packageStat}>
            <Text style={[styles.packageStatValue, styles.packagePrice]}>${pkg.price}</Text>
            <Text style={styles.packageStatLabel}>Price</Text>
          </View>
        </View>

        <View style={styles.servicesIncluded}>
          <Text style={styles.servicesLabel}>Services Included:</Text>
          {includedServices.map((service, index) => (
            <Text key={service.id} style={styles.serviceIncluded}>
              • {service.name} (${service.price})
            </Text>
          ))}
        </View>

        {pkg.terms && (
          <View style={styles.packageTerms}>
            <Text style={styles.termsLabel}>Terms:</Text>
            <Text style={styles.termsText}>{pkg.terms}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFormModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (isEdit) {
          setShowEditModal(false);
          setSelectedPackage(null);
        } else {
          setShowCreateModal(false);
        }
        resetForm();
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              if (isEdit) {
                setShowEditModal(false);
                setSelectedPackage(null);
              } else {
                setShowCreateModal(false);
              }
              resetForm();
            }}
          >
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit Package' : 'Create Package'}
          </Text>
          <TouchableOpacity
            onPress={isEdit ? handleEditPackage : handleCreatePackage}
            disabled={loading.creating || loading.updating}
          >
            {loading.creating || loading.updating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.modalSave}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Package Name *</Text>
            <TextInput
              style={styles.textInput}
              value={packageName}
              onChangeText={setPackageName}
              placeholder="e.g., 5-Session Hair Package"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={packageDescription}
              onChangeText={setPackageDescription}
              placeholder="Describe what's included in this package..."
              multiline
              numberOfLines={3}
            />
          </View>

          {renderServiceSelection()}

          <View style={styles.inputRow}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Total Sessions *</Text>
              <TextInput
                style={styles.textInput}
                value={totalSessions}
                onChangeText={setTotalSessions}
                placeholder="10"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Valid for (Days) *</Text>
              <TextInput
                style={styles.textInput}
                value={validityDays}
                onChangeText={setValidityDays}
                placeholder="365"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Package Price *</Text>
              <TextInput
                style={styles.textInput}
                value={price}
                onChangeText={setPrice}
                placeholder="400"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Discount %</Text>
              <TextInput
                style={styles.textInput}
                value={discountPercentage}
                onChangeText={setDiscountPercentage}
                placeholder="10"
                keyboardType="numeric"
              />
            </View>
          </View>

          {selectedServiceIds.length > 0 && totalSessions && (
            <View style={styles.pricingBreakdown}>
              <Text style={styles.breakdownTitle}>Pricing Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Original Price:</Text>
                <Text style={styles.breakdownValue}>${calculateOriginalPrice().toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Package Price:</Text>
                <Text style={styles.breakdownValue}>${parseFloat(price || '0').toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Client Saves:</Text>
                <Text style={[styles.breakdownValue, styles.savingsValue]}>
                  ${calculateSavings().toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.switchGroup}>
            <Text style={styles.inputLabel}>Transferrable</Text>
            <Switch
              value={isTransferrable}
              onValueChange={setIsTransferrable}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Terms & Conditions</Text>
            <TextInput
              style={styles.textArea}
              value={terms}
              onChangeText={setTerms}
              placeholder="Package terms and conditions..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.inputLabel}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Package Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={packages}
        renderItem={renderPackageCard}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading.bookings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateTitle}>No Packages Yet</Text>
              <Text style={styles.emptyStateMessage}>
                Create booking packages to offer discounted service bundles to your clients
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Create Your First Package</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {renderFormModal(false)}
      {renderFormModal(true)}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  packageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  packageCardInactive: {
    opacity: 0.6,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
  },
  packageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  packageStat: {
    alignItems: 'center',
    flex: 1,
  },
  packageStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  packageStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  packagePrice: {
    color: '#007AFF',
  },
  servicesIncluded: {
    marginBottom: 12,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceIncluded: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  packageTerms: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  termsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 50,
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
    marginHorizontal: -4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  serviceSelection: {
    marginBottom: 20,
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginBottom: 8,
  },
  serviceOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  serviceNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 14,
    color: '#666',
  },
  pricingBreakdown: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  savingsValue: {
    color: '#34C759',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
});

export default PackageManagementScreen;
