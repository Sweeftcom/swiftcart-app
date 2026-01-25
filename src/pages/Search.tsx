import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X, TrendingUp, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { blink } from '@/lib/blink';
import { DbProduct, DbCategory } from '@/lib/supabase-types';
import { ProductCard } from '@/components/home/ProductCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await blink.db.categories.list({
          where: { isActive: "1" },
          orderBy: { sortOrder: 'asc' },
          limit: 6
        });
        setCategories(data as any);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setProducts([]);
        return;
      }

      setIsSearching(true);
      try {
        // Simple search logic using list and filtering locally for MVP
        // In a real app, I'd use a search-specific endpoint or full-text search
        const allProducts = await blink.db.products.list({
          where: { isAvailable: "1" }
        });
        
        const filtered = allProducts.filter((p: any) => 
          p.name.toLowerCase().includes(query.toLowerCase()) || 
          (p.brand && p.brand.toLowerCase().includes(query.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
        );
        
        setProducts(filtered as any);
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const trendingSearches = [
    'Milk', 'Bread', 'Eggs', 'Banana', 'Rice', 'Atta', 'Maggi', 'Curd'
  ];

  const recentSearches = [
    'Amul Milk', 'Lays Chips', 'Britannia Bread'
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for 5000+ products..."
                autoFocus
                className="w-full pl-12 pr-10 py-3.5 rounded-[1.25rem] bg-secondary/50 text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background border border-transparent focus:border-primary/20 transition-all"
              />
              {query && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {query.length < 2 ? (
          <>
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Trending Now</h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {trendingSearches.map((search) => (
                  <motion.button
                    key={search}
                    whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuery(search)}
                    className="px-5 py-2.5 rounded-2xl bg-secondary text-foreground text-sm font-bold border border-border/40 transition-all"
                  >
                    {search}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Recent Searches</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {recentSearches.map((search) => (
                  <motion.button
                    key={search}
                    whileHover={{ x: 4, backgroundColor: 'hsl(var(--secondary) / 0.8)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setQuery(search)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 text-left transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="font-bold text-foreground">{search}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4 px-1">Quick Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Link key={category.id} to={`/category/${category.slug}`}>
                    <motion.div
                      whileHover={{ y: -4, shadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-card border border-border/40 shadow-sm text-center space-y-3"
                    >
                      <span className="text-4xl">{category.icon || '📦'}</span>
                      <span className="font-bold text-foreground text-xs uppercase tracking-tighter">{category.name}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Searching Catalog...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                {products.length} Results Found
              </p>
              <div className="h-px flex-1 mx-4 bg-border/40" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product, index) => (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center rotate-12">
              <Search className="w-12 h-12 text-muted-foreground/40 -rotate-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">No matches found</h3>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                We couldn't find anything matching "{query}". Try checking the spelling or use a generic term.
              </p>
            </div>
            <button
              onClick={() => setQuery('')}
              className="px-8 py-3 rounded-2xl bg-secondary text-foreground font-black text-sm uppercase tracking-widest border border-border/60 hover:bg-secondary/80 transition-all"
            >
              Clear Search
            </button>
          </div>
        )}
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

export default SearchPage;
