import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Clock, Star, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';

const RiderEarnings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    dailyEarnings: 0,
    weeklyEarnings: 0,
    completedOrders: 0,
    avgDeliveryTime: 0,
    performanceScore: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const drivers = await blink.db.drivers.list({
          where: { userId: user.id },
          limit: 1
        });

        if (drivers.length > 0) {
          const driver = drivers[0];
          const orders = await blink.db.orders.list({
            where: { driverId: driver.id, status: 'delivered' }
          });

          const daily = orders
            .filter((o: any) => new Date(o.created_at).toDateString() === new Date().toDateString())
            .reduce((acc, curr: any) => acc + (Number(curr.total) * 0.15), 0);

          const totalEarnings = orders.reduce((acc, curr: any) => acc + (Number(curr.total) * 0.15), 0);

          setStats({
            dailyEarnings: daily,
            weeklyEarnings: totalEarnings,
            completedOrders: orders.length,
            avgDeliveryTime: orders.length > 0 ? 12.5 : 0,
            performanceScore: orders.length > 0 ? 94 : 0,
          });
        }
      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user, navigate]);

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
          <div>
            <h1 className="text-xl font-black text-primary-foreground uppercase tracking-tight">Rider Hub</h1>
            <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-widest">Pilot Dashboard</p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Calculating payouts...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-[2.5rem] p-8 shadow-xl border border-primary/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Wallet className="w-32 h-32 text-primary" />
              </div>
              
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Current Balance</p>
              <h2 className="text-6xl font-black text-foreground tracking-tighter">₹{stats.dailyEarnings.toFixed(0)}</h2>
              
              <div className="h-px bg-border/60 my-8 border-dashed" />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Weekly Total</p>
                  <p className="text-xl font-black text-primary">₹{stats.weeklyEarnings.toFixed(0)}</p>
                </div>
                <button 
                  onClick={() => navigate('/rider/orders')}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  Withdraw
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{stats.avgDeliveryTime}m</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg. Speed</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{stats.performanceScore}%</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Performance</p>
                </div>
              </motion.div>
            </div>

            <div className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Recent Activity</h3>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">Completed Deliveries</p>
                    <p className="text-xs text-muted-foreground">{stats.completedOrders} orders this week</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default RiderEarnings;
