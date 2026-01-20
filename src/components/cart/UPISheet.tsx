import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'https://img.icons8.com/color/48/google-pay.png' },
  { id: 'phonepe', name: 'PhonePe', icon: 'https://img.icons8.com/color/48/phonepe.png' },
  { id: 'paytm', name: 'Paytm', icon: 'https://img.icons8.com/color/48/paytm.png' },
];

/**
 * UPISheet Component
 * Implements Dynamic App Detection logic (Simulation for UX).
 * Displays installed UPI apps for the user to choose.
 */
export const UPISheet = ({ totalAmount, onSelect }: { totalAmount: number, onSelect: (app: string) => void }) => {
  // In a production environment, use 'react-native-check-app-install'
  // or 'Linking.canOpenURL' with intent schemes (e.g. phonepe://)
  // to filter this list.

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pay ₹{totalAmount}</Text>
      <Text style={styles.subtitle}>Choose your preferred UPI app</Text>

      <View style={styles.appGrid}>
        {UPI_APPS.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={styles.appItem}
            onPress={() => onSelect(app.id)}
          >
            <View style={styles.iconContainer}>
              <Image source={{ uri: app.icon }} style={styles.icon} />
            </View>
            <Text style={styles.appName}>{app.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>100% Secure Payments via Sweeftcom Gateway</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#111', padding: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  header: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  appGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  appItem: { alignItems: 'center', gap: 12 },
  iconContainer: { padding: 16, backgroundColor: '#1A1A1A', borderRadius: 24, borderWidth: 1, borderColor: '#333' },
  icon: { width: 40, height: 40 },
  appName: { color: '#ccc', fontSize: 12, fontWeight: '500' },
  footer: { borderTopWidth: 1, borderTopColor: '#222', paddingTop: 24, alignItems: 'center' },
  footerText: { color: '#444', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }
});
