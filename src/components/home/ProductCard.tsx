import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types';
import { Plus, Minus, Star } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

interface ProductCardProps {
  product: Product;
  variant?: 'compact' | 'full';
}

export const ProductCard = ({ product, variant = 'compact' }: ProductCardProps) => {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      removeItem(product.id);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/50 h-full flex flex-col"
    >
      {/* Image Container */}
      <div className="relative p-3 bg-muted/30">
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-bold">
            {product.discountPercent}% OFF
          </span>
        )}
        <div className="aspect-square flex items-center justify-center">
          <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-1">
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="text-xs font-medium text-foreground">{product.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        <h3 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
          {product.name}
        </h3>

        <p className="text-xs text-muted-foreground mt-1">{product.unit}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col">
            <span className="font-bold text-foreground">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-primary font-semibold text-sm border-2 border-primary"
              >
                <Plus className="w-4 h-4" />
                <span>ADD</span>
              </motion.button>
            ) : (
              <motion.div
                key="quantity"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 bg-primary rounded-lg overflow-hidden"
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDecrease}
                  className="p-2 text-primary-foreground hover:bg-primary/90"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <motion.span
                  key={quantity}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-primary-foreground min-w-[1.5rem] text-center"
                >
                  {quantity}
                </motion.span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleIncrease}
                  className="p-2 text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
