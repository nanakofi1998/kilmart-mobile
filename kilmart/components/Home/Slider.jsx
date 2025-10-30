import React, { useRef, useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  Animated,
  Text,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import apiClient from "../../utils/apiClient";

// Constants - Adjusted for better screen fit
const { width, height } = Dimensions.get("screen");
const IMAGE_WIDTH = width - 20;
const IMAGE_HEIGHT = 150;
const DOT_SIZE = 6;
const DOT_MARGIN = 5;
const SPACING = 15;
const CARD_MARGIN = (width - IMAGE_WIDTH) / 2;

// API endpoints configuration
const sliderEndpoints = [
  {
    id: "discounted",
    name: "Discounted",
    endpoint: "api/products/featured/discounted/",
    gradient: ['rgba(255,107,107,0.08)', 'rgba(118,75,162,0.08)'],
    glassGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    borderGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'],
    accentColor: '#FF6B6B'
  },
  {
    id: "seasonal",
    name: "Seasonal",
    endpoint: "api/products/featured/seasonal/",
    gradient: ['rgba(79,172,254,0.08)', 'rgba(0,242,254,0.08)'],
    glassGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    borderGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'],
    accentColor: '#4ECDC4'
  },
  {
    id: "origin",
    name: "Origin Specials",
    endpoint: "api/products/featured/origin/",
    gradient: ['rgba(67,233,123,0.08)', 'rgba(56,249,215,0.08)'],
    glassGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    borderGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'],
    accentColor: '#45B7D1'
  },
  {
    id: "new",
    name: "New Arrivals",
    endpoint: "api/products/featured/new/",
    gradient: ['rgba(250,112,154,0.08)', 'rgba(254,225,64,0.08)'],
    glassGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    borderGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'],
    accentColor: '#FF9A8B'
  },
  {
    id: "trending",
    name: "Trending Now",
    endpoint: "api/products/featured/trending/",
    gradient: ['rgba(168,237,234,0.08)', 'rgba(254,214,227,0.08)'],
    glassGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    borderGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'],
    accentColor: '#A78BFA'
  }
];

// Fallback data in case APIs fail
const fallbackSliderData = [
  {
    id: "discounted",
    name: "Discounted",
    title: "Discounted Products",
    subtitle: "Save big on selected items",
    gradient: ['rgba(255,107,107,0.08)', 'rgba(118,75,162,0.08)'],
    glassGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    borderGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'],
    accentColor: '#FF6B6B',
    image: require('../../assets/images/discounted.jpg')
  },
  {
    id: "seasonal",
    name: "Seasonal",
    title: "Seasonal Specials",
    subtitle: "Fresh picks for this season",
    gradient: ['rgba(79,172,254,0.08)', 'rgba(0,242,254,0.08)'],
    glassGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    borderGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'],
    accentColor: '#4ECDC4',
    image: require('../../assets/images/new-prod.jpg')
  },
  {
    id: "origin",
    name: "Origin Specials",
    title: "Origin Specials",
    subtitle: "Authentic products from source",
    gradient: ['rgba(67,233,123,0.08)', 'rgba(56,249,215,0.08)'],
    glassGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    borderGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'],
    accentColor: '#45B7D1',
    image: require('../../assets/images/origin.jpg')
  }
];

const EnhancedSlider = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const router = useRouter();

  const [sliderData, setSliderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  // Enhanced data structure for infinite loop
  const enhancedSliderData = sliderData.length > 0 ? [
    { ...sliderData[sliderData.length - 1], id: sliderData[sliderData.length - 1].id + '-clone-start' },
    ...sliderData,
    { ...sliderData[0], id: sliderData[0].id + '-clone-end' },
  ] : [];

  // Calculate the actual item width including margins
  const ITEM_WIDTH = IMAGE_WIDTH + SPACING;

  const fetchSliderData = async () => {
    try {
      setLoading(true);

      // Fetch data from all endpoints
      const promises = sliderEndpoints.map(async (config) => {
        try {
          const response = await apiClient.get(config.endpoint);
          const products = response.data?.results || response.data?.data || [];

          if (products.length > 0) {
            // Get the first product with an image, or fallback to first product
            const featuredProduct = products.find(product => product.product_image) || products[0];

            return {
              id: config.id,
              name: config.name,
              title: config.name,
              subtitle: featuredProduct?.name || `Discover ${config.name.toLowerCase()} products`,
              description: featuredProduct?.description,
              price: featuredProduct?.price ? `GH₵${featuredProduct.price}` : null,
              discountPrice: featuredProduct?.discount_price ? `GH₵${featuredProduct.discount_price}` : null,
              gradient: config.gradient,
              glassGradient: config.glassGradient,
              borderGradient: config.borderGradient,
              accentColor: config.accentColor,
              image: featuredProduct?.product_image,
              product: featuredProduct,
              type: 'api',
              productCount: products.length
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching ${config.name}:`, error.response?.status || error.message);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const successfulResults = results.filter(item => item !== null);

      if (successfulResults.length > 0) {
        setSliderData(successfulResults);
        setUseFallback(false);
        console.log(`Loaded ${successfulResults.length} featured categories`);
      } else {
        // Fallback to static data if all APIs fail
        setSliderData(fallbackSliderData);
        setUseFallback(true);
        console.log('Using fallback slider data');
      }
    } catch (error) {
      console.error('Error fetching slider data:', error);
      setSliderData(fallbackSliderData);
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliderData();
  }, []);

  // Auto-slide with proper infinite loop
  useEffect(() => {
    if (enhancedSliderData.length <= 2) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;

        if (nextIndex >= enhancedSliderData.length) {
          // Smoothly jump to the first real item without animation
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: ITEM_WIDTH, // First real item
              animated: false
            });
          }, 50);
          return 1;
        }

        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [enhancedSliderData.length, ITEM_WIDTH]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / ITEM_WIDTH);

        // Handle infinite scroll boundaries
        if (index === 0) {
          // Jump to the last real item
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: (enhancedSliderData.length - 2) * ITEM_WIDTH,
              animated: false
            });
          }, 50);
          setCurrentIndex(enhancedSliderData.length - 2);
        } else if (index === enhancedSliderData.length - 1) {
          // Jump to the first real item
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: ITEM_WIDTH,
              animated: false
            });
          }, 50);
          setCurrentIndex(1);
        } else {
          setCurrentIndex(index);
        }
      }
    }
  );

  const getItemLayout = (_, index) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

  const handleSlidePress = (item) => {
    if (!useFallback) {
      // Navigate to SliderProducts with the category to fetch ALL products
      router.push({
        pathname: '/SliderProducts',
        params: {
          category: item.name, // Pass the category name
          categoryId: item.id, // Pass the category ID
          title: item.title // Pass the title for display
        }
      });
    } else {
      // Navigate to search for fallback items
      router.push({
        pathname: '/search',
        params: {
          searchQuery: item.name
        }
      });
    }
  };

  // Enhanced iOS 26 style glassmorphism render item
  const renderSlideItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [8, 0, 8],
      extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slideWrapper, { width: ITEM_WIDTH }]}>
        <Animated.View
          style={{
            width: IMAGE_WIDTH,
            transform: [{ translateY }, { scale }],
            opacity,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleSlidePress(item)}
            style={styles.slideContainer}
          >
            {/* Base gradient background */}
            <LinearGradient
              colors={item.gradient}
              style={styles.gradientBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* iOS 26 style glass overlay */}
            <LinearGradient
              colors={item.glassGradient}
              style={styles.glassOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Main content with blur effect */}
            <BlurView
              intensity={Platform.OS === 'ios' ? 25 : 20}
              tint="systemUltraThinMaterial"
              style={styles.glassContainer}
            >
              <View style={styles.contentContainer}>
                {/* Text Content */}
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>

                  {/* Price display for real products */}
                  {item.discountPrice && (
                    <View style={styles.priceContainer}>
                      <Text style={styles.originalPrice}>{item.price}</Text>
                      <Text style={styles.discountPrice}>{item.discountPrice}</Text>
                    </View>
                  )}

                  {/* Product count for API data */}
                  {item.productCount && (
                    <Text style={styles.productCount}>
                      {item.productCount}+ products
                    </Text>
                  )}

                  <View style={[styles.ctaButton, { backgroundColor: item.accentColor }]}>
                    <Text style={styles.ctaText}>
                      {useFallback ? 'Explore' : (item.discountPrice ? 'Shop Deal' : 'Shop Now')}
                    </Text>
                  </View>
                </View>

                {/* Product Image */}
                <View style={styles.imageContainer}>
                  {item.image ? (
                    typeof item.image === 'string' ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.image}
                        defaultSource={require('../../assets/images/kwikmart_logo.png')}
                      />
                    ) : (
                      <Image source={item.image} style={styles.image} />
                    )
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                  )}
                  {/* Subtle floating elements */}
                  <View style={[styles.floatingCircle, { backgroundColor: item.accentColor + '20' }]} />
                  <View style={[styles.floatingCircle2, { backgroundColor: item.accentColor + '15' }]} />
                </View>
              </View>
            </BlurView>

            {/* Border gradient - iOS 26 style */}
            <LinearGradient
              colors={item.borderGradient}
              style={styles.borderOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Enhanced pagination
  const renderPagination = () => {
    if (sliderData.length === 0) return null;

    const realCurrentIndex = currentIndex === 0 ? sliderData.length - 1 :
      currentIndex === enhancedSliderData.length - 1 ? 0 :
        currentIndex - 1;

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.pagination}>
          {sliderData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === realCurrentIndex ? item.accentColor : 'rgba(255,255,255,0.3)',
                  transform: [{ scale: index === realCurrentIndex ? 1.2 : 0.8 }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.loadingText}>Loading featured products...</Text>
      </View>
    );
  }

  if (enhancedSliderData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Slider with proper centering */}
      <Animated.FlatList
        ref={flatListRef}
        data={enhancedSliderData}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={renderSlideItem}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.flatListContent}
        initialScrollIndex={1}
        disableIntervalMomentum={true}
        alwaysBounceHorizontal={false}
        bounces={false}
      />

      {/* Enhanced Pagination */}
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    marginBottom: 10,
  },
  flatListContent: {
    paddingVertical: 10,
  },
  slideWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    height: IMAGE_HEIGHT + 20,
  },
  slideContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  glassContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000ff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 8,
    lineHeight: 16,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: 'rgba(255, 0, 0, 0.7)',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000ff',
  },
  productCount: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
    fontWeight: '500',
  },
  ctaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: 12,
    zIndex: 2,
    transform: [{ rotate: '5deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  placeholderImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '500',
  },
  floatingCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: 0,
    right: -10,
    zIndex: 1,
  },
  floatingCircle2: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    bottom: 5,
    left: -5,
    zIndex: 1,
  },
  paginationContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginHorizontal: DOT_MARGIN,
  },
  loadingContainer: {
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: CARD_MARGIN,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default React.memo(EnhancedSlider);