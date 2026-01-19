import { supabase } from '../lib/react-native/supabase-client';
import { Order } from '../types';

// Detect environment for configuration
const isVite = typeof import.meta !== 'undefined' && import.meta.env;
const getEnvVar = (name: string) => {
  if (isVite) return import.meta.env[name];
  return process.env[name];
};

/**
 * Sweeftcom Order Service
 * Handles the high-end handshake logic between Customer, Vendor, and Rider.
 * Optimized for React Native with Realtime subscriptions.
 */
export class OrderService {
  /**
   * Place an order with atomic inventory check via RPC
   */
  static async placeOrder(orderData: any) {
    const { data, error } = await supabase.rpc('place_order_atomic', {
      p_order_data: orderData
    });

    if (error) {
      console.error('Order placement failed:', error.message);
      throw error;
    }

    // In a production environment, this would trigger a push notification
    // via a Supabase Edge Function or an external service like OneSignal.
    return data;
  }

  /**
   * Vendor accepts the order
   */
  static async vendorAccept(orderId: string) {
    const { data, error } = await supabase.rpc('accept_order_by_vendor', {
      p_order_id: orderId
    });
    if (error) throw error;
    return data;
  }

  /**
   * Vendor marks as ready - triggers rider discovery
   */
  static async markReady(orderId: string) {
    const { data, error } = await supabase.rpc('mark_order_ready', {
      p_order_id: orderId
    });
    if (error) throw error;

    // Invoke Edge Function for Rider Matching (Blinkit logic)
    await supabase.functions.invoke('process-order', {
      body: { orderId }
    });

    return data;
  }

  /**
   * Rider accepts the order assignment
   */
  static async riderAccept(orderId: string, driverId: string) {
    const { data, error } = await supabase.rpc('assign_order_to_driver', {
      p_order_id: orderId,
      p_driver_id: driverId
    });
    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to real-time order updates for tracking
   */
  static subscribeToOrder(orderId: string, onUpdate: (order: Order) => void) {
    return supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          onUpdate(payload.new as Order);
        }
      )
      .subscribe();
  }
}
