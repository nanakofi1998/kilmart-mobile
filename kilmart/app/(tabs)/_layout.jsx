import React from 'react';
import { Tabs } from 'expo-router';
import Octicons from '@expo/vector-icons/Octicons';
import Fontisto from '@expo/vector-icons/Fontisto';

function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f1b811",
        tabBarInactiveTintColor: "#0d0d0e",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ size, focused }) => (
            <Octicons
              name="home"
              size={focused ? size + 4 : size} 
              color={focused ? "#f1b811" : "#0d0d0e"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ size, focused }) => (
            <Octicons
              name="search"
              size={focused ? size + 4 : size} 
              color={focused ? "#f1b811" : "#0d0d0e"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ size, focused }) => (
            <Fontisto
              name="shopping-basket"
              size={focused ? size + 3 : size} 
              color={focused ? "#f1b811" : "#0d0d0e"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorite"
        options={{
          tabBarIcon: ({ size, focused }) => (
            <Octicons
              name="heart"
              size={focused ? size + 4 : size} 
              color={focused ? "#f1b811" : "#0d0d0e"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ size, focused }) => (
            <Octicons
              name="person"
              size={focused ? size + 4 : size} 
              color={focused ? "#f1b811" : "#0d0d0e"}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default TabLayout;
