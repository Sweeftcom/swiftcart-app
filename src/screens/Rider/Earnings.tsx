import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { supabase } from '../../lib/react-native/supabase-client';
import { Wallet, TrendingUp, Clock, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * Rider Earnings & Performance UI
 * Logic: Calculates earnings based on completed orders and performance SLA.
 */
export const RiderEarnings = ({ driverId }: { driverId: string }) => {
  const [stats, setStats] = useState({
    dailyEarnings: 0,
    weeklyEarnings: 0,
    completedOrders: 0,
    avgDeliveryTime: 0, // In minutes
    performanceScore: 0,
  });

  useEffect(() => {
    fetchEarnings();
  }, [driverId]);

  const fetchEarnings = async () => {
    // 1. Fetch completed orders for the current driver
    const { data, error } = await supabase
      .from('orders')
      .select('total, actual_delivery_time, created_at, status')
      .eq('driver_id', driverId)
      .eq('status', 'delivered');

    if (data) {
      const daily = data
        .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
        .reduce((acc, curr) => acc + (Number(curr.total) * 0.15), 0); // 15% commission mock

      const weekly = data.reduce((acc, curr) => acc + (Number(curr.total) * 0.15), 0);

      // SLA Logic: Target 10 minutes from 'packing' to 'delivered'
      // This is a simplified SLA calculation for the pilot
      const avgTime = data.length > 0 ? 12.5 : 0; // Mock average
      const score = data.length > 0 ? 94 : 0; // Mock score

      setStats({
        dailyEarnings: daily,
        weeklyEarnings: weekly,
        completedOrders: data.length,
        avgDeliveryTime: avgTime,
        performanceScore: score,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Earnings</Text>
        <Text style={styles.headerSubtitle}>Aurangabad Pilot Phase</Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.cardLabel}>Daily Balance</Text>
        <Text style={styles.earningsAmount}>₹{stats.dailyEarnings.toFixed(2)}</Text>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.weeklyLabel}>Weekly Total</Text>
          <Text style={styles.weeklyAmount}>₹{stats.weeklyEarnings.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Clock color="#E5F942" size={24} />
          <Text style={styles.gridValue}>{stats.avgDeliveryTime}m</Text>
          <Text style={styles.gridLabel}>Avg. Speed</Text>
        </View>
        <View style={styles.gridItem}>
          <Star color="#E5F942" size={24} />
          <Text style={styles.gridValue}>{stats.performanceScore}%</Text>
          <Text style={styles.gridLabel}>Performance</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <TrendingUp color="#888" size={20} />
          <Text style={styles.statText}>Orders Completed: {stats.completedOrders}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 20 },
  header: { marginBottom: 32, marginTop: 20 },
  headerTitle: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  headerSubtitle: { color: '#E5F942', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 },
  mainCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 32,
    padding: 32,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  cardLabel: { color: '#888', fontSize: 16, marginBottom: 8 },
  earningsAmount: { color: 'white', fontSize: 48, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyLabel: { color: '#888', fontSize: 16 },
  weeklyAmount: { color: '#E5F942', fontSize: 20, fontWeight: 'bold' },
  grid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  gridItem: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  gridValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
  gridLabel: { color: '#666', fontSize: 12, textTransform: 'uppercase' },
  statsCard: { backgroundColor: '#111', borderRadius: 20, padding: 20 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statText: { color: '#888', fontSize: 16 },
});
