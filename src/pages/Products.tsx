import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Zap, Star, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProductCard } from '@/components/home/ProductCard';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';
import { useDeliveryEta } from '@/hooks/useDeliveryEta';
import { useLocationStore } from '@/stores/locationStore';
import { blink } from '@/lib/blink';
import { DbProduct, DbCategory } from '@/lib/supabase-types';

type SortOption = 'popularity' | 'price_low' | 'price_high' | 'rating';
type FilterOption = 'all' | 'veg' | 'non_veg' | 'on_sale';

const Products = () => {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  const { nearestStore } = useLocationStore();
  const eta = useDeliveryEta();
  
  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await blink.db.categories.list({
          where: { isActive: "1" },
          orderBy: { sortOrder: 'asc' }
        });
        setCategories(data as any);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async (pageNum: number, reset: boolean = false) => {
    setIsLoading(true);
    try {
      const where: any = { isAvailable: "1" };
      if (selectedCategory !== 'all') {
        where.categoryId = selectedCategory;
      }

      const productsData = await blink.db.products.list({
        where,
        limit: PAGE_SIZE,
        offset: pageNum * PAGE_SIZE
      });

      // Filter locally for MVP search/filter logic if needed
      let filtered = productsData;
      if (searchQuery) {
        filtered = filtered.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      if (filter === 'veg') {
        filtered = filtered.filter((p: any) => Number(p.isVeg) === 1);
      } else if (filter === 'non_veg') {
        filtered = filtered.filter((p: any) => Number(p.isVeg) === 0);
      } else if (filter === 'on_sale') {
        filtered = filtered.filter((p: any) => Number(p.mrp) > Number(p.price));
      }

      // Sort locally for MVP
      if (sortBy === 'popularity') {
        filtered.sort((a: any, b: any) => (b.reviewCount || 0) - (a.reviewCount || 0));
      } else if (sortBy === 'price_low') {
        filtered.sort((a: any, b: any) => Number(a.price) - Number(b.price));
      } else if (sortBy === 'price_high') {
        filtered.sort((a: any, b: any) => Number(b.price) - Number(a.price));
      } else if (sortBy === 'rating') {
        filtered.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      }

      if (reset) {
        setProducts(filtered as any);
      } else {
        setProducts(prev => [...prev, ...(filtered as any)]);
      }
      setHasMore(productsData.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, filter, sortBy]);

  useEffect(() => {
    setPage(0);
    fetchProducts(0, true);
  }, [selectedCategory, searchQuery, filter, sortBy, fetchProducts]);

  useEffect(() => {
    if (page > 0) {
      fetchProducts(page, false);
    }
  }, [page, fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setPage(prev => prev + 1);
      }
    });

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading]);

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'popularity', label: 'Popular', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'price_low', label: 'Price: Low to High', icon: null },
    { value: 'price_high', label: 'Price: High to Low', icon: null },
    { value: 'rating', label: 'Rating', icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border-b border-primary/10"
      >
        <div className="container py-2.5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
            Deliver in <span className="text-primary">{eta.text}</span> from {nearestStore?.name || 'Central Hub'}
          </p>
        </div>
      </motion.div>

      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-secondary/50 text-foreground font-bold placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/20 transition-all"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3.5 rounded-2xl border-2 transition-all ${showFilters ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary border-transparent text-foreground'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                selectedCategory === 'all'
                  ? 'bg-primary border-primary text-primary-foreground shadow-md'
                  : 'bg-secondary border-transparent text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              ALL ITEMS
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                  selectedCategory === cat.id
                    ? 'bg-primary border-primary text-primary-foreground shadow-md'
                    : 'bg-secondary border-transparent text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-card border-b border-border/40 overflow-hidden"
          >
            <div className="container py-6 space-y-6">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Sort Results</p>
                <div className="flex gap-2.5 flex-wrap">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter flex items-center gap-2 border-2 transition-all ${
                        sortBy === opt.value
                          ? 'bg-primary border-primary text-primary-foreground shadow-md'
                          : 'bg-secondary border-transparent text-foreground'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Dietary Preference</p>
                <div className="flex gap-2.5 flex-wrap">
                  {[
                    { value: 'all', label: 'ANYTHING' },
                    { value: 'veg', label: '🟢 VEG ONLY' },
                    { value: 'non_veg', label: '🔴 NON-VEG' },
                    { value: 'on_sale', label: '🏷️ HOT DEALS' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(opt.value as FilterOption)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter border-2 transition-all ${
                        filter === opt.value
                          ? 'bg-primary border-primary text-primary-foreground shadow-md'
                          : 'bg-secondary border-transparent text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container py-6">
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
            {products.length} Products Found
          </p>
          <div className="h-px flex-1 mx-4 bg-border/40" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.3) }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div ref={loadingRef} className="py-16 flex flex-col items-center justify-center space-y-4">
          {isLoading && (
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
          {!isLoading && products.length === 0 && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-secondary rounded-[2rem] flex items-center justify-center mx-auto">
                <Search className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground uppercase tracking-tight">No Items Found</p>
                <p className="text-sm text-muted-foreground">Try a different search or clear your filters.</p>
              </div>
            </div>
          )}
          {!isLoading && !hasMore && products.length > 0 && (
            <div className="flex items-center gap-4 w-full">
              <div className="h-px flex-1 bg-border/40" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">End of Aisle</p>
              <div className="h-px flex-1 bg-border/40" />
            </div>
          )}
        </div>
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

export default Products;
