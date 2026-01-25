import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, Phone, Star } from 'lucide-react';
import { blink } from '@/lib/blink';
import { DbOrder, DbOrderItem, DbDriver, DbStore, DbAddress } from '@/lib/supabase-types';
import { BottomNav } from '@/components/layout/BottomNav';

interface OrderWithDetails extends DbOrder {
  order_items: DbOrderItem[];
  stores: DbStore;
  addresses: DbAddress;
}

const statusSteps = [
  { key: 'placed', label: 'Order Placed', icon: Package, description: 'We received your order' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Your order is confirmed' },
  { key: 'packing', label: 'Preparing', icon: Clock, description: 'Packing your items' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'On the way!' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, description: 'Enjoy!' },
];

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [driver, setDriver] = useState<DbDriver | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const orderData = await blink.db.orders.get(orderId);
        if (orderData) {
          const items = await blink.db.orderItems.list({ where: { orderId } });
          const store = await blink.db.stores.get(orderData.storeId);
          const address = await blink.db.addresses.get(orderData.addressId);
          
          setOrder({
            ...orderData,
            order_items: items,
            stores: store,
            addresses: address,
          } as any);

          if (orderData.driverId) {
            const driverData = await blink.db.drivers.get(orderData.driverId);
            setDriver(driverData as any);
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();

    // Subscribe to order updates
    const unsubscribeOrder = blink.realtime.subscribe(`order-tracking-${orderId}`, (message) => {
      if (message.type === 'order_update') {
        setOrder(prev => prev ? { ...prev, ...(message.data as any) } : null);
      }
    });

    // Subscribe to driver location updates if applicable
    let unsubscribeLocation: any;
    if (order?.driverId) {
      unsubscribeLocation = blink.realtime.subscribe(`driver-location-${order.driverId}`, (message) => {
        if (message.type === 'location_update') {
          setDriver(prev => prev ? { ...prev, currentLat: message.data.lat, currentLng: message.data.lng } : null);
        }
      });
    }

    return () => {
      unsubscribeOrder();
      if (unsubscribeLocation) unsubscribeLocation();
    };
  }, [orderId, order?.driverId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center">
          <Package className="w-12 h-12 text-muted-foreground/40" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">Order not found</h3>
          <p className="text-muted-foreground">The order you're looking for doesn't exist or you don't have access to it.</p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black shadow-xl shadow-primary/20"
        >
          VIEW ALL ORDERS
        </button>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const estimatedTime = new Date(order.estimated_delivery_time);
  const now = new Date();
  const minutesLeft = Math.max(0, Math.round((estimatedTime.getTime() - now.getTime()) / 60000));

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-primary shadow-lg shadow-primary/20">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/orders')}
            className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Order Status</h1>
            <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-widest">#{order.order_number}</p>
          </div>
        </div>
      </header>

      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="bg-primary/5 py-8 border-b border-primary/10">
          <div className="container text-center space-y-1">
            <motion.p
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-5xl font-black text-primary tracking-tighter"
            >
              {minutesLeft > 0 ? `${minutesLeft} min` : 'Arriving!'}
            </motion.p>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Estimated delivery time</p>
          </div>
        </div>
      )}

      <main className="container py-6 space-y-6">
        <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50">
          <div className="relative">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex gap-5 pb-8 last:pb-0">
                  {index < statusSteps.length - 1 && (
                    <div 
                      className={`absolute left-5 w-0.5 h-full ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-border/50'
                      }`}
                      style={{ top: '40px', height: 'calc(100% - 40px)' }}
                    />
                  )}
                  
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: isCurrent ? 1.2 : 1,
                      backgroundColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                      boxShadow: isCurrent ? '0 0 20px rgba(var(--primary), 0.4)' : 'none'
                    }}
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </motion.div>
                  
                  <div className="flex-1 pt-0.5">
                    <p className={`font-bold text-lg ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">{step.description}</p>
                  </div>
                  
                  {index < currentStepIndex && (
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {driver && order.status === 'out_for_delivery' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl p-5 shadow-xl border-2 border-primary/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden border">
                {driver.avatarUrl ? (
                  <img src={driver.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold">🛵</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Your Delivery Pilot</p>
                <p className="font-black text-xl text-foreground">{driver.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-lg text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{driver.rating || 4.5}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-bold uppercase">• {driver.vehicleType || 'Bike'}</span>
                </div>
              </div>
              <a href={`tel:${driver.phone}`} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Phone className="w-6 h-6 text-primary-foreground" />
              </a>
            </div>
            
            {order.otp && (
              <div className="mt-5 p-4 bg-muted/30 rounded-2xl border border-dashed flex flex-col items-center">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Delivery Handshake OTP</p>
                <p className="text-3xl font-black tracking-[0.5em] text-foreground">{order.otp}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-2">Share this with the pilot only at your doorstep</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="bg-card rounded-3xl p-5 shadow-sm border space-y-4">
          <h3 className="font-black text-foreground uppercase text-xs tracking-widest flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Delivery Address
          </h3>
          <div className="pl-6 border-l-2 border-primary/20">
            <p className="font-bold text-foreground capitalize">{order.addresses?.label || 'Address'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {order.addresses?.flat_number}, {order.addresses?.building}, {order.addresses?.street}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.addresses?.area}, {order.addresses?.city} - {order.addresses?.pincode}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-5 shadow-sm border space-y-4">
          <h3 className="font-black text-foreground uppercase text-xs tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Order Items ({order.order_items?.length || 0})
          </h3>
          <div className="space-y-4">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
                  {item.product_image ? (
                    <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-sm line-clamp-1">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground font-medium">Quantity: {item.quantity}</p>
                </div>
                <p className="font-black text-foreground">₹{(Number(item.price) * item.quantity).toFixed(0)}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-dashed space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="font-bold">₹{Number(order.subtotal).toFixed(0)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span className="font-medium">Discount</span>
                <span className="font-bold">-₹{Number(order.discount).toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Delivery Fee</span>
              <span className={Number(order.delivery_fee) === 0 ? 'text-primary font-black' : 'font-bold'}>
                {Number(order.delivery_fee) === 0 ? 'FREE' : `₹${order.delivery_fee}`}
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-black text-lg">Total</span>
              <span className="font-black text-2xl text-primary">₹{Number(order.total).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default OrderTracking;
