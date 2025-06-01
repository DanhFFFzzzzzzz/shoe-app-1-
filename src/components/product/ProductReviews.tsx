import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/database.types';
import { useToast } from 'react-native-toast-notifications';
import { useAuth } from '../../providers/auth-provider';

type ProductReviewsProps = {
  productId: number;
  orderId?: number;
};

export const ProductReviews = ({ productId, orderId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Tables<'product_review'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [myReview, setMyReview] = useState<Tables<'product_review'> | null>(null);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [productId, orderId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_review')
        .select(`
          *,
          user:users!product_review_user_fkey(name)
        `)
        .eq('product', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        let found;
        if (orderId) {
          found = (data || []).find(
            r => r.user === authUser.id && r.product === productId && r.order === orderId
          );
        } else {
          found = (data || []).find(
            r => r.user === authUser.id && r.product === productId
          );
        }
        setHasReviewed(!!found);
        setMyReview(found || null);
        setCanReview(prev => prev && !found);
      } else {
        setHasReviewed(false);
        setMyReview(null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !authUser) return;

      if (orderId) {
        const { data: order, error: orderError } = await supabase
          .from('order')
          .select('status')
          .eq('id', orderId)
          .single();

        if (orderError) return;

        const { data: orderItems, error: itemError } = await supabase
          .from('order_item')
          .select('product')
          .eq('order', orderId);

        if (itemError) return;

        const hasProduct = orderItems?.some(item => item.product === productId);
        const status = order?.status?.toLowerCase() || '';
        const isCompleted = status.includes('hoàn thành') || status === 'completed';

        if (isCompleted && hasProduct) {
          const { data: reviews, error: reviewError } = await supabase
            .from('product_review')
            .select('id')
            .eq('product', productId)
            .eq('user', authUser.id)
            .eq('order', orderId);

          if (reviewError) return;

          setCanReview(!reviews || reviews.length === 0);
        } else {
          setCanReview(false);
        }
      } else {
        const { data: orders, error: ordersError } = await supabase
          .from('order')
          .select(`
            id,
            order_item (
              product
            )
          `)
          .eq('user', authUser.id)
          .in('status', ['completed', 'hoàn thành']);

        if (ordersError) return;

        const hasPurchased = orders?.some(order =>
          order.order_item?.some(item => item.product === productId)
        );

        const { data: reviews, error: reviewError } = await supabase
          .from('product_review')
          .select('id')
          .eq('product', productId)
          .eq('user', authUser.id);

        if (reviewError) return;

        setCanReview(!!hasPurchased && (!reviews || reviews.length === 0));
      }
    } catch (error) {
      console.error('❌ Error checking review eligibility:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!userRating) {
      toast.show('Vui lòng chọn số sao đánh giá', {
        type: 'warning',
        placement: 'top',
      });
      return;
    }
  
    try {
      setSubmitting(true);
  
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Phiên đăng nhập không hợp lệ');
      }
  
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Bạn cần đăng nhập để đánh giá');
  
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(authUser.id)) {
        throw new Error('ID người dùng không hợp lệ, không phải UUID');
      }
      console.log('Current authUser.id:', authUser.id);
  
      let alreadyReviewed = false;
      if (orderId) {
        const { data: reviews } = await supabase
          .from('product_review')
          .select('id')
          .eq('product', productId)
          .eq('user', authUser.id)
          .eq('order', orderId);
        alreadyReviewed = !!(reviews && reviews.length > 0);
      } else {
        const { data: reviews } = await supabase
          .from('product_review')
          .select('id')
          .eq('product', productId)
          .eq('user', authUser.id);
        alreadyReviewed = !!(reviews && reviews.length > 0);
      }
  
      if (alreadyReviewed) {
        toast.show('Bạn chỉ được đánh giá 1 lần cho sản phẩm này trong đơn hàng này!', {
          type: 'warning',
          placement: 'top',
        });
        setSubmitting(false);
        fetchReviews();
        return;
      }
  
      const insertData: any = {
        product: productId,
        user: authUser.id,
        rating: userRating,
        comment,
      };
      if (orderId) insertData.order = orderId;
  
      console.log('📥 Inserting review data:', insertData);
  
      const { error } = await supabase.from('product_review').insert(insertData);
  
      if (error) throw error;
  
      toast.show('Đánh giá thành công!', {
        type: 'success',
        placement: 'top',
      });
  
      setUserRating(0);
      setComment('');
      fetchReviews();
    } catch (error: any) {
      console.error('❌ Error when submitting review:', error);
      toast.show(error.message || 'Có lỗi xảy ra khi gửi đánh giá', {
        type: 'error',
        placement: 'top',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size: number = 20) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? 'star' : 'star-border'}
            size={size}
            color={star <= rating ? '#FFD700' : '#ccc'}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đánh giá sản phẩm</Text>

      {canReview && !hasReviewed && (
        <View style={styles.reviewForm}>
          <Text style={styles.formLabel}>Đánh giá của bạn</Text>
          <View style={styles.ratingInput}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setUserRating(star)}
                style={styles.starButton}
              >
                <MaterialIcons
                  name={star <= userRating ? 'star' : 'star-border'}
                  size={30}
                  color={star <= userRating ? '#FFD700' : '#ccc'}
                />
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="Viết nhận xét của bạn..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />
          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitReview}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
            )}
          </Pressable>
        </View>
      )}
      {canReview && hasReviewed && (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Text style={{ color: '#4caf50', fontWeight: 'bold' }}>Bạn đã đánh giá sản phẩm này!</Text>
        </View>
      )}

      <View style={styles.reviewsList}>
        <Text style={styles.reviewsTitle}>Đánh giá từ khách hàng</Text>
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>Chưa có đánh giá nào</Text>
        ) : (
          reviews.map(item => (
            <View key={item.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>
                  {item.user && item.user.name ? item.user.name : 'Khách hàng'}
                </Text>
                <Text style={styles.reviewDate}>
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              {renderStars(item.rating)}
              {item.comment && (
                <Text style={styles.reviewComment}>{item.comment}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  reviewForm: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  ratingInput: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsList: {
    marginTop: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  noReviews: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 16,
  },
  reviewItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerName: {
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    color: '#666',
    fontSize: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewComment: {
    color: '#444',
    lineHeight: 20,
    marginTop: 8,
  },
}); 