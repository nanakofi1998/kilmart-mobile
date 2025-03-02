import React, { useRef } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  Animated,
} from "react-native";

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
  const scrollX = useRef(new Animated.Value(0)).current;

  // Render each slide item
  const renderSlideItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.8}>
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
      </View>
    </TouchableOpacity>
  );

  // Render pagination dots
  const renderPagination = () => {
    const dotPosition = Animated.divide(scrollX, width);

    return (
      <View style={styles.pagination}>
        {sliderItems.map((_, index) => {
          const opacity = dotPosition.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.5, 1, 0.5],
            extrapolate: "clamp",
          });

          const scale = dotPosition.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.8, 1.4, 0.8],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Slider */}
      <Animated.FlatList
        data={sliderItems}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={renderSlideItem}
      />

      {/* Pagination Dots */}
      {renderPagination()}
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