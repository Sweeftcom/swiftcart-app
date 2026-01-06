import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockProducts, mockCategories } from '@/data/mockData';
import { ProductCard } from '@/components/home/ProductCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(true);

  const filteredProducts = query.length >= 2
    ? mockProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const trendingSearches = [
    'Milk', 'Bread', 'Eggs', 'Banana', 'Rice', 'Atta', 'Maggi', 'Curd'
  ];

  const recentSearches = [
    'Amul Milk', 'Lays Chips', 'Britannia Bread'
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-card">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search for products..."
                autoFocus
                className="w-full pl-12 pr-10 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {query && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4 space-y-6">
        {query.length < 2 ? (
          <>
            {/* Trending Searches */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Trending Searches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((search) => (
                  <motion.button
                    key={search}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuery(search)}
                    className="px-4 py-2 rounded-full bg-secondary text-foreground text-sm font-medium"
                  >
                    {search}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Recent Searches</h3>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search) => (
                  <motion.button
                    key={search}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setQuery(search)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{search}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Browse Categories */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Browse Categories</h3>
              <div className="grid grid-cols-2 gap-3">
                {mockCategories.slice(0, 6).map((category) => (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card"
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium text-foreground text-sm">{category.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </>
        ) : filteredProducts.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} results for "{query}"
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product, index) => (
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground text-center">
              We couldn't find any products matching "{query}"
            </p>
          </div>
        )}
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

export default SearchPage;
