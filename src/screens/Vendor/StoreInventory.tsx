import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/react-native/supabase-client';
import { AlertTriangle, Package, CheckCircle, XCircle } from 'lucide-react-native';

interface ProductInventory {
  product_id: string;
  name: string;
  quantity: number;
  is_available: boolean;
  low_stock_threshold: number;
}

/**
 * StoreInventory (Vendor App)
 * Handles bulk stock toggles and low stock monitoring for the Pilot rollout.
 */
export const StoreInventory = ({ storeId }: { storeId: string }) => {
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();

    // Subscribe to stock changes (real-time updates from place_order_atomic)
    const channel = supabase
      .channel('store-inventory-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'store_inventory', filter: `store_id=eq.${storeId}` },
        () => fetchInventory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('store_inventory')
      .select(`
        product_id,
        quantity,
        is_available,
        low_stock_threshold,
        products (name)
      `)
      .eq('store_id', storeId);

    if (!error && data) {
      const formattedData = data.map((item: any) => ({
        product_id: item.product_id,
        name: item.products.name,
        quantity: item.quantity,
        is_available: item.is_available,
        low_stock_threshold: item.low_stock_threshold,
      }));
      setInventory(formattedData);
    }
    setLoading(false);
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('store_inventory')
      .update({ is_available: !currentStatus })
      .eq('store_id', storeId)
      .eq('product_id', productId);

    if (!error) {
      setInventory(prev => prev.map(p =>
        p.product_id === productId ? { ...p, is_available: !currentStatus } : p
      ));
    }
  };

  const renderItem = ({ item }: { item: ProductInventory }) => {
    const isLowStock = item.quantity <= item.low_stock_threshold;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemStock}>Stock: {item.quantity}</Text>
          </View>
          <Switch
            value={item.is_available}
            onValueChange={() => toggleAvailability(item.product_id, item.is_available)}
            trackColor={{ false: '#333', true: '#E5F942' }}
            thumbColor={item.is_available ? 'black' : '#666'}
          />
        </View>

        {isLowStock && item.is_available && (
          <View style={styles.alertContainer}>
            <AlertTriangle color="#F97316" size={16} />
            <Text style={styles.alertText}>Low Stock Warning</Text>
          </View>
        )}

        {!item.is_available && (
          <View style={[styles.alertContainer, { backgroundColor: '#EF444420' }]}>
            <XCircle color="#EF4444" size={16} />
            <Text style={[styles.alertText, { color: '#EF4444' }]}>Marked as Out of Stock</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator color="#E5F942" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Inventory</Text>
      <FlatList
        data={inventory}
        renderItem={renderItem}
        keyExtractor={item => item.product_id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 20 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  itemCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: 'white', fontSize: 18, fontWeight: '600' },
  itemStock: { color: '#888', fontSize: 14, marginTop: 4 },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F9731620',
    borderRadius: 8,
  },
  alertText: { color: '#F97316', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
});
