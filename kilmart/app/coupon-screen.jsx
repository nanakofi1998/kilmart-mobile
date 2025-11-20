import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Dimensions, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '../utils/apiClient';
import { useAuth } from './AuthContext';

const { width } = Dimensions.get('window');

const CouponScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch coupons from API
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('api/v1/coupons/my-gifts/');
      
      if (response.data && Array.isArray(response.data)) {
        setCoupons(response.data);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError('Failed to load coupons. Please try again.');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopyCode = (code) => {
    Alert.alert('Copied!', `Coupon code ${code} copied to clipboard`);
  };

  const handleUseCoupon = (coupon) => {
    Alert.alert('Apply Coupon', `Apply ${coupon.code} to your order?`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleRetry = () => {
    fetchCoupons();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No expiry';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get discount text based on coupon type
  const getDiscountText = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% DISCOUNT`;
    } else if (coupon.discount_type === 'fixed') {
      return `GH₵${coupon.discount_value} OFF`;
    } else {
      return 'DISCOUNT';
    }
  };

  const HorizontalCouponCard = ({ coupon }) => (
    <View style={styles.couponContainer}>
      {/* Main Coupon Card - Horizontal Layout */}
      <View style={styles.couponCard}>
        
        {/* Left Section - Discount & Logo */}
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Image source={require('../assets/images/kwikmart.png')} style={styles.logoImage} />
            </View>
          </View>
          
          <View style={styles.discountSection}>
            <Text style={styles.discountAmount}>
              {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `GH₵${coupon.discount_value}`}
            </Text>
            <Text style={styles.discountType}>{getDiscountText(coupon)}</Text>
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Image source={require('../assets/images/kwikmart.png')} style={styles.logoImage} />
            </View>
          </View>
        </View>

        {/* Right Section - Details */}
        <View style={styles.rightSection}>
          <View style={styles.headerRight}>
            <Text style={styles.couponTitle}>GIFT COUPON</Text>
            <Text style={styles.couponSubtitle}>{coupon.name || 'Special Offer'}</Text>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>
              {coupon.description || `Use code ${coupon.code} for amazing savings`}
            </Text>
          </View>

          <View style={styles.detailsBottom}>
            <View style={styles.couponNumber}>
              <Text style={styles.couponNumberText}>{coupon.code}</Text>
            </View>
            
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>COUPON CODE</Text>
              <TouchableOpacity 
                style={styles.codeContainer}
                onPress={() => handleCopyCode(coupon.code)}
              >
                <Text style={styles.codeText}>{coupon.code}</Text>
                <Ionicons name="copy-outline" size={14} color="#f1b811" />
              </TouchableOpacity>
            </View>

            <View style={styles.validitySection}>
              <Text style={styles.validityLabel}>VALID UNTIL</Text>
              <Text style={styles.validityDate}>
                {coupon.valid_until ? formatDate(coupon.valid_until) : 'No expiry'}
              </Text>
            </View>

            {coupon.minimum_order_amount && (
              <View style={styles.minOrderSection}>
                <Text style={styles.minOrderLabel}>MIN. ORDER</Text>
                <Text style={styles.minOrderAmount}>GH₵{coupon.minimum_order_amount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Use Coupon Button */}
      <TouchableOpacity 
        style={[
          styles.useButton,
          coupon.is_used && styles.usedButton
        ]}
        onPress={() => handleUseCoupon(coupon)}
        disabled={coupon.is_used}
      >
        <Text style={[
          styles.useButtonText,
          coupon.is_used && styles.usedButtonText
        ]}>
          {coupon.is_used ? 'ALREADY USED' : 'USE THIS COUPON'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gift Coupons</Text>
            <Text style={styles.headerSubtitle}>
              Loading your coupons...
            </Text>
          </View>

          <View style={styles.headerRightIcon}>
            <Ionicons name="gift" size={28} color="#fff" />
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1b811" />
          <Text style={styles.loadingText}>Loading your coupons...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gift Coupons</Text>
            <Text style={styles.headerSubtitle}>
              Couldn't load coupons
            </Text>
          </View>

          <View style={styles.headerRightIcon}>
            <Ionicons name="gift" size={28} color="#fff" />
          </View>
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (coupons.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gift Coupons</Text>
            <Text style={styles.headerSubtitle}>
              No coupons available
            </Text>
          </View>

          <View style={styles.headerRightIcon}>
            <Ionicons name="gift" size={28} color="#fff" />
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="gift-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Coupons Yet</Text>
          <Text style={styles.emptyText}>
            You don't have any gift coupons at the moment.{'\n'}
            Check back later for special offers!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gift Coupons</Text>
          <Text style={styles.headerSubtitle}>
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} available
          </Text>
        </View>

        <View style={styles.headerRightIcon}>
          <Ionicons name="gift" size={28} color="#fff" />
        </View>
      </View>

      {/* Horizontal Coupons List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {coupons.map((coupon) => (
          <HorizontalCouponCard key={coupon.id} coupon={coupon} />
        ))}
        
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#f1b811" />
          <Text style={styles.infoText}>
            Present coupon code at checkout. One coupon per order.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#f1b811',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerRightIcon: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  couponContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  couponCard: {
    flexDirection: 'row',
    minHeight: 200,
  },
  leftSection: {
    width: '35%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRightWidth: 2,
    borderStyle: 'dashed',
    borderRightColor: '#000000ff',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#f1b811',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  discountSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  discountAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000ff',
    marginBottom: -2,
  },
  discountType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  rightSection: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  headerRight: {
    marginBottom: 10,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 1,
    marginBottom: 4,
  },
  couponSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f1b811',
  },
  descriptionSection: {
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontWeight: '500',
  },
  detailsBottom: {
    // Bottom section with code and validity
  },
  couponNumber: {
    marginBottom: 8,
  },
  couponNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 1,
  },
  codeSection: {
    marginBottom: 8,
  },
  codeLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  codeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#f1b811',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  validitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  validityLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  validityDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  minOrderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minOrderLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  minOrderAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  useButton: {
    backgroundColor: '#000000ff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  usedButton: {
    backgroundColor: '#ccc',
  },
  useButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  usedButtonText: {
    color: '#666',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f1b811',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#f1b811',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CouponScreen;