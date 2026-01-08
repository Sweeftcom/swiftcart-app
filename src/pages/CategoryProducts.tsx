import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/home/ProductCard';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';
import { BottomNav } from '@/components/layout/BottomNav';
import { useDeliveryEta } from '@/hooks/useDeliveryEta';
import { useLocationStore } from '@/stores/locationStore';
import { supabase } from '@/integrations/supabase/client';
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
      setIsLoading(true);
      
      // Fetch category by slug
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (catData) {
        setCategory(catData as DbCategory);

        // Fetch products for this category
        let query = supabase
          .from('products')
          .select('*')
          .eq('category_id', catData.id)
          .eq('is_available', true);

        if (sortBy === 'popular') {
          query = query.order('review_count', { ascending: false, nullsFirst: false });
        } else if (sortBy === 'price_low') {
          query = query.order('price', { ascending: true });
        } else {
          query = query.order('price', { ascending: false });
        }

        const { data: prodData } = await query;
        if (prodData) setProducts(prodData as DbProduct[]);
      }
      
      setIsLoading(false);
    };

    if (slug) fetchData();
  }, [slug, sortBy]);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary-foreground">
              {category?.icon} {category?.name || 'Category'}
            </h1>
            <p className="text-sm text-primary-foreground/70">
              {products.length} products
            </p>
          </div>
        </div>
      </header>

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

      {/* Category Banner */}
      {category?.banner_image && (
        <div className="relative h-40 bg-gradient-to-r from-primary to-primary/70 overflow-hidden">
          <img 
            src={category.banner_image} 
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-primary-foreground">
              <h2 className="text-2xl font-bold">{category.name}</h2>
              {category.banner_text && (
                <p className="text-sm opacity-90 mt-1">{category.banner_text}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="sticky top-[72px] z-30 bg-background border-b border-border">
        <div className="container py-3 flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {[
            { value: 'popular', label: 'Popular' },
            { value: 'price_low', label: 'Price: Low to High' },
            { value: 'price_high', label: 'Price: High to Low' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as typeof sortBy)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                sortBy === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <main className="container py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-foreground font-medium">No products in this category</p>
            <p className="text-sm text-muted-foreground">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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