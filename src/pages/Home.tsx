import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PromoBanners } from '@/components/home/PromoBanners';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ProductSection } from '@/components/home/ProductSection';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';
import { useLocationStore } from '@/stores/locationStore';
import { blink } from '@/lib/blink';
import { DbProduct, DbCategory, DbBanner, DbStore } from '@/lib/supabase-types';
import { Zap, Shield, Truck } from 'lucide-react';
import { ProductCard } from '@/components/home/ProductCard';

const Home = () => {
  const { setNearestStore, selectedLocation } = useLocationStore();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [banners, setBanners] = useState<DbBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch products
        const productsData = await blink.db.products.list({
          where: { isAvailable: "1" },
          orderBy: { rating: 'desc' }
        });

        // Fetch categories
        const categoriesData = await blink.db.categories.list({
          where: { isActive: "1" },
          orderBy: { sortOrder: 'asc' }
        });

        // Fetch banners
        const bannersData = await blink.db.banners.list({
          where: { isActive: "1" },
          orderBy: { sortOrder: 'asc' }
        });

        // Fetch nearest store based on location
        if (selectedLocation) {
          const storesData = await blink.db.stores.list({
            where: { isOpen: "1" }
          });

          if (storesData && storesData.length > 0) {
            // Find nearest store
            let nearest = storesData[0];
            let minDistance = Infinity;
            storesData.forEach((store: any) => {
              const distance = Math.sqrt(
                Math.pow(store.lat - selectedLocation.lat, 2) +
                Math.pow(store.lng - selectedLocation.lng, 2)
              );
              if (distance < minDistance) {
                minDistance = distance;
                nearest = store;
              }
            });
            setNearestStore(nearest as any);
          }
        }

        if (productsData) setProducts(productsData as any);
        if (categoriesData) setCategories(categoriesData as any);
        if (bannersData) setBanners(bannersData as any);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedLocation, setNearestStore]);

  const bestsellerProducts = products.filter((p) => 
    p.tags && p.tags.includes('bestseller')
  ).slice(0, 10);

  const foodProducts = products.filter((p) => 
    p.isFresh === true || Number(p.isFresh) === 1
  ).slice(0, 10);

  const snackProducts = products.filter((p) => 
    p.tags && (p.tags.includes('snacks') || p.tags.includes('chips'))
  ).slice(0, 10);

  // Convert banners to the format expected by PromoBanners
  const formattedBanners = banners.map(b => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle || undefined,
    image: b.image,
    backgroundColor: b.backgroundColor || '#FFF5E6',
    deepLink: b.categoryId ? `/category/${b.categoryId}` : undefined,
  }));

  // Convert categories to the format expected by CategoryGrid
  const formattedCategories = categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon || '📦',
    image: c.image || '',
    sortOrder: c.sortOrder,
    isActive: c.isActive,
  }));

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
          <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-secondary/50 shadow-inner border border-border/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">10 min</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">delivery</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border/60" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Best</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">quality</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border/60" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Free</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">above ₹199</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Promo Banners */}
        {banners.length > 0 && <PromoBanners banners={formattedBanners} />}

        {/* Categories */}
        {categories.length > 0 && <CategoryGrid categories={formattedCategories} />}

        {/* Bestsellers */}
        {bestsellerProducts.length > 0 && (
          <ProductSection
            title="Bestsellers"
            subtitle="Most loved by our customers"
            products={bestsellerProducts}
          />
        )}

        {/* Fresh Food */}
        {foodProducts.length > 0 && (
          <ProductSection
            title="Hot Food & Fresh Meals"
            subtitle="Delivered fresh daily"
            products={foodProducts}
          />
        )}

        {/* Snacks */}
        {snackProducts.length > 0 && (
          <ProductSection
            title="Snacks & Munchies"
            subtitle="For your midnight cravings"
            products={snackProducts}
          />
        )}

        {/* All Products */}
        {products.length > 0 && (
          <div className="px-4">
            <h2 className="text-lg font-bold text-foreground mb-4">Popular Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.slice(0, 20).map((product, index) => (
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
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">No products available in your area yet</p>
            <p className="text-sm text-muted-foreground mt-1">We're expanding fast to serve you better!</p>
          </div>
        )}
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

export default Home;
