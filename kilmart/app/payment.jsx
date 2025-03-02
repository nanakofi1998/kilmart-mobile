import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function Payment() {
  const [selectedMethod, setSelectedMethod] = useState(null); // Track selected payment method
  const [phoneNumber, setPhoneNumber] = useState(''); // For MoMo/Telecel Cash
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  }); // For card payment

  // Handle payment method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  // Handle payment submission
  const handlePayment = () => {
    if (selectedMethod === 'momo' || selectedMethod === 'telecel') {
      if (!phoneNumber) {
        alert('Please enter your phone number.');
        return;
      }
      alert(`Payment via ${selectedMethod === 'momo' ? 'MTN MoMo' : 'Telecel Cash'} is being processed.`);
    } else if (selectedMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv) {
        alert('Please fill in all card details.');
        return;
      }
      alert('Card payment is being processed.');
    } else {
      alert('Please select a payment method.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Payment Methods Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Payment Method <FontAwesome5 name="money-bill-wave" size={24} color="black" /></Text>

        {/* MTN MoMo Option */}
        <TouchableOpacity
          style={[
            styles.paymentMethod,
            selectedMethod === 'momo' && styles.selectedMethod,
          ]}
          onPress={() => handleMethodSelect('momo')}
        >
          <Image
            source={require('../assets/images/momo.jpeg')} // Update path to your image
            style={styles.paymentMethodIcon}
          />
          <Text style={styles.paymentMethodText}>MTN Mobile Money</Text>
        </TouchableOpacity>

        {/* Telecel Cash Option */}
        <TouchableOpacity
          style={[
            styles.paymentMethod,
            selectedMethod === 'telecel' && styles.selectedMethod,
          ]}
          onPress={() => handleMethodSelect('telecel')}
        >
          <Image
            source={require('../assets/images/telecash.webp')} // Update path to your image
            style={styles.paymentMethodIcon}
          />
          <Text style={styles.paymentMethodText}>Telecel Cash</Text>
        </TouchableOpacity>

        {/* Card Payment Option */}
        <TouchableOpacity
          style={[
            styles.paymentMethod,
            selectedMethod === 'card' && styles.selectedMethod,
          ]}
          onPress={() => handleMethodSelect('card')}
        >
          <Image
            source={require('../assets/images/visa.webp')} // Update path to your image
            style={styles.paymentMethodIcon}
          />
          <Text style={styles.paymentMethodText}>Card Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Details Section */}
      {selectedMethod === 'momo' || selectedMethod === 'telecel' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Enter {selectedMethod === 'momo' ? 'MTN MoMo' : 'Telecel Cash'} Details
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
      ) : selectedMethod === 'card' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Card Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Card Number"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={cardDetails.cardNumber}
            onChangeText={(text) =>
              setCardDetails({ ...cardDetails, cardNumber: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Expiry Date (MM/YY)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={cardDetails.expiryDate}
            onChangeText={(text) =>
              setCardDetails({ ...cardDetails, expiryDate: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="CVV"
            placeholderTextColor="#999"
            keyboardType="numeric"
            secureTextEntry
            value={cardDetails.cvv}
            onChangeText={(text) =>
              setCardDetails({ ...cardDetails, cvv: text })
            }
          />
        </View>
      ) : null}

      {/* Proceed to Payment Button */}
      <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
        <Text style={styles.paymentButtonText}>Make Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'inter-bold',
    marginBottom: 10,
    color: '#333',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  selectedMethod: {
    backgroundColor: '#e0f7fa', // Light blue background for selected method
  },
  paymentMethodIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 10,
  },
  paymentMethodText: {
    fontSize: 16,
    fontFamily: 'inter-bold',
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  paymentButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  paymentButtonText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
  },
});