import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, Phone, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DbOrder, DbOrderItem, DbDriver, DbStore, DbAddress } from '@/lib/supabase-types';
import { BottomNav } from '@/components/layout/BottomNav';

interface OrderWithDetails extends DbOrder {
  order_items: DbOrderItem[];
  drivers: DbDriver | null;
  stores: DbStore;
  addresses: DbAddress;
}

const statusSteps = [
  { key: 'placed', label: 'Order Placed', icon: Package, description: 'We received your order' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Your order is confirmed' },
  { key: 'preparing', label: 'Preparing', icon: Clock, description: 'Packing your items' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'On the way!' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, description: 'Enjoy!' },
];

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          drivers(*),
          stores(*),
          addresses(*)
        `)
        .eq('id', orderId)
        .single();

      if (data) setOrder(data as OrderWithDetails);
      setIsLoading(false);
    };

    if (orderId) fetchOrder();

    // Subscribe to order updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new } : null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-4xl mb-4">📦</p>
        <p className="text-foreground font-medium">Order not found</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          View All Orders
        </button>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const estimatedTime = new Date(order.estimated_delivery_time);
  const now = new Date();
  const minutesLeft = Math.max(0, Math.round((estimatedTime.getTime() - now.getTime()) / 60000));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/orders')}
            className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Track Order</h1>
            <p className="text-sm text-primary-foreground/70">#{order.order_number}</p>
          </div>
        </div>
      </header>

      {/* ETA Banner */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="bg-primary/10 py-4">
          <div className="container text-center">
            <motion.p
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold text-primary"
            >
              {minutesLeft > 0 ? `${minutesLeft} min` : 'Arriving now!'}
            </motion.p>
            <p className="text-muted-foreground">Estimated delivery time</p>
          </div>
        </div>
      )}

      <main className="container py-6 space-y-6">
        {/* Status Timeline */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="relative">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                  {/* Line */}
                  {index < statusSteps.length - 1 && (
                    <div 
                      className={`absolute left-5 w-0.5 h-12 ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-border'
                      }`}
                      style={{ top: `${index * 72 + 40}px` }}
                    />
                  )}
                  
                  {/* Icon */}
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'
                    }}
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </motion.div>
                  
                  {/* Text */}
                  <div className="flex-1 pt-1">
                    <p className={`font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  
                  {/* Check */}
                  {index < currentStepIndex && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Info */}
        {order.drivers && order.status === 'out_for_delivery' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-card"
          >
            <h3 className="font-semibold text-foreground mb-3">Delivery Partner</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {order.drivers.avatar_url ? (
                  <img src={order.drivers.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🛵</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{order.drivers.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span>{order.drivers.rating || 4.5}</span>
                  <span>• {order.drivers.vehicle_type}</span>
                </div>
              </div>
              <a
                href={`tel:${order.drivers.phone}`}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                <Phone className="w-5 h-5 text-primary-foreground" />
              </a>
            </div>
          </motion.div>
        )}

        {/* Delivery Address */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="font-semibold text-foreground mb-3">Delivery Address</h3>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground capitalize">{order.addresses.label}</p>
              <p className="text-sm text-muted-foreground">
                {order.addresses.flat_number}, {order.addresses.building}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.addresses.area}, {order.addresses.city} - {order.addresses.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="font-semibold text-foreground mb-3">
            Order Items ({order.order_items.length})
          </h3>
          <div className="space-y-3">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {item.product_image ? (
                    <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm line-clamp-1">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-foreground">₹{Number(item.price) * item.quantity}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{Number(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Discount</span>
                <span>-₹{Number(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className={Number(order.delivery_fee) === 0 ? 'text-primary' : ''}>
                {Number(order.delivery_fee) === 0 ? 'FREE' : `₹${order.delivery_fee}`}
              </span>
            </div>
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border">
              <span>Total</span>
              <span>₹{Number(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-semibold text-foreground capitalize">
                {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method.toUpperCase()}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.payment_status === 'completed' 
                ? 'bg-primary/10 text-primary' 
                : 'bg-accent/10 text-accent-foreground'
            }`}>
              {order.payment_status === 'completed' ? 'Paid' : order.payment_status}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default OrderTracking;