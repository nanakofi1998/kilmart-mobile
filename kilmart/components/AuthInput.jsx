import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthInput({ placeholder, secure = false, value, onChangeText }) {
  const [hide, setHide] = useState(secure);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 20,
      paddingHorizontal: 10,
      marginVertical: 10,
      backgroundColor: '#f7f7f7',
    }}>
      <Ionicons name="mail-outline" size={20} color="#aaa" />
      <TextInput
        placeholder={placeholder}
        secureTextEntry={hide}
        value={value}
        onChangeText={onChangeText}
        style={{ flex: 1, marginLeft: 10, paddingVertical: 12 }}
      />
      {secure && (
        <TouchableOpacity onPress={() => setHide(!hide)}>
          <Ionicons name={hide ? "eye-off-outline" : "eye-outline"} size={22} color="#aaa" />
        </TouchableOpacity>
      )}
    </View>
  );
}
