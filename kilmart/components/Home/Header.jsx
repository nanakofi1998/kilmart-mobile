import { View, Text } from 'react-native'
import React, { useState, useEffect } from 'react'
import Dropdown from '../Dropdown'
import apiClient from '../../utils/apiClient';

export default function Header() {
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchShippingAddress = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('api/auth/shipping-address/');
      const addresses = res.data || [];
      setShippingAddresses(addresses);
      
      const defaultAddr = addresses.find(addr => addr.is_default === true);
      setDefaultAddress(defaultAddr || (addresses.length > 0 ? addresses[0] : null));
      
    } catch (error) {
      console.error('Error fetching shipping addresses:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchShippingAddress();
  }, []);
  const formatAddress = (address) => {
    if (!address) return '';
    
    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.city,
      address.state,
      address.country
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  };

  const getDropdownPlaceholder = () => {
    if (loading) return "Fetching Default Address...";
    if (!defaultAddress) return "No Address Found";
    return formatAddress(defaultAddress);
  };

  const getDropdownItems = () => {
    return shippingAddresses.map(address => ({
      label: formatAddress(address),
      value: address.id,
      isDefault: address.is_default
    }));
  };

  const handleAddressChange = (selectedValue) => {
    const selectedAddress = shippingAddresses.find(addr => addr.id === selectedValue);
    if (selectedAddress) {
      setDefaultAddress(selectedAddress);
    }
  };

  return (
    <View style={{
      padding: 20, 
      paddingTop: 60, 
      backgroundColor: '#f1b811',
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10, 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.3, 
      shadowColor: '#000', 
      shadowRadius: 5, 
      elevation: 5,
    }}>
      <View style={{
        display: 'flex',
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        gap: 10,
        alignContent: 'center'
      }}>
        <Text style={{
          fontFamily: 'inter-bold', 
          fontSize: 15, 
          color: 'black'
        }}>
          DELIVERY ADDRESS
        </Text>
        
        <Dropdown
          placeholder={getDropdownPlaceholder()}
          items={getDropdownItems()}
          onValueChange={handleAddressChange}
          defaultValue={defaultAddress?.id}
          loading={loading}
        />
      </View>
    </View>
  )
}