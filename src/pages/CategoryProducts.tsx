import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/home/ProductCard';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';
import { BottomNav } from '@/components/layout/BottomNav';
import { useDeliveryEta } from '@/hooks/useDeliveryEta';
import { useLocationStore } from '@/stores/locationStore';
import { blink } from '@/lib/blink';
import { DbProduct, DbCategory } from '@/lib/supabase-types';

const CategoryProducts = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<DbCategory | null>(null);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high'>('popular');
  
  const { nearestStore } = useLocationStore();
  const eta = useDeliveryEta();

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setIsLoading(true);
      
      try {
        const categoriesData = await blink.db.categories.list({
          where: { slug }
        });

        if (categoriesData.length > 0) {
          const cat = categoriesData[0];
          setCategory(cat as any);

          let productsData = await blink.db.products.list({
            where: { categoryId: cat.id, isAvailable: "1" }
          });

          // Sorting logic for MVP
          if (sortBy === 'popular') {
            productsData.sort((a: any, b: any) => (b.reviewCount || 0) - (a.reviewCount || 0));
          } else if (sortBy === 'price_low') {
            productsData.sort((a: any, b: any) => Number(a.price) - Number(b.price));
          } else {
            productsData.sort((a: any, b: any) => Number(b.price) - Number(a.price));
          }

          setProducts(productsData as any);
        }
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, sortBy]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight uppercase">
              {category?.icon} {category?.name || 'Category'}
            </h1>
            <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">
              {products.length} Items Available
            </p>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border-b border-primary/10"
      >
        <div className="container py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-bold text-foreground uppercase tracking-tight">
            Deliver in <span className="text-primary">{eta.text}</span> from {nearestStore?.name || 'Local Store'}
          </p>
        </div>
      </motion.div>

      {category?.banner_image && (
        <div className="relative h-48 bg-gradient-to-br from-primary to-primary/80 overflow-hidden shadow-inner">
          <img 
            src={category.banner_image} 
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <motion.h2 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-black text-white drop-shadow-lg uppercase tracking-tight"
            >
              {category.name}
            </motion.h2>
            {category.banner_text && (
              <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/90 text-sm font-black mt-2 uppercase tracking-widest bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm"
              >
                {category.banner_text}
              </motion.p>
            )}
          </div>
        </div>
      )}

      <div className="sticky top-[72px] z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container py-4 flex items-center gap-3 overflow-x-auto hide-scrollbar">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
          </div>
          {[
            { value: 'popular', label: 'Most Popular' },
            { value: 'price_low', label: 'Lowest Price' },
            { value: 'price_high', label: 'Highest Price' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as typeof sortBy)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter whitespace-nowrap border-2 transition-all ${
                sortBy === opt.value
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary border-transparent text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">Loading Aisle...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Out of Stock</h3>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                Check back soon! We're restocking this category right now.
              </p>
            </div>
            <button
              onClick={() => navigate('/categories')}
              className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              Other Categories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

export default CategoryProducts;
