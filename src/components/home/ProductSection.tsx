import { motion } from 'framer-motion';
import { DbProduct } from '@/lib/supabase-types';
import { ProductCard } from './ProductCard';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: DbProduct[];
  showViewAll?: boolean;
}

export const ProductSection = ({ 
  title, 
  subtitle, 
  products, 
  showViewAll = true 
}: ProductSectionProps) => {
  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {showViewAll && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm font-semibold text-primary"
          >
            See all
          </motion.button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex-shrink-0 w-36 md:w-44"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
