import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredCart, saveStoredCart } from '../utils/cart';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const loadCart = async () => {
    const storedCart = await getStoredCart();
    setCartItems(storedCart);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (product, quantity = 1) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    let updatedCart;

    if (existingItem) {
      updatedCart = cartItems.map(item =>
        item.id === product.id
          ? {
              ...item,
              quantity: Math.min(item.quantity + quantity, product.stock || Infinity)
            }
          : item
      );
    } else {
      updatedCart = [
        ...cartItems,
        {
          ...product,
          quantity,
          price: Number(product.price) || 0
        }
      ];
    }

    setCartItems(updatedCart);
    await saveStoredCart(updatedCart);
  };

  const removeFromCart = async (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    await saveStoredCart(updatedCart);
  };

  const removeItemsByIds = async (itemIds) => {
    const updatedCart = cartItems.filter(item => !itemIds.includes(item.id));
    setCartItems(updatedCart);
    await saveStoredCart(updatedCart);
  };

  const updateItemQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    await saveStoredCart(updatedCart);
  };

  const clearCart = async () => {
    setCartItems([]);
    await saveStoredCart([]);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        removeItemsByIds, // Add this new function
        updateItemQuantity,
        clearCart,
        totalItems,
        totalPrice,
        loadCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};