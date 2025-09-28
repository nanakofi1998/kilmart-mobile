import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthInput({ 
  placeholder, 
  secure = false, 
  value, 
  onChangeText, 
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  editable = true,
  iconName = 'mail-outline'
}) {
  const [hide, setHide] = useState(secure);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      paddingHorizontal: 15,
      marginVertical: 10,
      backgroundColor: '#f7f7f7',
      height: 56,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    }}>
      <Ionicons 
        name={iconName} 
        size={20} 
        color="#666" 
        style={{ marginRight: 10 }}
      />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#999"
        secureTextEntry={hide}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        editable={editable}
        style={{ 
          flex: 1, 
          paddingVertical: Platform.OS === 'ios' ? 12 : 8,
          fontSize: 16,
          fontFamily: 'inter-regular',
          color: '#333',
          includeFontPadding: false,
        }}
        selectionColor="#f1b811"
      />
      {secure && (
        <TouchableOpacity 
          onPress={() => setHide(!hide)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={hide ? "eye-off-outline" : "eye-outline"} 
            size={22} 
            color="#666" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}