import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { reviewService, CreateReviewRequest } from '@/services/reviewService';
import { Appointment, Review } from '@/types';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (review: Review) => void;
  appointment: Appointment;
  existingReview?: Review;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  onSuccess,
  appointment,
  existingReview,
}) => {
  const { token } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    try {
      let review: Review;

      if (existingReview) {
        // Update existing review
        review = await reviewService.updateReview(token, existingReview.id, {
          rating,
          comment: comment.trim() || undefined,
        });
      } else {
        // Create new review
        const reviewData: CreateReviewRequest = {
          appointmentId: appointment.id,
          providerId: appointment.providerId,
          rating,
          comment: comment.trim() || undefined,
        };

        // Using mock service for now
        review = await reviewService.createMockReview(reviewData);
      }

      onSuccess(review);
      onClose();

      Alert.alert(
        'Review Submitted',
        existingReview 
          ? 'Your review has been updated successfully!'
          : 'Thank you for your feedback!'
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const renderStarRating = () => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            disabled={isSubmitting}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#fbbf24' : '#d1d5db'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.closeButton}
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Provider Info */}
          <View style={styles.providerSection}>
            <Image
              source={{
                uri: appointment.provider?.profilePictureUrl || 'https://via.placeholder.com/60x60?text=?',
              }}
              style={styles.providerImage}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>
                {appointment.provider?.fullName || 'Provider'}
              </Text>
              <Text style={styles.appointmentDate}>
                {new Date(appointment.scheduledStartTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Services */}
          {appointment.services && appointment.services.length > 0 && (
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Services:</Text>
              {appointment.services.map((service, index) => (
                <Text key={index} style={styles.serviceItem}>
                  • {service.service?.name || 'Service'}
                </Text>
              ))}
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            {renderStarRating()}
            <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
          </View>

          {/* Comment */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Your Review (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience with other clients..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              editable={!isSubmitting}
            />
            <Text style={styles.characterCount}>
              {comment.length}/500 characters
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (rating === 0 || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {existingReview ? 'Update Review' : 'Submit Review'}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  providerSection: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  servicesSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  serviceItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  ratingSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  commentSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewModal;
