import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';
import { Video, Audio, AVPlaybackStatus } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we load the video
SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

interface AuthUser {
  must_change_password?: boolean;
  is_verified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
}

export default function Index() {
  const { user, isLoading } = useAuth() as AuthContextType;
  const videoRef = useRef<Video>(null);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [hasNavigated, setHasNavigated] = useState<boolean>(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Configure audio settings
  useEffect(() => {
    const configureAudio = async (): Promise<void> => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log('Audio configuration error:', error);
      }
    };

    configureAudio();
  }, []);

  // Handle navigation - ensure it only happens once
  const navigateToScreen = (): void => {
    if (hasNavigated) return;
    
    setHasNavigated(true);
    
    // Clean up video resources
    const cleanupVideo = async (): Promise<void> => {
      if (videoRef.current) {
        try {
          await videoRef.current.stopAsync();
          await videoRef.current.unloadAsync();
        } catch (error) {
          console.log('Error cleaning up video:', error);
        }
      }
    };

    void cleanupVideo();

    // Clear any pending timeouts
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // Navigate based on auth state
    if (user) {
      if (user.must_change_password) {
        router.replace('/forgot-pwd');
      } else if (!user.is_verified) {
        router.replace('/verifyotp');
      } else {
        router.replace('/home');
      }
    } else {
      router.replace('/login');
    }
  };

  // Handle video ready state
  const handleVideoLoad = async (status: AVPlaybackStatus): Promise<void> => {
    console.log('Video load status:', status);
    
    if (status.isLoaded && !isVideoReady) {
      setIsVideoReady(true);
      
      // Hide splash screen once video is ready
      await SplashScreen.hideAsync();
      
      // Play video with sound
      if (videoRef.current) {
        try {
          await videoRef.current.playAsync();
        } catch (error) {
          console.log('Error playing video:', error);
          // If video fails to play, set fallback navigation
          navigationTimeoutRef.current = setTimeout(navigateToScreen, 3000);
        }
      }
    }
  };

  // Handle video playback status updates
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    // Navigate when video finishes
    if (status.isLoaded && status.didJustFinish && !hasNavigated) {
      console.log('Video finished playing, navigating...');
      navigateToScreen();
      return;
    }

    // If video is loaded and playing, set fallback timeout only once
    if (status.isLoaded && status.isPlaying && !navigationTimeoutRef.current) {
      console.log('Video is playing, setting fallback timeout');
      // Fallback timeout in case video doesn't trigger didJustFinish
      navigationTimeoutRef.current = setTimeout(() => {
        console.log('Fallback timeout triggered, navigating...');
        navigateToScreen();
      }, 8000); // Increased timeout to ensure video completion
    }
  };

  const handleVideoError = (error: string): void => {
    console.log('Video error:', error);
    
    // If video fails to load, navigate immediately with fallback
    if (!hasNavigated) {
      console.log('Video error, navigating immediately');
      navigateToScreen();
    }
  };

  // Handle case where auth is ready but video never loads
  useEffect(() => {
    if (!isLoading && !isVideoReady && !hasNavigated) {
      console.log('Auth ready but video not loaded, setting fallback');
      navigationTimeoutRef.current = setTimeout(() => {
        console.log('Video load timeout, navigating...');
        navigateToScreen();
      }, 5000);
    }

    // Cleanup function
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, [isLoading, isVideoReady, hasNavigated]);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('../assets/images/kwik.mp4')}
        style={styles.video}
        resizeMode="cover"
        shouldPlay={false} // We'll trigger play manually after load
        isLooping={false}
        isMuted={false}
        volume={1.0}
        onLoad={handleVideoLoad}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleVideoError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: width,
    height: height,
  },
});