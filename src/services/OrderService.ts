import { supabase } from '../lib/react-native/supabase-client';
import { Order } from '../types';

/**
 * Sweeftcom Order Service
 * Handles the high-end handshake logic between Customer, Vendor, and Rider.
 */
export class OrderService {
  /**
   * Place an order with atomic inventory check via RPC
   */
  static async placeOrder(orderData: any) {
    const { data, error } = await supabase.rpc('place_order_atomic', {
      p_order_data: orderData
    });

    if (error) throw error;
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

    await supabase.functions.invoke('process-order', {
      body: { orderId }
    });

    return data;
  }

  /**
   * Secure Handshake: Verify Delivery OTP at the doorstep
   */
  static async verifyDeliveryOtp(orderId: string, otp: string) {
    const { data, error } = await supabase.rpc('complete_delivery_with_otp', {
      p_order_id: orderId,
      p_otp: otp
    });

    if (error) {
      console.error('OTP Verification Failed:', error.message);
      throw error;
    }

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
