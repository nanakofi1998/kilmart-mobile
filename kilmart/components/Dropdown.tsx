import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, TouchableWithoutFeedback, Platform,} from "react-native";
import React, { useCallback, useRef, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
  
  type OptionItem = {
    value: string;
    label: string;
  };
  
  interface DropDownProps {
    data: OptionItem[];
    onChange: (item: OptionItem) => void;
    placeholder: string;
  }
  
  export default function Dropdown({
    data,
    onChange,
    placeholder,
  }: DropDownProps) {
    const [expanded, setExpanded] = useState(false);
  
    const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);
  
    const [value, setValue] = useState("");
  
    const buttonRef = useRef<View>(null);
  
    const [top, setTop] = useState(0);
  
    const onSelect = useCallback((item: OptionItem) => {
      onChange(item);
      setValue(item.label);
      setExpanded(false);
    }, []);
    return (
      <View
        ref={buttonRef}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          const topOffset = layout.y;
          const heightOfComponent = layout.height;
  
          const finalValue =
            topOffset + heightOfComponent + (Platform.OS === "android" ? -32 : 3);
  
          setTop(finalValue);
        }}
      >
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={toggleExpanded}
        >
          <View style={{alignItems:'center',flexDirection:'row', gap:10}}>
          <FontAwesome6 name="location-arrow" size={18} color="#0070fb" />
          <Text style={styles.text}>{value || placeholder}</Text>
          </View>
          <AntDesign name={expanded ? "caretup" : "caretdown"} />
        </TouchableOpacity>
        {expanded ? (
          <Modal visible={expanded} transparent>
            <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
              <View style={styles.backdrop}>
                <View
                  style={[
                    styles.options,
                    {
                      top,
                    },
                  ]}
                >
                  <FlatList
                    keyExtractor={(item) => item.value}
                    data={data}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.optionItem}
                        onPress={() => onSelect(item)}
                      >
                        <Text>{item.label}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => (
                      <View style={styles.separator} />
                    )}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        ) : null}
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    backdrop: {
      padding: 10,
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
    },
    optionItem: {
      height: 40,
      justifyContent: "center",
    },
    separator: {
      height: 1,
      backgroundColor: "#e0e0e0",
    },
    options: {
      position: "absolute",
      // top: 53,
      backgroundColor: "white",
      width: "90%",
      padding: 10,
      borderRadius: 6,
      maxHeight: 250,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    text: {
      fontSize: 15,
      fontFamily:'poppins',
      opacity: 0.8,
      color:"grey"
    },
    button: {
      height: 40,
      justifyContent: "space-between",
      backgroundColor: "#fff",
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      paddingHorizontal: 15,
      borderRadius: 10,
    },
  });