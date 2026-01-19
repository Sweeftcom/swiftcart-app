import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { supabase } from '../../lib/react-native/supabase-client';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * BusinessHealth (Admin Dashboard)
 * Metrics for investors: CAC, AOV, and Churn.
 */
export const BusinessHealth = () => {
  const [metrics, setMetrics] = useState({
    cac: 0,
    aov: 0,
    churnRate: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, []);

  const calculateMetrics = async () => {
    // 1. Fetch data for CAC (Referral Spend / New Users)
    const { data: referrals } = await supabase.from('referrals').select('reward_amount').eq('status', 'completed');
    const { count: newUserCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    const totalReferralSpend = referrals?.reduce((acc, curr) => acc + Number(curr.reward_amount), 0) || 0;
    const cac = newUserCount ? (totalReferralSpend / newUserCount) : 0;

    // 2. Fetch data for AOV (Revenue / Total Orders)
    const { data: orders } = await supabase.from('orders').select('total').eq('status', 'delivered');
    const totalRevenue = orders?.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;
    const aov = orders?.length ? (totalRevenue / orders.length) : 0;

    // 3. Mock Churn logic for the dashboard
    setMetrics({
      cac: parseFloat(cac.toFixed(2)),
      aov: parseFloat(aov.toFixed(2)),
      churnRate: 12.5, // Mock percentage for UI
      totalRevenue
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Investor Dashboard</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Revenue</Text>
        <Text style={styles.heroValue}>₹{metrics.totalRevenue.toLocaleString()}</Text>
        <View style={styles.trendTag}>
          <TrendingUp color="#E5F942" size={16} />
          <Text style={styles.trendText}>+18.4% this week</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Users color="#3B82F6" size={24} />
          <Text style={styles.statValue}>₹{metrics.cac}</Text>
          <Text style={styles.statLabel}>CAC (Per User)</Text>
        </View>

        <View style={styles.statCard}>
          <DollarSign color="#22C55E" size={24} />
          <Text style={styles.statValue}>₹{metrics.aov}</Text>
          <Text style={styles.statLabel}>Avg. Order Value</Text>
        </View>

        <View style={styles.statCard}>
          <Activity color="#EF4444" size={24} />
          <Text style={styles.statValue}>{metrics.churnRate}%</Text>
          <Text style={styles.statLabel}>Churn Rate</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  heroCard: { backgroundColor: '#1A1A1A', padding: 32, borderRadius: 32, marginBottom: 24, borderWidth: 1, borderColor: '#333' },
  heroLabel: { color: '#666', fontSize: 16, marginBottom: 8 },
  heroValue: { color: 'white', fontSize: 44, fontWeight: 'bold' },
  trendTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#E5F94210', padding: 6, borderRadius: 8, alignSelf: 'flex-start' },
  trendText: { color: '#E5F942', fontSize: 12, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCard: {
    width: (width - 64) / 2,
    backgroundColor: '#111',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222'
  } as any,
  statValue: { color: 'white', fontSize: 22, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { color: '#555', fontSize: 12, textTransform: 'uppercase' }
});
