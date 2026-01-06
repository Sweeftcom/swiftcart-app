import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PromoBanners } from '@/components/home/PromoBanners';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ProductSection } from '@/components/home/ProductSection';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';
import { mockCategories, mockProducts, mockBanners, mockStore } from '@/data/mockData';
import { useLocationStore } from '@/stores/locationStore';
import { useEffect } from 'react';
import { Zap, Clock, Truck, Shield } from 'lucide-react';

const Index = () => {
  const { setNearestStore } = useLocationStore();

  useEffect(() => {
    // Set mock store on load
    setNearestStore(mockStore);
  }, [setNearestStore]);

  const bestsellerProducts = mockProducts.filter((p) => 
    p.tags.includes('bestseller')
  );

  const freshProducts = mockProducts.filter((p) => 
    p.categoryId === 'cat-1'
  );

  const snackProducts = mockProducts.filter((p) => 
    ['cat-3', 'cat-7', 'cat-8'].includes(p.categoryId)
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      
      <main className="space-y-6 py-4">
        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4"
        >
          <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-secondary/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">10 min</p>
                <p className="text-[10px] text-muted-foreground">delivery</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Best</p>
                <p className="text-[10px] text-muted-foreground">quality</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Free</p>
                <p className="text-[10px] text-muted-foreground">above ₹199</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Promo Banners */}
        <PromoBanners banners={mockBanners} />

        {/* Categories */}
        <CategoryGrid categories={mockCategories} />

        {/* Bestsellers */}
        <ProductSection
          title="Bestsellers"
          subtitle="Most loved by our customers"
          products={bestsellerProducts}
        />

        {/* Fresh Fruits & Vegetables */}
        <ProductSection
          title="Fresh Fruits & Vegetables"
          subtitle="Delivered fresh daily"
          products={freshProducts}
        />

        {/* Snacks & Munchies */}
        <ProductSection
          title="Snacks & Munchies"
          subtitle="For your midnight cravings"
          products={snackProducts}
        />

        {/* All Products */}
        <div className="px-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Popular Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {mockProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

// Import ProductCard for the grid
import { ProductCard } from '@/components/home/ProductCard';

export default Index;
