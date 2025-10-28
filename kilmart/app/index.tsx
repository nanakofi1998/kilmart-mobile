import { useEffect } from 'react';
import { View, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (user) {
        if (user.must_change_password) {
          router.replace('/change-password' as any);
        } else if (!user.is_verified) {
          router.replace('/verifyotp' as any);
        } else {
          router.replace('/home' as any);
        }
      } else {
        router.replace('/login' as any);
      }
    }, 6000); 

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Image 
        source={require('../assets/images/kwikmart.png')} 
        style={{ width: '100%', height: '100%', resizeMode: 'contain' }} 
      />
    </View>
  );
}