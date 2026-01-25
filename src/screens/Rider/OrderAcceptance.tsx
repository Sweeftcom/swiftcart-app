import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Clock, ShoppingBag, ChevronRight, ArrowLeft, Loader2, Zap } from 'lucide-react';
import { OrderService } from '@/services/OrderService';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { toast } from 'sonner';

const RiderOrderAcceptance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [driver, setDriver] = useState<any>(null);

  // Slider motion values
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 200], [1, 0]);
  const SLIDE_THRESHOLD = 200;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchPendingOrder = async () => {
      setLoading(true);
      try {
        const drivers = await blink.db.drivers.list({
          where: { userId: user.id },
          limit: 1
        });

        if (drivers.length > 0) {
          const activeDriver = drivers[0];
          setDriver(activeDriver);
          
          // Find orders pending assignment
          const pendingOrders = await blink.db.orders.list({
            where: { status: 'confirmed' },
            limit: 1
          });

          if (pendingOrders.length > 0) {
            const orderData = pendingOrders[0];
            const store = await blink.db.stores.get(orderData.storeId);
            const address = await blink.db.addresses.get(orderData.addressId);
            setOrder({ ...orderData, store, address });
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrder();
  }, [user, navigate]);

  const handleAccept = async () => {
    if (!order || !driver) return;
    
    setIsAccepting(true);
    try {
      await OrderService.riderAccept(order.id, driver.id);
      toast.success('Delivery accepted! 🚀');
      navigate('/rider/earnings');
    } catch (error) {
      toast.error('Failed to accept order');
      x.set(0);
    } finally {
      setIsAccepting(false);
    }
  };

  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      if (latest >= SLIDE_THRESHOLD && !isAccepting) {
        handleAccept();
      }
    });
    return () => unsubscribe();
  }, [x, isAccepting, order, driver]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Searching for deliveries...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <header className="sticky top-0 z-50 bg-primary shadow-lg shadow-primary/20">
          <div className="container py-4 flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-xl font-black text-primary-foreground uppercase">Deliveries</h1>
          </div>
        </header>
        <main className="container py-20 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-secondary/50 rounded-[2.5rem] flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">System Idle</h3>
            <p className="text-muted-foreground font-medium max-w-xs mx-auto">No pending delivery tasks in your area. We'll alert you when a new order drops.</p>
          </div>
          <button 
            onClick={() => navigate('/rider/earnings')}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            VIEW MY EARNINGS
          </button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-primary shadow-lg shadow-primary/20">
        <div className="container py-4 flex items-center justify-center">
          <h1 className="text-xl font-black text-primary-foreground uppercase tracking-[0.2em]">New Assignment!</h1>
        </div>
      </header>

      <main className="container py-8 space-y-8 flex flex-col h-[calc(100vh-160px)]">
        <div className="text-center space-y-2">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Estimated Payout</p>
          <h2 className="text-7xl font-black text-foreground tracking-tighter">₹45.00</h2>
        </div>

        <div className="bg-card rounded-[2.5rem] p-8 shadow-xl border border-primary/10 flex-1 flex flex-col justify-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap className="w-32 h-32 text-primary fill-primary" />
          </div>

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
              <ShoppingBag className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pick up from</p>
              <p className="font-black text-xl text-foreground uppercase tracking-tight truncate">{order.store?.name}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase truncate">{order.store?.address}</p>
            </div>
          </div>

          <div className="h-px bg-border/40 ml-20 border-dashed" />

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Deliver to</p>
              <p className="font-black text-xl text-foreground uppercase tracking-tight truncate">{order.address?.area}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase truncate">{order.address?.city}</p>
            </div>
          </div>

          <div className="h-px bg-border/40 ml-20 border-dashed" />

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Delivery SLA</p>
              <p className="font-black text-xl text-foreground uppercase tracking-tight truncate">8 Minutes</p>
              <p className="text-xs text-amber-600 font-bold uppercase truncate">Lightning Mode Active</p>
            </div>
          </div>
        </div>

        <div className="relative h-24 bg-secondary/50 rounded-full p-2 border-2 border-border/40 overflow-hidden flex items-center justify-center group shadow-inner">
          <motion.p 
            style={{ opacity }}
            className="text-xs font-black text-muted-foreground uppercase tracking-[0.4em] absolute animate-pulse"
          >
            Slide to Accept
          </motion.p>
          
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: SLIDE_THRESHOLD }}
            dragElastic={0.1}
            style={{ x }}
            className="absolute left-2 w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(var(--primary),0.4)] cursor-grab active:cursor-grabbing z-10 border-4 border-white/10 group-hover:scale-105 transition-transform"
          >
            {isAccepting ? (
              <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
            ) : (
              <ChevronRight className="w-10 h-10 text-primary-foreground" strokeWidth={4} />
            )}
          </motion.div>
          
          <motion.div 
            className="absolute left-0 top-0 bottom-0 bg-primary/10 rounded-l-full" 
            style={{ width: x }} 
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default RiderOrderAcceptance;
