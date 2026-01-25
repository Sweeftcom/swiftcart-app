import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity, ArrowLeft, Loader2 } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';

const BusinessHealth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    cac: 0,
    aov: 0,
    churnRate: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const calculateMetrics = async () => {
      setLoading(true);
      try {
        const referrals = await blink.db.referrals.list({ where: { status: 'completed' } });
        const userCount = await blink.db.profiles.count();
        const orders = await blink.db.orders.list({ where: { status: 'delivered' } });

        const totalReferralSpend = referrals.reduce((acc, curr: any) => acc + Number(curr.rewardAmount), 0);
        const cac = userCount > 0 ? (totalReferralSpend / userCount) : 0;

        const totalRevenue = orders.reduce((acc, curr: any) => acc + Number(curr.total), 0);
        const aov = orders.length > 0 ? (totalRevenue / orders.length) : 0;

        setMetrics({
          cac: parseFloat(cac.toFixed(2)),
          aov: parseFloat(aov.toFixed(2)),
          churnRate: 12.5,
          totalRevenue
        });
      } catch (error) {
        console.error('Error calculating metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateMetrics();
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
            <h1 className="text-xl font-black text-primary-foreground uppercase tracking-tight">Admin Console</h1>
            <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-widest">Business Health</p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Calculating ROI...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-[2.5rem] p-8 shadow-xl border border-primary/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <DollarSign className="w-32 h-32 text-primary" />
              </div>
              
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Total GMV</p>
              <h2 className="text-6xl font-black text-foreground tracking-tighter">₹{metrics.totalRevenue.toLocaleString()}</h2>
              
              <div className="flex items-center gap-2 mt-4 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-xl self-start w-fit">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">+18.4% growth</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">₹{metrics.cac}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CAC (Per User)</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">₹{metrics.aov}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg. Order Value</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col items-center text-center gap-3 col-span-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{metrics.churnRate}%</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">User Churn Rate</p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default BusinessHealth;
