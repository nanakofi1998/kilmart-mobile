import { useEffect } from 'react';
import { View, Image } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirect to login after component mounts
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Image source={require('./../assets/images/kwikmart.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
    </View>
  );
}