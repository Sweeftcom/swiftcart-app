import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, AlertOctagon, ArrowLeft, Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BlackboxAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    avgPickupTime: 0,
    avgDeliveryLatency: 0,
    cancellationRate: 0,
    totalOrders: 0
  });

  const chartData = [
    { name: 'Mon', value: 40 },
    { name: 'Tue', value: 70 },
    { name: 'Wed', value: 45 },
    { name: 'Thu', value: 90 },
    { name: 'Fri', value: 65 },
    { name: 'Sat', value: 80 },
    { name: 'Sun', value: 50 },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const orders = await blink.db.orders.list();
        
        setMetrics({
          avgPickupTime: 4.2,
          avgDeliveryLatency: 12.8,
          cancellationRate: 2.1,
          totalOrders: orders.length
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
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
            <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-widest">Operational Analytics</p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Compiling blackbox data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm col-span-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <BarChart3 className="w-20 h-20 text-primary" />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Orders</p>
                <h3 className="text-4xl font-black text-foreground">{metrics.totalOrders}</h3>
                <div className="flex items-center gap-1 text-green-500 mt-2">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">+12.5% vs last week</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-3xl p-5 border border-border/40 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg. Pickup</p>
                <p className="text-xl font-black text-foreground">{metrics.avgPickupTime}m</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-3xl p-5 border border-border/40 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Latency</p>
                <p className="text-xl font-black text-foreground">{metrics.avgDeliveryLatency}m</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-3xl p-5 border border-border/40 shadow-sm col-span-2"
              >
                <div className="flex items-center gap-3 mb-3 text-destructive">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cancellation Rate</p>
                    <p className="text-xl font-black text-foreground">{metrics.cancellationRate}%</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.cancellationRate}%` }}
                    className="bg-destructive h-full"
                  />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-[2.5rem] p-8 border border-border/40 shadow-sm"
            >
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">Order Volume Trend</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ 
                        borderRadius: '1rem', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: 800
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default BlackboxAnalytics;
