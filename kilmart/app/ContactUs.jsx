import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const ContactUs = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback: ''
  });
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const features = [
    { id: 1, label: 'Fast delivery', icon: 'rocket-outline' },
    { id: 2, label: 'Wide selection', icon: 'grid-outline' },
    { id: 3, label: 'Easy reordering', icon: 'repeat-outline' },
    { id: 4, label: 'Easy search', icon: 'search-outline' },
    { id: 5, label: 'Quick help via chat or phone', icon: 'chatbubble-outline' },
    { id: 6, label: 'Good Recommendation section', icon: 'star-outline' },
  ];

  const toggleFeature = (featureId) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.feedback) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: '8d7266eb-025f-432c-99f3-c597f9df9f6d', 
          subject: 'KwikMart App Feedback',
          name: formData.name,
          email: formData.email,
          features: selectedFeatures.map(id => features.find(f => f.id === id)?.label).join(', '),
          message: formData.feedback,
          from_name: 'KwikMart App',
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Thank you for your feedback!');
        setFormData({ name: '', email: '', feedback: '' });
        setSelectedFeatures([]);
      } else {
        Alert.alert('Error', 'Failed to send feedback. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Send Feedback</Text>
          <Text style={styles.headerSubtitle}>We'd love to hear from you</Text>
        </View>

        <View style={styles.headerRightIcon}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What do you like about our app?</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[
                  styles.featureCard,
                  selectedFeatures.includes(feature.id) && styles.featureCardSelected
                ]}
                onPress={() => toggleFeature(feature.id)}
              >
                <View style={[
                  styles.featureIconContainer,
                  selectedFeatures.includes(feature.id) && styles.featureIconContainerSelected
                ]}>
                  <Ionicons 
                    name={feature.icon} 
                    size={20} 
                    color={selectedFeatures.includes(feature.id) ? '#fff' : '#f1b811'} 
                  />
                </View>
                <Text style={[
                  styles.featureText,
                  selectedFeatures.includes(feature.id) && styles.featureTextSelected
                ]}>
                  {feature.label}
                </Text>
                {selectedFeatures.includes(feature.id) && (
                  <Ionicons name="checkmark-circle" size={16} color="#f1b811" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Feedback</Text>
          <Text style={styles.sectionSubtitle}>Tell us how we can improve</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Your Name"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Your Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            />
          </View>

          {/* Feedback Input */}
          <View style={styles.feedbackInputContainer}>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Enter your feedback here..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={formData.feedback}
              onChangeText={(text) => setFormData(prev => ({ ...prev, feedback: text }))}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Ionicons name="refresh" size={20} color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" style={styles.sendIcon} />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Sending...' : 'Send feedback'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Other ways to reach us</Text>
          <View style={styles.contactMethods}>
            <View style={styles.contactMethod}>
              <Ionicons name="call" size={20} color="#f1b811" />
              <Text style={styles.contactText}>+233 53 082 6193</Text>
            </View>
            <View style={styles.contactMethod}>
              <Ionicons name="mail" size={20} color="#f1b811" />
              <Text style={styles.contactText}>support@kwirkmart.expertech.dev</Text>
            </View>
            <View style={styles.contactMethod}>
              <Ionicons name="time" size={20} color="#f1b811" />
              <Text style={styles.contactText}>24/7 Support</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#f1b811',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerRightIcon: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    minWidth: '48%',
    marginBottom: 8,
    position: 'relative',
  },
  featureCardSelected: {
    backgroundColor: '#fff7e6',
    borderColor: '#f1b811',
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff7e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureIconContainerSelected: {
    backgroundColor: '#f1b811',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a5568',
    flex: 1,
  },
  featureTextSelected: {
    color: '#2d3748',
    fontWeight: '700',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
  },
  feedbackInputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 120,
  },
  feedbackInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: '#f1b811',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#f1b811',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  sendIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contactInfo: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactMethods: {
    gap: 12,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default ContactUs;