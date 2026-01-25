import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, MapPin, Star, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { DbOrder, DbOrderItem } from '@/lib/supabase-types';
import { format } from 'date-fns';

interface OrderWithItems extends DbOrder {
  items: DbOrderItem[];
}

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const ordersData = await blink.db.orders.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        });

        const ordersWithItems = await Promise.all(
          ordersData.map(async (order: any) => {
            const items = await blink.db.orderItems.list({
              where: { orderId: order.id }
            });
            return { ...order, items };
          })
        );

        setOrders(ordersWithItems as any);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-600';
      case 'out_for_delivery':
        return 'bg-blue-500/10 text-blue-600';
      case 'packing':
      case 'confirmed':
        return 'bg-amber-500/10 text-amber-600';
      case 'placed':
        return 'bg-primary/10 text-primary';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-card shadow-card border-b">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold text-foreground">My Orders</h1>
        </div>
      </header>

      <main className="container py-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Fetching your orders...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b border-border bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-foreground">{order.order_number}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{format(new Date(order.created_at), 'MMM dd, yyyy • hh:mm a')}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2 mb-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">
                        {item.product_name} <span className="text-foreground font-bold ml-1">x{item.quantity}</span>
                      </span>
                      <span className="font-bold">₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Amount</p>
                    <p className="text-xl font-black text-foreground">₹{Number(order.total).toFixed(0)}</p>
                  </div>
                  
                  {['out_for_delivery', 'packing', 'confirmed', 'placed'].includes(order.status) && (
                    <Link to={`/orders/${order.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20"
                      >
                        <MapPin className="w-4 h-4" />
                        TRACK LIVE
                      </motion.button>
                    </Link>
                  )}

                  {order.status === 'delivered' && !order.rating && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-black shadow-lg shadow-amber-500/20"
                    >
                      <Star className="w-4 h-4 fill-white" />
                      RATE ORDER
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="border-t border-border bg-muted/5">
                <div className="flex">
                  <button className="flex-1 p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-primary hover:bg-secondary/50 transition-colors">
                    View Details
                  </button>
                  <div className="w-px bg-border" />
                  <button className="flex-1 p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:bg-secondary/50 transition-colors">
                    Need Help?
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">No orders yet</h3>
              <p className="text-muted-foreground">Looks like you haven't ordered anything yet. Your favorite essentials are just a tap away!</p>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black shadow-xl shadow-primary/20"
            >
              START SHOPPING
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Orders;
