import { useState, useEffect } from 'react';
import { blink } from '@/lib/blink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map, MapPin, Plus, Shield, Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * ZoneController (Web Admin)
 * Manage virtual fences and zone-based delivery fees.
 * Powered by Blink SDK.
 */
export const ZoneController = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<any[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneFee, setNewZoneFee] = useState('25');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await blink.db.zones.list({
        where: { isActive: "1" },
        orderBy: { createdAt: 'desc' }
      });
      setZones(data as any);
    } catch (error) {
      console.error('Error fetching zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const createZone = async () => {
    if (!newZoneName) {
      toast.error('Please enter a zone name');
      return;
    }

    setIsCreating(true);
    try {
      await blink.db.zones.create({
        name: newZoneName,
        baseDeliveryFee: parseFloat(newZoneFee),
        isActive: "1"
      });

      setNewZoneName('');
      toast.success('New delivery zone established! 📡');
      fetchZones();
    } catch (error) {
      console.error('Error creating zone:', error);
      toast.error('Failed to create zone');
    } finally {
      setIsCreating(false);
    }
  };

  const dropZone = async (id: string) => {
    try {
      await blink.db.zones.update(id, { isActive: "0" });
      toast.success('Zone perimeter dropped');
      fetchZones();
    } catch (error) {
      toast.error('Failed to drop zone');
    }
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Globe size={20} className="text-blue-500" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-foreground">Logistics Hub</h1>
            </div>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em] ml-1">Geofencing & Dynamic Pricing</p>
          </div>
        </div>
        <Button className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest py-6 px-8 rounded-2xl shadow-xl shadow-primary/20 border-0">
          Sync Satellite
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden relative border-2">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Map size={120} className="text-blue-500" fill="currentColor" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 font-black uppercase tracking-widest text-xs text-blue-500">
                 <Plus size={24} />
                 New Delivery Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Zone Identifier</label>
                <Input
                  placeholder="e.g. CIDCO Sector N-3"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="bg-muted/50 border-border/60 rounded-2xl py-7 px-6 text-lg font-bold placeholder:text-muted-foreground/40 border-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Base Fee (₹)</label>
                <Input
                  placeholder="25"
                  type="number"
                  value={newZoneFee}
                  onChange={(e) => setNewZoneFee(e.target.value)}
                  className="bg-muted/50 border-border/60 rounded-2xl py-7 px-6 text-xl font-bold placeholder:text-muted-foreground/40 border-2"
                />
              </div>
              <Button 
                onClick={createZone} 
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-8 rounded-2xl mt-4 shadow-lg shadow-blue-600/10 border-0"
              >
                {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Define Virtual Fence'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Managed Perimeters</h3>
            <div className="h-0.5 flex-1 mx-6 bg-border/40" />
            <MapPin size={16} className="text-blue-500" />
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Scanning perimeters...</p>
              </div>
            ) : zones.map((zone, index) => (
              <motion.div 
                key={zone.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-8 bg-card border border-border/60 rounded-[2rem] flex flex-col md:flex-row justify-between items-center group hover:border-blue-500/30 transition-all hover:bg-muted/5 shadow-sm border-2"
              >
                <div className="flex gap-8 items-center w-full md:w-auto">
                   <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors shadow-inner">
                      <Shield size={28} className="text-blue-500" />
                   </div>
                   <div>
                      <p className="text-2xl font-black tracking-tight text-foreground group-hover:text-blue-500 transition-colors uppercase">{zone.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Signal Strength: 100%</p>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-10 mt-6 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-border/60 pt-6 md:pt-0">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Fee Tier</p>
                      <p className="text-3xl font-black text-foreground tracking-tighter">₹{zone.baseDeliveryFee}</p>
                   </div>
                   <div className="flex gap-3">
                      <Button variant="outline" className="border-border bg-secondary hover:bg-secondary/80 text-foreground font-black text-[10px] uppercase tracking-widest px-6 py-6 rounded-xl border-2">
                        Adjust
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => dropZone(zone.id)}
                        className="font-black text-[10px] uppercase tracking-widest px-6 py-6 rounded-xl border-2 border-destructive/20"
                      >
                        Drop
                      </Button>
                   </div>
                </div>
              </motion.div>
            ))}

            {!loading && zones.length === 0 && (
              <div className="text-center py-24 bg-card rounded-[2.5rem] border border-dashed border-border/60">
                <Globe size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No active zones monitored</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
