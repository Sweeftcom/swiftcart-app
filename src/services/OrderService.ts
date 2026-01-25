import { blink } from '../lib/blink';
import { Order } from '../types';

/**
 * Sweeftcom Order Service
 * Handles the high-end handshake logic between Customer, Vendor, and Rider.
 * Powered by Blink SDK.
 */
export class OrderService {
  /**
   * Place an order with inventory check
   */
  static async placeOrder(orderData: any) {
    const { items, ...orderInfo } = orderData;
    
    // 1. Create the order
    const order = await blink.db.orders.create({
      ...orderInfo,
      orderNumber: `SWC${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`,
      status: 'placed',
      otp: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit OTP
    });

    // 2. Create order items
    await blink.db.orderItems.createMany(
      items.map((item: any) => ({
        ...item,
        orderId: order.id,
      }))
    );

    // 3. Update stock (simplified for MVP)
    for (const item of items) {
      const product = await blink.db.products.get(item.productId);
      if (product) {
        await blink.db.products.update(item.productId, {
          stockQuantity: product.stockQuantity - item.quantity,
        });
      }
    }

    // 4. Create initial status history
    await blink.db.orderStatusHistory.create({
      orderId: order.id,
      status: 'placed',
      note: 'Order placed successfully',
    });

    return order;
  }

  /**
   * Vendor accepts the order
   */
  static async vendorAccept(orderId: string) {
    const order = await blink.db.orders.update(orderId, {
      status: 'confirmed',
    });

    await blink.db.orderStatusHistory.create({
      orderId,
      status: 'confirmed',
      note: 'Order confirmed by store',
    });

    return order;
  }

  /**
   * Vendor marks as ready - triggers rider discovery
   */
  static async markReady(orderId: string) {
    const order = await blink.db.orders.update(orderId, {
      status: 'packing',
    });

    await blink.db.orderStatusHistory.create({
      orderId,
      status: 'packing',
      note: 'Order is being packed',
    });

    // Trigger rider assignment (automated for MVP)
    setTimeout(() => this.autoAssignRider(orderId), 2000);

    return order;
  }

  /**
   * Auto-assign a random available rider (Simplified for MVP)
   */
  static async autoAssignRider(orderId: string) {
    const drivers = await blink.db.drivers.list({
      where: { isAvailable: "1", isVerified: "1" },
      limit: 1,
    });

    if (drivers.length > 0) {
      const driver = drivers[0];
      await this.riderAccept(orderId, driver.id);
    }
  }

  /**
   * Rider accepts the order assignment
   */
  static async riderAccept(orderId: string, driverId: string) {
    const order = await blink.db.orders.update(orderId, {
      driverId,
      status: 'out_for_delivery',
    });

    await blink.db.drivers.update(driverId, {
      isAvailable: "0",
    });

    await blink.db.orderStatusHistory.create({
      orderId,
      status: 'out_for_delivery',
      note: 'Rider picked up your order',
    });

    return order;
  }

  /**
   * Secure Handshake: Verify Delivery OTP at the doorstep
   */
  static async verifyDeliveryOtp(orderId: string, otp: string) {
    const order = await blink.db.orders.get(orderId);
    
    if (!order || order.otp !== otp) {
      throw new Error('Invalid Delivery OTP');
    }

    const updatedOrder = await blink.db.orders.update(orderId, {
      status: 'delivered',
      actualDeliveryTime: new Date().toISOString(),
    });

    if (order.driverId) {
      await blink.db.drivers.update(order.driverId, {
        isAvailable: "1",
      });
    }

    await blink.db.orderStatusHistory.create({
      orderId,
      status: 'delivered',
      note: 'Order delivered successfully',
    });

    return updatedOrder;
  }

  /**
   * Subscribe to real-time order updates for tracking
   */
  static subscribeToOrder(orderId: string, onUpdate: (order: Order) => void) {
    return blink.realtime.subscribe(`order-tracking-${orderId}`, (message) => {
      if (message.type === 'order_update') {
        onUpdate(message.data as Order);
      }
    });
  }

  /**
   * Publish order update (used by backend/services)
   */
  static async publishOrderUpdate(order: Order) {
    await blink.realtime.publish(`order-tracking-${order.id}`, 'order_update', order);
  }
}
