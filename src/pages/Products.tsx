import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronDown, Zap, Star, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProductCard } from '@/components/home/ProductCard';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';
import { useDeliveryEta } from '@/hooks/useDeliveryEta';
import { useLocationStore } from '@/stores/locationStore';
import { supabase } from '@/integrations/supabase/client';
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

  // Sanitize search query to prevent PostgREST filter injection
  const sanitizeSearchQuery = (input: string): string => {
    // Remove PostgREST special characters that could alter query logic
    return input.replace(/[,().%*]/g, ' ').trim().slice(0, 100);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setCategories(data as DbCategory[]);
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async (pageNum: number, reset: boolean = false) => {
    setIsLoading(true);
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    // Apply category filter
    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    // Apply search with sanitized input
    if (searchQuery) {
      const sanitizedQuery = sanitizeSearchQuery(searchQuery);
      if (sanitizedQuery) {
        query = query.ilike('name', `%${sanitizedQuery}%`);
      }
    }

    // Apply veg/non-veg filter
    if (filter === 'veg') {
      query = query.eq('is_veg', true);
    } else if (filter === 'non_veg') {
      query = query.eq('is_veg', false);
    } else if (filter === 'on_sale') {
      query = query.not('mrp', 'eq', 'price');
    }

    // Apply sorting
    if (sortBy === 'popularity') {
      query = query.order('review_count', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'price_low') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price_high') {
      query = query.order('price', { ascending: false });
    } else if (sortBy === 'rating') {
      query = query.order('rating', { ascending: false, nullsFirst: false });
    }

    const { data, error } = await query;

    if (!error && data) {
      if (reset) {
        setProducts(data as DbProduct[]);
      } else {
        setProducts(prev => [...prev, ...(data as DbProduct[])]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    
    setIsLoading(false);
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
      
      {/* ETA Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/10 border-b border-primary/20"
      >
        <div className="container py-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {eta.text} delivery
          </span>
          <span className="text-sm text-muted-foreground">
            from {nearestStore?.name || 'SweeftCom Store'}
          </span>
        </div>
      </motion.div>

      {/* Search Bar */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container py-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl ${showFilters ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Categories Scroll */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-card border-b border-border overflow-hidden"
          >
            <div className="container py-4 space-y-4">
              {/* Sort Options */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Sort By</p>
                <div className="flex gap-2 flex-wrap">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                        sortBy === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Options */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Filter</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'veg', label: '🟢 Veg Only' },
                    { value: 'non_veg', label: '🔴 Non-Veg' },
                    { value: 'on_sale', label: '🏷️ On Sale' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(opt.value as FilterOption)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filter === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
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

      {/* Products Grid */}
      <main className="container py-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {products.length} products found
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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

        {/* Loading / No Results */}
        <div ref={loadingRef} className="py-8 flex items-center justify-center">
          {isLoading && (
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
          {!isLoading && products.length === 0 && (
            <div className="text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-foreground font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">Try a different search or filter</p>
            </div>
          )}
          {!isLoading && !hasMore && products.length > 0 && (
            <p className="text-sm text-muted-foreground">You've seen all products!</p>
          )}
        </div>
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

export default Products;