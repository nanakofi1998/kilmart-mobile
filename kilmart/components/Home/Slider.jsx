import React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

// Import images
import slider1 from "../../assets/images/black-friday.jpg";
import slider2 from "../../assets/images/new-year-discount.jpg";
import slider3 from "../../assets/images/christmas-promo.jpg";
import slider4 from "../../assets/images/image4.jpg";

// Constants
const { width } = Dimensions.get("screen");
const IMAGE_WIDTH = width - 20; // Adjust for padding/margin
const IMAGE_HEIGHT = 130;
const DOT_SIZE = 6;
const DOT_MARGIN = 4;

// Slider data
const sliderItems = [
  { id: "1", name: "Strawberry", image: slider1 },
  { id: "2", name: "Fruity", image: slider2 },
  { id: "3", name: "Brodo", image: slider3 },
  { id: "4", name: "Cheetos", image: slider4 },
];

const Slider = () => {
  const scrollX = useSharedValue(0);

  const onScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  // Precompute dot styles for pagination
  const dotStyles = sliderItems.map((_, index) => {
    return useAnimatedStyle(() => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ];

      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1.4, 0.8],
        Extrapolation.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.5, 1, 0.5],
        Extrapolation.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });
  });

  // Render each slide item
  const renderSlideItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.8}>
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Slider */}
      <Animated.FlatList
        data={sliderItems}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScroll={onScrollHandler}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={renderSlideItem}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {sliderItems.map((_, index) => (
          <Animated.View
            key={index}
            style={[styles.dot, dotStyles[index]]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  slide: {
    alignItems: "center",
    width: width,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowColor: '#000',
    shadowRadius: 5,
    elevation: 5, // Shadow effect for Android
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 20,
    marginHorizontal: 10, // Add some margin for better spacing
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#f1b811',
    marginHorizontal: DOT_MARGIN,
  },
});

export default React.memo(Slider);