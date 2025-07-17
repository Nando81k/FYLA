import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { serviceService, CreateServiceRequest } from '@/services/serviceService';
import { Service } from '@/types';

interface ServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (service: Service) => void;
  editingService?: Service | null;
}

interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  estimatedDurationMinutes: string;
  isActive: boolean;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editingService,
}) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!editingService;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      estimatedDurationMinutes: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (visible) {
      if (editingService) {
        // Populate form with existing service data
        reset({
          name: editingService.name,
          description: editingService.description || '',
          price: editingService.price.toString(),
          estimatedDurationMinutes: editingService.estimatedDurationMinutes.toString(),
          isActive: editingService.isActive,
        });
      } else {
        // Reset form for new service
        reset({
          name: '',
          description: '',
          price: '',
          estimatedDurationMinutes: '',
          isActive: true,
        });
      }
    }
  }, [visible, editingService, reset]);

  const onSubmit = async (data: ServiceFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const serviceData: CreateServiceRequest = {
        name: data.name.trim(),
        description: data.description.trim(),
        price: parseFloat(data.price),
        estimatedDurationMinutes: parseInt(data.estimatedDurationMinutes),
        isActive: data.isActive,
      };

      let result: Service;
      
      if (isEditing && editingService) {
        result = await serviceService.updateService(token, editingService.id, serviceData);
      } else {
        result = await serviceService.createService(token, serviceData);
      }

      onSuccess(result);
      onClose();
      
      Alert.alert(
        'Success',
        `Service ${isEditing ? 'updated' : 'created'} successfully!`
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error 
          ? error.message 
          : `Failed to ${isEditing ? 'update' : 'create'} service`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDurationInput = (text: string) => {
    // Only allow numbers
    return text.replace(/[^0-9]/g, '');
  };

  const formatPriceInput = (text: string) => {
    // Allow numbers and one decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    const parts = cleanText.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanText;
  };

  const getDurationDisplay = (minutes: string): string => {
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins === 0) return '';
    
    if (mins < 60) {
      return `${mins} minutes`;
    }
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (remainingMins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Edit Service' : 'Add New Service'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Service Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Service Name *</Text>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Service name is required',
                  minLength: {
                    value: 2,
                    message: 'Service name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 50,
                    message: 'Service name must be less than 50 characters',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="e.g. Men's Haircut, Manicure, Facial"
                    placeholderTextColor="#999"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    maxLength={50}
                  />
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <Controller
                control={control}
                name="description"
                rules={{
                  maxLength: {
                    value: 200,
                    message: 'Description must be less than 200 characters',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                    placeholder="Describe your service in detail..."
                    placeholderTextColor="#999"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                )}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
            </View>

            {/* Price */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Price *</Text>
              <Controller
                control={control}
                name="price"
                rules={{
                  required: 'Price is required',
                  validate: (value) => {
                    const price = parseFloat(value);
                    if (isNaN(price)) return 'Please enter a valid price';
                    if (price <= 0) return 'Price must be greater than 0';
                    if (price > 10000) return 'Price must be less than $10,000';
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={[styles.input, styles.priceInput, errors.price && styles.inputError]}
                      placeholder="0.00"
                      placeholderTextColor="#999"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={(text) => onChange(formatPriceInput(text))}
                      keyboardType="decimal-pad"
                    />
                  </View>
                )}
              />
              {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
            </View>

            {/* Duration */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Estimated Duration (minutes) *</Text>
              <Controller
                control={control}
                name="estimatedDurationMinutes"
                rules={{
                  required: 'Duration is required',
                  validate: (value) => {
                    const duration = parseInt(value);
                    if (isNaN(duration)) return 'Please enter a valid duration';
                    if (duration <= 0) return 'Duration must be greater than 0';
                    if (duration > 480) return 'Duration must be less than 8 hours (480 minutes)';
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <TextInput
                      style={[styles.input, errors.estimatedDurationMinutes && styles.inputError]}
                      placeholder="30"
                      placeholderTextColor="#999"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={(text) => onChange(formatDurationInput(text))}
                      keyboardType="numeric"
                    />
                    {value && !errors.estimatedDurationMinutes && (
                      <Text style={styles.durationHelper}>
                        {getDurationDisplay(value)}
                      </Text>
                    )}
                  </View>
                )}
              />
              {errors.estimatedDurationMinutes && (
                <Text style={styles.errorText}>{errors.estimatedDurationMinutes.message}</Text>
              )}
            </View>

            {/* Active Status */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Active Service</Text>
                <Text style={styles.switchDescription}>
                  Clients can book this service when active
                </Text>
              </View>
              <Controller
                control={control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#f3f4f6', true: '#dcfce7' }}
                    thumbColor={value ? '#059669' : '#d1d5db'}
                  />
                )}
              />
            </View>

            {/* Common Duration Examples */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Common Durations:</Text>
              <View style={styles.examplesList}>
                <Text style={styles.exampleItem}>• Quick services: 15-30 minutes</Text>
                <Text style={styles.exampleItem}>• Haircuts: 30-60 minutes</Text>
                <Text style={styles.exampleItem}>• Facials/Massages: 60-90 minutes</Text>
                <Text style={styles.exampleItem}>• Hair coloring: 120-180 minutes</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Service' : 'Create Service'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: 'white',
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  durationHelper: {
    fontSize: 14,
    color: '#059669',
    marginTop: 4,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  switchLabel: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  examplesContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  examplesList: {
    gap: 4,
  },
  exampleItem: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ServiceModal;
