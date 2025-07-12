import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@user_cart';

export const getStoredCart = async () => {
  try {
    const cart = await AsyncStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Failed to load cart:', error);
    return [];
  }
};

export const saveStoredCart = async (items) => {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart:', error);
  }
};

export const addToCart = async (product, quantity = 1) => {
  try {
    const cart = await getStoredCart();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      await saveStoredCart(updatedCart);
      return updatedCart;
    }
    
    const newCart = [...cart, { 
      ...product, 
      quantity,
      price: product.price ? Number(product.price) : 0
    }];
    await saveStoredCart(newCart);
    return newCart;
  } catch (error) {
    console.error('Failed to add to cart:', error);
    return [];
  }
};

export const clearStoredCart = async () => {
  try {
    await AsyncStorage.removeItem(CART_KEY);
  } catch (error) {
    console.error('Failed to clear cart:', error);
  }
};
