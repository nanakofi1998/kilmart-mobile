import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Switch } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function Payment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardDetails, setCardDetails] = useState({ cardNumber: '', expiryDate: '', cvv: '' });

  const [deliveryDetails, setDeliveryDetails] = useState({ fullName: '', phone: '', address: '', city: '' });
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlert({ show: true, title, message });
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleProceedToPayment = () => {
    const { fullName, phone, address, city } = deliveryDetails;
    if (!fullName || !phone || !address || !city) {
      showAlert('Incomplete Details', 'Please fill in all delivery fields.');
      return;
    }
    setCurrentStep(2);
  };

  const handlePayment = () => {
    if (selectedMethod === 'momo' || selectedMethod === 'telecel') {
      if (!phoneNumber) {
        showAlert('Missing info', 'Please enter your phone number.');
        return;
      }
      showAlert('Success', `Payment via ${selectedMethod === 'momo' ? 'MTN MoMo' : 'Telecel Cash'} processed.`);
    } else if (selectedMethod === 'card') {
      const { cardNumber, expiryDate, cvv } = cardDetails;
      if (!cardNumber || !expiryDate || !cvv) {
        showAlert('Incomplete Card Info', 'Please fill in all card fields.');
        return;
      }
      showAlert('Success', 'Card payment processed.');
    } else {
      showAlert('Select Method', 'Please choose a payment method.');
    }
  };

  const renderStepper = () => (
    <View style={styles.stepper}>
      <View style={[styles.step, currentStep >= 1 && styles.activeStep]}>
        <Text style={styles.stepText}>1</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={[styles.step, currentStep >= 2 && styles.activeStep]}>
        <Text style={styles.stepText}>2</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderStepper()}

      {currentStep === 1 && (
        <View>
          <Text style={styles.sectionTitle}>
            Delivery Details <FontAwesome5 name="shipping-fast" size={22} />
          </Text>

          <TextInput style={styles.input} placeholder="Full Name" value={deliveryDetails.fullName}
            onChangeText={(text) => setDeliveryDetails({ ...deliveryDetails, fullName: text })} />
          <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={deliveryDetails.phone}
            onChangeText={(text) => setDeliveryDetails({ ...deliveryDetails, phone: text })} />
          <TextInput style={styles.input} placeholder="Delivery Address" value={deliveryDetails.address}
            onChangeText={(text) => setDeliveryDetails({ ...deliveryDetails, address: text })} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Save as default address</Text>
            <Switch value={saveAsDefault} onValueChange={setSaveAsDefault} />
          </View>

          <TouchableOpacity style={styles.paymentButton} onPress={handleProceedToPayment}>
            <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 2 && (
        <View>
          <Text style={styles.sectionTitle}>
            Payment Method <FontAwesome5 name="money-bill-wave" size={22} />
          </Text>

          {['momo', 'telecel', 'card'].map((method) => (
            <TouchableOpacity key={method} style={[styles.paymentMethod, selectedMethod === method && styles.selectedMethod]}
              onPress={() => handleMethodSelect(method)}>
              <Image source={
                method === 'momo' ? require('../assets/images/momo.jpeg') :
                method === 'telecel' ? require('../assets/images/telecash.webp') :
                require('../assets/images/visa.webp')
              } style={styles.paymentMethodIcon} />
              <Text style={styles.paymentMethodText}>
                {method === 'momo' ? 'MTN MoMo' : method === 'telecel' ? 'Telecel Cash' : 'Card Payment'}
              </Text>
            </TouchableOpacity>
          ))}

          {selectedMethod === 'momo' || selectedMethod === 'telecel' ? (
            <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad"
              value={phoneNumber} onChangeText={setPhoneNumber} />
          ) : selectedMethod === 'card' ? (
            <>
              <TextInput style={styles.input} placeholder="Card Number" keyboardType="numeric"
                value={cardDetails.cardNumber} onChangeText={(text) => setCardDetails({ ...cardDetails, cardNumber: text })} />
              <TextInput style={styles.input} placeholder="Expiry Date (MM/YY)" keyboardType="numeric"
                value={cardDetails.expiryDate} onChangeText={(text) => setCardDetails({ ...cardDetails, expiryDate: text })} />
              <TextInput style={styles.input} placeholder="CVV" keyboardType="numeric" secureTextEntry
                value={cardDetails.cvv} onChangeText={(text) => setCardDetails({ ...cardDetails, cvv: text })} />
            </>
          ) : null}

          <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
            <Text style={styles.paymentButtonText}>Make Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      <AwesomeAlert
        show={alert.show}
        title={alert.title}
        message={alert.message}
        closeOnTouchOutside={true}
        showConfirmButton={true}
        confirmText="Okay"
        confirmButtonColor="#333"
        onConfirmPressed={() => setAlert({ ...alert, show: false })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  step: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  activeStep: { backgroundColor: '#000' },
  stepLine: { width: 50, height: 2, backgroundColor: '#ccc' },
  stepText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 24, fontFamily: 'inter-bold', marginBottom: 10, color: '#333' },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, marginBottom: 10 },
  selectedMethod: { backgroundColor: '#e0f7fa' },
  paymentMethodIcon: { width: 30, height: 30, resizeMode: 'contain', marginRight: 10 },
  paymentMethodText: { fontSize: 16, fontFamily: 'inter-bold', color: '#333' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, marginBottom: 10, fontSize: 16, color: '#333'},
  paymentButton: { backgroundColor: '#d5d5d5', paddingVertical: 15, borderRadius: 50, alignItems: 'center', marginTop: 20, elevation: 50, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 5 }, shadowRadius: 15},
  paymentButtonText: { fontSize: 18, fontFamily: 'inter-bold', color: '#000' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  switchLabel: { fontSize: 16, flex: 1, fontFamily: 'inter-medium', color: '#333' },
});
