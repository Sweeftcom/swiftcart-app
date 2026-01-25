import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { blink } from '@/lib/blink';
import { DbCategory } from '@/lib/supabase-types';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-xl font-black text-foreground tracking-tight uppercase">SHOP BY CATEGORY</h1>
        </div>
      </header>

      <main className="container py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Loading Aisle...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link key={category.id} to={`/category/${category.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ y: -4, shadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-card rounded-[2.5rem] p-6 aspect-square flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all border border-border/40 shadow-sm group"
                >
                  <motion.div 
                    className="text-5xl transition-transform group-hover:scale-110"
                    initial={{ rotate: -10 }}
                    whileHover={{ rotate: 0 }}
                  >
                    {category.icon || '📦'}
                  </motion.div>
                  <span className="font-black text-foreground text-center text-[10px] uppercase tracking-[0.15em] leading-tight">
                    {category.name}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <CartFloatingButton />
      <BottomNav />
    </div>
  );
};

export default Categories;
