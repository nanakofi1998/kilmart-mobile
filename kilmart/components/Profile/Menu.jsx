import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { router } from 'expo-router';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../app/AuthContext';

export default function Menu() {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user && !user.is_guest) {
                await apiClient.post('api/auth/users/logout/');
              }
              
              // Clear local auth state
              await logout();
              
              // Redirect to home page
              router.replace('/login');
              
            } catch (error) {
              await logout();
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    // Don't allow guest users to delete account
    if (user?.is_guest) {
      Alert.alert('Guest Mode', 'Account deletion is not available in guest mode. Please create an account first.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data including orders, preferences, and personal information will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show final confirmation
              Alert.alert(
                'Confirm Deletion',
                'Are you absolutely sure? This will permanently erase your account and all associated data.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Yes, Delete Forever',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // Call account deletion API
                        await apiClient.delete(`api/auth/delete/${user.id}/`);
                        
                        // Show success message
                        Alert.alert(
                          'Account Deleted',
                          'Your account has been successfully deleted. We\'re sorry to see you go.',
                          [
                            {
                              text: 'OK',
                              onPress: async () => {
                                // Clear local auth state and redirect to login
                                await logout();
                                router.replace('/login');
                              }
                            }
                          ]
                        );
                        
                      } catch (error) {
                        console.error('Account deletion error:', error);
                        Alert.alert(
                          'Deletion Failed',
                          'We encountered an issue deleting your account. Please try again later or contact support.',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                  },
                ]
              );
              
            } catch (error) {
              console.error('Error in account deletion flow:', error);
              Alert.alert(
                'Error',
                'Something went wrong. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{display:'flex',marginTop:10}}>
      <View style={{padding:20, flexDirection:'column',justifyContent:'center'}}>
        {/* <TouchableOpacity style={{paddingTop:60, flexDirection:'row',alignItems:'center', justifyContent:'space-between'}}>
          <View style={{ gap:10, flexDirection:'row', alignItems:'center'}}>
            <AntDesign name="wallet" size={24} color="black" />
            <Text style={{fontFamily:'poppins',fontSize:17, color:'#141414'}}>My Wallet</Text>
          </View>
          <Text style={{fontFamily:'poppins-bold', fontSize:20, color:'#141414'}}>GH₵ 0.00</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}} onPress={() => router.push('/coupon-screen')}>
          <AntDesign name="gift" size={28} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Gifts & Coupons</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <Ionicons name="notifications-outline" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Notifications</Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <Octicons name="person-add" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Refer A Friend</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}} onPress={()=> router.push('/orders')}>
          <Ionicons name="receipt-outline" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Order History</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <Octicons name="location" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Addresses</Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <MaterialIcons name="payment" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Payment Methods</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}} onPress={() => router.push('/ContactUs')}>
          <MaterialIcons name="support-agent" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Contact Us</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <SimpleLineIcons name="settings" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Settings</Text>
        </TouchableOpacity> */}
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={{
            marginTop: 40, 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 10,
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: '#f8f8f8',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e0e0e0'
          }} 
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color="#D32F2F" />
          <Text style={{
            fontFamily: 'poppins', 
            fontSize: 17, 
            color: '#D32F2F',
            fontWeight: '600'
          }}>
            {user?.is_guest ? 'Exit Guest Mode' : 'Logout'}
          </Text>
        </TouchableOpacity>

        {/* Delete Account Button - Only for authenticated users */}
        {!user?.is_guest && (
          <TouchableOpacity 
            style={{
              marginTop: 20, 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: '#fff5f5',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#fed7d7'
            }} 
            onPress={handleDeleteAccount}
          >
            <MaterialIcons name="delete-forever" size={24} color="#E53E3E" />
            <Text style={{
              fontFamily: 'poppins', 
              fontSize: 17, 
              color: '#E53E3E',
              fontWeight: '600'
            }}>
              Delete Account
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}