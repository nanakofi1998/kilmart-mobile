import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../utils/apiClient';
import * as SecureStore from 'expo-secure-store';
import AwesomeAlert from 'react-native-awesome-alerts';
import AuthInput from '../../components/AuthInput';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    isSuccess: false
  });
  
  const router = useRouter();

  const displayAlert = (title, message, isSuccess = false) => {
    setAlertConfig({
      title,
      message,
      isSuccess
    });
    setShowAlert(true);
    
    // Auto-dismiss success alerts after 1.5 seconds
    if (isSuccess) {
      setTimeout(() => {
        setShowAlert(false);
        router.replace('/home');
      }, 1500);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if(!email || !password) {
      displayAlert('Error', 'Please enter both email and password');
      setLoading(false);
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      displayAlert('Error', 'Please enter a valid email address');
      setLoading(false);
      return;
    }

    const credentials = { email, password };

    try {
      const response = await apiClient.post('/auth/jwt/create/', credentials);
      // console.log(credentials)
      // console.log('Fetched token from SecureStore:', access);
      const { access, full_name } = response.data;

      await SecureStore.setItemAsync('access', access);
      await SecureStore.setItemAsync('user-name', full_name);

      displayAlert('Success', 'Login successful!', true);
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.message || 
        "Failed to login. Please check your credentials or try again later";
      displayAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    } 
  };
  

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Image 
        source={require('./../../assets/images/bnr.png')} 
        style={{ 
          width: '100%', 
          height: 200, 
          borderBottomLeftRadius: 10, 
          borderBottomRightRadius: 10 
        }} 
      />
      
      <View style={{ padding: 20 }}>
        <Text style={{ 
          fontSize: 28, 
          fontFamily: 'inter',
          fontWeight: 'bold', 
          marginBottom: 20 
        }}>
          Login
        </Text>
        
        <AuthInput 
          placeholder="Email address" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthInput 
          placeholder="Password" 
          secure 
          value={password} 
          onChangeText={setPassword} 
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={{ alignSelf: 'flex-end', marginVertical: 5 }}
          onPress={() => router.push('/forgot-password')}
        >
          <Text style={{ color: '#f1b811' }}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ 
            backgroundColor: '#f1b811', 
            padding: 16, 
            borderRadius: 12, 
            marginVertical: 20,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: loading ? 0.7 : 1
          }} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
            </>
          ) : (
            <Text style={{ 
              textAlign: 'center', 
              color: '#fff', 
              fontWeight: 'bold' 
            }}>
              Login
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{ 
          textAlign: 'center', 
          marginVertical: 10, 
          fontStyle: 'italic', 
          fontWeight: 'bold'  
        }}>
          Don't have an account?
        </Text>

        <TouchableOpacity 
          style={{ 
            backgroundColor: '#b0b8ba', 
            padding: 16, 
            borderRadius: 12, 
            marginVertical: 20 
          }} 
          onPress={() => router.push('/sign-up')}
        >
          <Text style={{ 
            textAlign: 'center', 
            color: '#000', 
            fontWeight: 'bold' 
          }}>
            Sign up
          </Text>
        </TouchableOpacity>

        <AwesomeAlert
          show={showAlert}
          showProgress={false}
          title={alertConfig.title}
          message={alertConfig.message}
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={false}
          showCancelButton={false}
          showConfirmButton={!alertConfig.isSuccess} // Only show confirm button for error messages
          confirmText="OK"
          confirmButtonColor={alertConfig.isSuccess ? "#4CAF50" : "#DD6B55"}
          onConfirmPressed={() => {
            setShowAlert(false);
          }}
          onDismiss={() => {
            setShowAlert(false);
          }}
        />

        <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 12 }}>
          By clicking create account you agree to {' '}
          <Text style={{ color: '#f1b811' }}>Terms of use</Text> and{' '}
          <Text style={{ color: '#f1b811' }}>Privacy policy</Text>
        </Text>
      </View>
    </ScrollView>
  );
}