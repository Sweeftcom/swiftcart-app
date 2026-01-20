import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Package, Smartphone, Bike, MapPin } from 'lucide-react-native';

/**
 * DeliveryKit Screen
 * Triggered once the rider is verified. Onboarding for the pilot kit.
 */
export const DeliveryKit = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Order Delivery Kit</Text>
      <Text style={styles.subtitle}>Collect your gear from the Nirala Bazar Hub to start delivering.</Text>

      <View style={styles.kitGrid}>
        <View style={styles.kitItem}>
          <Package color="#E5F942" size={32} />
          <Text style={styles.kitLabel}>Thermal Bag</Text>
        </View>
        <View style={styles.kitItem}>
          <Smartphone color="#E5F942" size={32} />
          <Text style={styles.kitLabel}>Phone Mount</Text>
        </View>
        <View style={styles.kitItem}>
          <Bike color="#E5F942" size={32} />
          <Text style={styles.kitLabel}>Sweeftcom Vest</Text>
        </View>
      </View>

      <View style={styles.locationCard}>
        <MapPin color="#3B82F6" size={24} />
        <View>
          <Text style={styles.locationTitle}>Collection Point</Text>
          <Text style={styles.locationText}>Nirala Bazar Hub, Aurangabad</Text>
          <Text style={styles.locationTime}>10:00 AM - 6:00 PM</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>I HAVE COLLECTED MY KIT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 24 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 32 },
  kitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 40 },
  kitItem: { width: '47%', backgroundColor: '#1A1A1A', padding: 24, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  kitLabel: { color: 'white', marginTop: 12, fontWeight: '600' },
  locationCard: { backgroundColor: '#111', padding: 24, borderRadius: 24, flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 40 },
  locationTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  locationText: { color: '#888', marginTop: 4 },
  locationTime: { color: '#3B82F6', fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  button: { backgroundColor: '#E5F942', height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});
