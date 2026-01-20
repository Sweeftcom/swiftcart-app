import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react-native';

/**
 * VerificationStatus Screen
 * Auto-responds with "Documents under review" after upload.
 */
export const VerificationStatus = ({ status = 'pending' }: { status: 'pending' | 'verified' | 'rejected' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {status === 'pending' ? (
          <Clock color="#E5F942" size={80} strokeWidth={1.5} />
        ) : (
          <ShieldCheck color="#22C55E" size={80} strokeWidth={1.5} />
        )}
      </View>

      <Text style={styles.title}>
        {status === 'pending' ? 'Documents Under Review' : 'Profile Verified!'}
      </Text>

      <Text style={styles.subtitle}>
        {status === 'pending'
          ? "Our Aurangabad team is manually verifying your Aadhar and PAN. This usually takes 2-4 hours."
          : "You are now an official Sweeftcom Rider. Get ready to hit the road!"}
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <CheckCircle2 color="#22C55E" size={20} />
          <Text style={styles.infoText}>Identity Documents Uploaded</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock color="#888" size={20} />
          <Text style={styles.infoText}>Awaiting Background Check</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 32, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginBottom: 32, padding: 24, backgroundColor: '#1A1A1A', borderRadius: 100 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  subtitle: { color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  infoCard: { backgroundColor: '#111', padding: 24, borderRadius: 24, width: '100%', borderWidth: 1, borderColor: '#222' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  infoText: { color: '#ccc', fontSize: 14 }
});
