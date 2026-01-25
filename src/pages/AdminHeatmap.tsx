import { useEffect, useState } from 'react';
import { blink } from '@/lib/blink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heatmap } from '@/admin/Heatmap';
import { motion } from 'framer-motion';
import { Loader2, Users, MapPin, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminHeatmap = () => {
  const navigate = useNavigate();
  const [activeRiders, setActiveRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const data = await blink.db.drivers.list({
          where: { status: 'online' }
        });
        setActiveRiders(data as any);
      } catch (error) {
        console.error('Error fetching riders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();

    const unsubscribe = blink.realtime.subscribe('admin-heat-page', () => {
      fetchRiders();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Pulse Dashboard</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">Real-time Logistics Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-2xl border border-primary/20 shadow-xl shadow-primary/5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-black text-xs uppercase tracking-widest">
            {activeRiders.length} Pilots Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-[700px]">
          <div className="h-full rounded-[3rem] overflow-hidden border-2 border-border/60 shadow-2xl">
            <Heatmap />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card border-border/60 shadow-sm rounded-[2rem] overflow-hidden border-2">
            <CardHeader className="bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                <Activity className="w-4 h-4 text-primary" />
                Live Logistics Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Syncing with fleet...</p>
                </div>
              ) : activeRiders.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeRiders.map((rider, index) => (
                    <motion.div 
                      key={rider.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{rider.name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{rider.vehicleType || 'Bike'} • {rider.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end text-primary mb-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] font-black tracking-tighter uppercase italic">Live GPS</span>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border/40">
                            {rider.currentLat?.toFixed(4)}, {rider.currentLng?.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/5 rounded-3xl border border-dashed">
                  <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">No pilots currently online</p>
                </div>
              )}
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-primary rounded-[2rem] p-6 shadow-xl shadow-primary/20 text-primary-foreground relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Activity className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Fleet Health</p>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Operational</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div className="bg-white h-full w-[94%]" />
              </div>
              <span className="text-xs font-black">94%</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeatmap;
