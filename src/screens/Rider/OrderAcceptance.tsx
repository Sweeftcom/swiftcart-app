import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { OrderService } from '../../services/OrderService';
import { LucideMapPin, LucideClock, LucideShoppingBag } from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * Rider Order Acceptance Screen
 * Features: Blinkit-style dark UI, Skeleton loaders (conceptual),
 * and a sliding acceptance button logic.
 */
export const OrderAcceptance = ({ route }: any) => {
  const { order } = route.params;
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      // Haptic feedback logic would go here
      // ReactNativeHapticFeedback.trigger("impactHeavy");

      await OrderService.riderAccept(order.id, 'current-driver-id');

      // Navigate to delivery tracking
      // navigation.navigate('DeliveryExecution', { orderId: order.id });
    } catch (error) {
      console.error('Failed to accept order:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0A] p-6 justify-between">
      {/* Header Info */}
      <View>
        <Text className="text-white text-3xl font-bold mb-2">New Delivery!</Text>
        <Text className="text-gray-400 text-lg">Earnings: ₹45.00</Text>
      </View>

      {/* Order Card */}
      <View className="bg-[#1A1A1A] rounded-3xl p-6 border border-[#333]">
        <View className="flex-row items-center mb-6">
          <View className="bg-green-500/20 p-3 rounded-full mr-4">
            <LucideShoppingBag color="#22C55E" size={24} />
          </View>
          <View>
            <Text className="text-white font-semibold text-lg">{order.store.name}</Text>
            <Text className="text-gray-500">Pick up from Dark Store</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-6">
          <View className="bg-blue-500/20 p-3 rounded-full mr-4">
            <LucideMapPin color="#3B82F6" size={24} />
          </View>
          <View>
            <Text className="text-white font-semibold text-lg">2.4 km away</Text>
            <Text className="text-gray-500">Delivery to Nirala Bazar</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="bg-orange-500/20 p-3 rounded-full mr-4">
            <LucideClock color="#F97316" size={24} />
          </View>
          <View>
            <Text className="text-white font-semibold text-lg">8 mins</Text>
            <Text className="text-gray-500">Delivery Deadline</Text>
          </View>
        </View>
      </View>

      {/* Sliding Accept Button (Simulated with Touchable for now) */}
      <TouchableOpacity
        onPress={handleAccept}
        disabled={isAccepting}
        activeOpacity={0.8}
        className={`h-20 w-full rounded-full flex-row items-center justify-center ${isAccepting ? 'bg-gray-700' : 'bg-[#E5F942]'}`}
      >
        <Text className={`text-xl font-bold ${isAccepting ? 'text-gray-400' : 'text-black'}`}>
          {isAccepting ? 'ACCEPTING...' : 'SLIDE TO ACCEPT'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
