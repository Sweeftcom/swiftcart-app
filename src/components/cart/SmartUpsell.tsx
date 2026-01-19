import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/react-native/supabase-client';
import { Plus } from 'lucide-react-native';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

/**
 * SmartUpsell Engine
 * Suggests "Frequently Bought Together" items to increase AOV.
 */
export const SmartUpsell = ({ cartItems }: { cartItems: any[] }) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    if (cartItems.length > 0) {
      fetchRecommendations();
    }
  }, [cartItems]);

  const fetchRecommendations = async () => {
    // 1. Get categories of items currently in cart
    const categoryIds = cartItems.map(item => item.product.category_id);

    // 2. Fetch top products from the same or complementary categories
    // Conceptual: In a larger scale, this would be a specialized recommendation RPC
    const { data } = await supabase
      .from('products')
      .select('id, name, price, images')
      .in('category_id', categoryIds)
      .not('id', 'in', `(${cartItems.map(i => i.product.id).join(',')})`)
      .limit(5);

    if (data) {
      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.images[0] || 'https://via.placeholder.com/150'
      }));
      setRecommendations(formatted);
    }
  };

  if (recommendations.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Frequently Bought Together</Text>
      <FlatList
        horizontal
        data={recommendations}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={styles.footer}>
              <Text style={styles.price}>₹{item.price}</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Plus color="black" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingBottom: 24 },
  header: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: '#1A1A1A', padding: 12, borderRadius: 16, marginRight: 12, width: 140 },
  image: { width: '100%', height: 80, borderRadius: 8, backgroundColor: '#000' },
  name: { color: '#ccc', fontSize: 13, marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { color: 'white', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#E5F942', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});
