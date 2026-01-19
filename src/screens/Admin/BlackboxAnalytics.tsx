import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/react-native/supabase-client';
import { BarChart, Activity, Clock, AlertOctagon } from 'lucide-react-native';

/**
 * Admin Blackbox Analytics
 * Visualizes operational latency and efficiency.
 */
export const BlackboxAnalytics = () => {
  const [metrics, setMetrics] = useState({
    avgPickupTime: 0,
    avgDeliveryLatency: 0,
    cancellationRate: 0,
    totalOrders: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    // Conceptual: In production, these would be calculated via a materialized view or scheduled aggregate
    const { data: orders } = await supabase
      .from('orders')
      .select('status, created_at, actual_delivery_time, status_history:order_status_history(*)');

    if (orders) {
      // Logic to calculate latencies from status history timestamps
      setMetrics({
        avgPickupTime: 4.2, // Mock min
        avgDeliveryLatency: 12.8, // Mock min
        cancellationRate: 2.1, // Mock %
        totalOrders: orders.length
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Operation Analytics</Text>

      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Clock color="#E5F942" size={28} />
          <Text style={styles.value}>{metrics.avgPickupTime}m</Text>
          <Text style={styles.label}>Avg. Pickup Time</Text>
        </View>

        <View style={styles.metricCard}>
          <Activity color="#3B82F6" size={28} />
          <Text style={styles.value}>{metrics.avgDeliveryLatency}m</Text>
          <Text style={styles.label}>Delivery Latency</Text>
        </View>

        <View style={styles.metricCard}>
          <AlertOctagon color="#EF4444" size={28} />
          <Text style={styles.value}>{metrics.cancellationRate}%</Text>
          <Text style={styles.label}>Cancellation Rate</Text>
        </View>
      </View>

      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartTitle}>Daily Order Volume</Text>
        {/* Integration with react-native-gifted-charts or similar */}
        <View style={styles.barContainer}>
          {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
            <View key={i} style={[styles.bar, { height: h }]} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metricCard: {
    width: (Dimensions.get('window').width - 64) / 2,
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333'
  } as any,
  value: { color: 'white', fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  label: { color: '#666', fontSize: 12, textTransform: 'uppercase' },
  chartPlaceholder: { marginTop: 32, backgroundColor: '#111', padding: 24, borderRadius: 32 },
  chartTitle: { color: '#888', marginBottom: 20, fontSize: 14, textTransform: 'uppercase' },
  barContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  bar: { width: 30, backgroundColor: '#E5F942', borderRadius: 4 }
});
