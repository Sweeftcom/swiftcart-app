import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, XCircle, ArrowLeft, Loader2, Search, CheckCircle } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { toast } from 'sonner';

interface ProductInventory {
  productId: string;
  name: string;
  quantity: number;
  isAvailable: boolean;
  lowStockThreshold: number;
}

const StoreInventory = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchStoreAndInventory = async () => {
      setLoading(true);
      try {
        // In a real app, we'd find the store managed by this vendor
        // For MVP, we'll just take the first store or search by vendor role
        const stores = await blink.db.stores.list({ limit: 1 });
        if (stores.length > 0) {
          const activeStore = stores[0];
          setStore(activeStore);
          
          const inventoryData = await blink.db.storeInventory.list({
            where: { storeId: activeStore.id }
          });

          const products = await blink.db.products.list();
          
          const formattedData = inventoryData.map((item: any) => {
            const product = products.find((p: any) => p.id === item.productId);
            return {
              productId: item.productId,
              name: product?.name || 'Unknown Product',
              quantity: item.quantity,
              isAvailable: Number(item.isAvailable) === 1,
              lowStockThreshold: item.lowStockThreshold,
            };
          });
          setInventory(formattedData);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndInventory();
  }, [user, navigate]);

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      await blink.db.storeInventory.updateMany({
        where: { storeId: store.id, productId },
        data: { isAvailable: !currentStatus ? "1" : "0" } as any
      });

      setInventory(prev => prev.map(p =>
        p.productId === productId ? { ...p, isAvailable: !currentStatus } : p
      ));
      
      toast.success(`${currentStatus ? 'Disabled' : 'Enabled'} availability`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-xl font-black text-primary-foreground uppercase tracking-tight">Vendor Hub</h1>
            <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-widest">
              {store?.name || 'Dark Store Manager'}
            </p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-20 blur transition duration-300" />
          <div className="relative bg-card rounded-2xl border border-border/50 p-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ml-2">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search products in stock..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent py-3 outline-none text-foreground font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Updating inventory...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredInventory.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-card rounded-3xl p-5 border-2 transition-all ${
                  item.isAvailable ? 'border-border/40' : 'border-destructive/20 bg-destructive/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-lg text-foreground leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-3">
                      <p className={`text-sm font-black ${item.quantity <= item.lowStockThreshold ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        STOCK: {item.quantity}
                      </p>
                      <div className="w-1.5 h-1.5 rounded-full bg-border" />
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        THR: {item.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleAvailability(item.productId, item.isAvailable)}
                    className={`relative w-14 h-8 rounded-full transition-colors focus:outline-none ${
                      item.isAvailable ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <motion.div
                      animate={{ x: item.isAvailable ? 24 : 4 }}
                      className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
                    >
                      {item.isAvailable ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </motion.div>
                  </button>
                </div>

                {!item.isAvailable ? (
                  <div className="mt-4 flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                    <XCircle className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Marked as Out of Stock</p>
                  </div>
                ) : item.quantity <= item.lowStockThreshold ? (
                  <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Low stock warning</p>
                  </div>
                ) : null}
              </motion.div>
            ))}

            {filteredInventory.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
                  <Package className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-bold">No items found matching your search</p>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default StoreInventory;
