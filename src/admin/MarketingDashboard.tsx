import { useState, useEffect } from 'react';
import { blink } from '@/lib/blink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, Send, TrendingUp, Sparkles, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * MarketingDashboard (Web Admin)
 * Scaling tool for coupons and campaign management.
 * Powered by Blink SDK.
 */
export const MarketingDashboard = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('50');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await blink.db.coupons.list({
        orderBy: { createdAt: 'desc' }
      });
      setCoupons(data as any);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async () => {
    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setIsCreating(true);
    try {
      await blink.db.coupons.create({
        code: code.toUpperCase(),
        description: `Flat ₹${discount} off on all orders`,
        discountType: 'flat',
        discountValue: parseFloat(discount),
        usageLimit: 1000,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: "1"
      });

      setCode('');
      toast.success('Coupon created successfully! 🚀');
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error('Failed to create coupon');
    } finally {
      setIsCreating(false);
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
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles size={20} className="text-primary" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-foreground">Campaign Hub</h1>
            </div>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em] ml-1">Growth & Retention Engine</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none font-black text-xs uppercase tracking-widest py-6 px-8 rounded-2xl border-2">
            Export ROI
          </Button>
          <Button className="flex-1 md:flex-none bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest py-6 px-8 rounded-2xl shadow-xl shadow-primary/20 border-0">
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden relative border-2">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap size={120} className="text-primary" fill="currentColor" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 font-black uppercase tracking-widest text-xs text-primary">
                 <Ticket size={24} />
                 Create Offer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Promo Code</label>
                <Input
                  placeholder="e.g. AURANGABAD100"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-muted/50 border-border/60 rounded-2xl py-7 px-6 font-mono text-xl font-bold uppercase focus:border-primary/50 transition-all placeholder:text-muted-foreground/40 border-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Flat Discount (₹)</label>
                <Input
                  placeholder="Amount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="bg-muted/50 border-border/60 rounded-2xl py-7 px-6 text-xl font-bold focus:border-primary/50 transition-all placeholder:text-muted-foreground/40 border-2"
                />
              </div>
              <Button 
                onClick={createCoupon} 
                disabled={isCreating}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black text-sm uppercase tracking-widest py-8 rounded-2xl mt-4 shadow-lg shadow-primary/10 border-0"
              >
                {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Launch & Distribute'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Active Campaigns</h3>
            <div className="h-0.5 flex-1 mx-6 bg-border/40" />
            <TrendingUp size={16} className="text-primary" />
          </div>
          
          <div className="grid gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Loading coupons...</p>
              </div>
            ) : coupons.map((c, index) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-8 bg-card border border-border/60 rounded-[2rem] flex flex-col md:flex-row justify-between items-center group hover:border-primary/30 transition-all hover:bg-muted/5 shadow-sm border-2"
              >
                <div className="flex gap-8 items-center w-full md:w-auto">
                   <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                      <Send size={28} className="text-green-500" />
                   </div>
                   <div>
                      <p className="font-mono text-3xl font-black tracking-tighter uppercase text-foreground group-hover:text-primary transition-colors">{c.code}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Usage: {c.usageCount || 0} / {c.usageLimit}</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-border" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest font-bold">Active</p>
                      </div>
                   </div>
                </div>
                <div className="text-right w-full md:w-auto mt-6 md:mt-0 border-t md:border-t-0 border-border/60 pt-6 md:pt-0">
                   <p className="text-3xl font-black text-primary tracking-tight">₹{c.discountValue} OFF</p>
                   <p className="text-[10px] font-black text-destructive uppercase tracking-[0.2em] mt-1 font-bold">
                     Expires: {new Date(c.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                   </p>
                </div>
              </motion.div>
            ))}

            {!loading && coupons.length === 0 && (
              <div className="text-center py-20 bg-card rounded-[2.5rem] border border-dashed border-border/60">
                <Ticket size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No active coupons found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
