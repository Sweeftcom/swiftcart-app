import { useEffect, useState } from 'react';
import { blink } from '@/lib/blink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Truck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const OrderHeartbeat = () => {
  const navigate = useNavigate();
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveOrders();
    const unsubscribe = blink.realtime.subscribe('live-heartbeat', () => {
      fetchActiveOrders();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const orders = await blink.db.orders.list({
        where: {
          AND: [
            { status: { ne: 'delivered' } },
            { status: { ne: 'cancelled' } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      const ordersWithDetails = await Promise.all(
        orders.map(async (order: any) => {
          const store = await blink.db.stores.get(order.storeId);
          const history = await blink.db.orderStatusHistory.list({
            where: { orderId: order.id }
          });
          return { ...order, store, statusHistory: history };
        })
      );

      setActiveOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  };

  const calculateDelay = (createdAt: string, status: string, history: any[]) => {
    const statusEntry = history.find(h => h.status === status);
    if (!statusEntry) return null;
    const diff = (new Date(statusEntry.createdAt).getTime() - new Date(createdAt).getTime()) / 1000 / 60;
    return Math.round(diff * 10) / 10;
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Order Heartbeat</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeOrders.map((order, index) => {
          const vendorDelay = calculateDelay(order.createdAt, 'confirmed', order.statusHistory);
          const riderDelay = calculateDelay(order.createdAt, 'out_for_delivery', order.statusHistory);

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card border-border/40 shadow-sm rounded-[2rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/10">
                  <div>
                    <CardTitle className="font-black text-xl tracking-tight">{order.orderNumber}</CardTitle>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                      {order.store?.name} • {formatDistanceToNow(new Date(order.createdAt))} ago
                    </p>
                  </div>
                  <Badge className={`rounded-xl font-black text-[10px] tracking-widest px-3 py-1 ${
                    order.status === 'placed' ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'
                  }`}>
                    {order.status.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  <div className="flex justify-between items-center relative px-4">
                    <div className="absolute top-5 left-0 w-full h-0.5 bg-border/40 -z-0" />

                    {/* Step 1: Placed */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Clock size={18} className="text-white" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-muted-foreground">Placed</p>
                    </div>

                    {/* Step 2: Vendor Accepted */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        vendorDelay ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-secondary border border-border'
                      }`}>
                        <CheckCircle2 size={18} className={vendorDelay ? 'text-white' : 'text-muted-foreground'} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-muted-foreground">Accepted</p>
                      {vendorDelay && (
                        <span className={`text-[10px] font-black mt-1 ${vendorDelay > 1 ? 'text-destructive' : 'text-green-600'}`}>
                          {vendorDelay}m
                        </span>
                      )}
                    </div>

                    {/* Step 3: Rider Out */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        riderDelay ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-secondary border border-border'
                      }`}>
                        <Truck size={18} className={riderDelay ? 'text-primary-foreground' : 'text-muted-foreground'} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-muted-foreground">Rider Out</p>
                      {riderDelay && (
                        <span className={`text-[10px] font-black mt-1 ${riderDelay > 5 ? 'text-destructive' : 'text-primary'}`}>
                          {riderDelay}m
                        </span>
                      )}
                    </div>
                  </div>

                  {order.status === 'placed' && (Date.now() - new Date(order.createdAt).getTime()) > 60000 && (
                    <motion.div 
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="mt-8 flex items-center justify-center gap-2 text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20"
                    >
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">DELAY PROTOCOL ACTIVE! CONTACT VENDOR</span>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {activeOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-32 h-32 bg-secondary rounded-[3rem] flex items-center justify-center rotate-12">
              <CheckCircle2 size={64} className="text-muted-foreground/20 -rotate-12" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-2xl text-foreground uppercase tracking-tight">Zero Backlog</h3>
              <p className="text-muted-foreground font-medium max-w-xs">All orders processed. Aurangabad is satisfied.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
