import apiClient from './apiClient';
import { Alert } from 'react-native';

export const toggleFavorite = async (productId, productName, isCurrentlyFavorite, favoriteId) => {
  try {
    if (isCurrentlyFavorite && favoriteId) {
      // Remove from favorites
      await apiClient.delete(`api/favourites/${favoriteId}/`);
      return { success: true, added: false };
    } else {
      // Add to favorites
      await apiClient.post('api/favourites/', { product: productId });
      return { success: true, added: true };
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    
    if (error.response?.status === 401) {
      Alert.alert('Login Required', 'Please login to manage your favorites.');
    } else {
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
    
    return { success: false, added: isCurrentlyFavorite };
  }
};