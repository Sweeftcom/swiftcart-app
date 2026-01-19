import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { OrderService } from '../../services/OrderService';
import { CheckCircle2, XCircle } from 'lucide-react-native';

interface RiderOTPVerifyProps {
  orderId: string;
  onSuccess: () => void;
}

/**
 * RiderOTPVerify
 * Secure OTP input for the Rider app to complete delivery.
 */
export const RiderOTPVerify: React.FC<RiderOTPVerifyProps> = ({ orderId, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (otp.length !== 4) return;

    setLoading(true);
    setError(null);

    try {
      await OrderService.verifyDeliveryOtp(orderId, otp);
      onSuccess();
    } catch (err: any) {
      setError('Invalid OTP. Please check again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Customer OTP</Text>

      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={4}
        style={styles.input}
        placeholder="0 0 0 0"
        placeholderTextColor="#333"
      />

      {error && (
        <View style={styles.errorContainer}>
          <XCircle color="#EF4444" size={16} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleVerify}
        disabled={loading || otp.length !== 4}
        style={[styles.button, (loading || otp.length !== 4) && styles.buttonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={styles.buttonText}>VERIFY & COMPLETE DELIVERY</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#111',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#000',
    color: '#E5F942',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: 16,
    padding: 16,
    letterSpacing: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#E5F942',
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
