import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DeliveryOTPDisplayProps {
  otp: string;
}

/**
 * DeliveryOTPDisplay
 * Shows the secure 4-digit OTP to the customer once the order is out for delivery.
 */
export const DeliveryOTPDisplay: React.FC<DeliveryOTPDisplayProps> = ({ otp }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Share this OTP with the Rider</Text>
      <View style={styles.otpContainer}>
        {otp.split('').map((digit, index) => (
          <View key={index} style={styles.digitBox}>
            <Text style={styles.digitText}>{digit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5F94220',
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  digitBox: {
    width: 50,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  digitText: {
    color: '#E5F942',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
