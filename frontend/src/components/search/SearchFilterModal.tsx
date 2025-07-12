import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchFilters, PriceRange, SortOption } from '@/types/search';

interface SearchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
  initialFilters: SearchFilters;
}

const SORT_OPTIONS: Array<{ key: SortOption; label: string }> = [
  { key: 'relevance', label: 'Most Relevant' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'distance', label: 'Nearest First' },
  { key: 'newest', label: 'Newest First' },
];

const AVAILABILITY_OPTIONS = [
  { key: 'today', label: 'Available Today' },
  { key: 'this_week', label: 'This Week' },
  { key: 'next_week', label: 'Next Week' },
];

const SERVICE_CATEGORIES = [
  'Hair & Beauty',
  'Wellness & Fitness',
  'Spa & Relaxation',
  'Skincare & Facials',
  'Nails & Manicure',
  'Massage Therapy',
  'Makeup & Styling',
  'Personal Training',
];

const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handlePriceRangeChange = (field: keyof PriceRange, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value);
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [field]: numValue,
      },
    }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...(prev.categories || []), category],
    }));
  };

  const toggleAvailability = (availability: string) => {
    setFilters(prev => ({
      ...prev,
      availability: prev.availability?.date === availability ? undefined : { date: availability },
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      minRating: prev.minRating === rating ? undefined : rating,
    }));
  };

  const resetFilters = () => {
    setFilters({
      sortBy: 'relevance',
      priceRange: {},
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <TouchableOpacity
        key={i}
        onPress={() => handleRatingChange(i + 1)}
        style={styles.starButton}
      >
        <Ionicons
          name="star"
          size={24}
          color={i < rating ? '#fbbf24' : '#e5e7eb'}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sort By */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionRow,
                  filters.sortBy === option.key && styles.optionRowSelected,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: option.key }))}
              >
                <Text style={[
                  styles.optionText,
                  filters.sortBy === option.key && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
                {filters.sortBy === option.key && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceInputRow}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>Min</Text>
                <TextInput
                  style={styles.priceInput}
                  value={filters.priceRange?.min?.toString() || ''}
                  onChangeText={(value) => handlePriceRangeChange('min', value)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.priceSeparator}>-</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>Max</Text>
                <TextInput
                  style={styles.priceInput}
                  value={filters.priceRange?.max?.toString() || ''}
                  onChangeText={(value) => handlePriceRangeChange('max', value)}
                  placeholder="500"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {SERVICE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.optionRow,
                  filters.categories?.includes(category) && styles.optionRowSelected,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={[
                  styles.optionText,
                  filters.categories?.includes(category) && styles.optionTextSelected,
                ]}>
                  {category}
                </Text>
                {filters.categories?.includes(category) && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingOption,
                    filters.minRating === rating && styles.ratingOptionSelected,
                  ]}
                  onPress={() => handleRatingChange(rating)}
                >
                  <View style={styles.ratingRow}>
                    {renderStars(rating)}
                    <Text style={styles.ratingText}>& up</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            {AVAILABILITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionRow,
                  filters.availability?.date === option.key && styles.optionRowSelected,
                ]}
                onPress={() => toggleAvailability(option.key)}
              >
                <Text style={[
                  styles.optionText,
                  filters.availability?.date === option.key && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
                {filters.availability?.date === option.key && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Distance (if location available) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance</Text>
            <View style={styles.distanceRow}>
              <Text style={styles.distanceLabel}>
                Within {filters.maxDistance || 25} km
              </Text>
              {/* TODO: Add slider component for distance */}
            </View>
            <View style={styles.locationRow}>
              <Switch
                value={filters.nearMe || false}
                onValueChange={(value) => setFilters(prev => ({ ...prev, nearMe: value }))}
                trackColor={{ false: '#e5e7eb', true: '#bfdbfe' }}
                thumbColor={filters.nearMe ? '#3b82f6' : '#f3f4f6'}
              />
              <Text style={styles.locationText}>Use my current location</Text>
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  resetButton: {
    padding: 4,
  },
  resetText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionRowSelected: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  priceSeparator: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 20,
  },
  ratingContainer: {
    gap: 8,
  },
  ratingOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ratingOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  distanceRow: {
    marginBottom: 16,
  },
  distanceLabel: {
    fontSize: 15,
    color: '#374151',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    fontSize: 15,
    color: '#374151',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchFilterModal;
