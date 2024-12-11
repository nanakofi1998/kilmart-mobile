import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  Text
} from "react-native";
import React from "react";
import slider1 from "../../assets/images/image1.jpg";
import slider2 from "../../assets/images/image2.jpg";
import slider3 from "../../assets/images/image3.jpg";
import slider4 from "../../assets/images/image4.jpg";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

const slider_item = [
  { id: "1", name: "Strawberry", image: slider1 },
  { id: "2", name: "Fruity", image: slider2 },
  { id: "3", name: "Brodo", image: slider3 },
  { id: "4", name: "Cheetos", image: slider4 },
];
const { width } = Dimensions.get("screen");

export default function Slider() {
  const scrollX = useSharedValue(0);

  const onScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  // Precompute dot styles for pagination
  const dotStyles = slider_item.map((_, index) => {
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
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.5, 1, 0.5],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });
  });

  return (
    <View style={styles.container}>
      {/* Slider */}
      <Animated.FlatList
        data={slider_item}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScroll={onScrollHandler}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8}>
            <View style={styles.slide}>
              <Image source={item.image} style={styles.image} />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slider_item.map((_, index) => (
          <Animated.View
            key={index}
            style={[styles.dot, dotStyles[index]]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  slide: {
    alignItems: "center",
    width: width,
  },
  image: {
    width: 380,
    height: 140,
    borderRadius: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#f1b811',
    marginHorizontal: 4,
  },
});
