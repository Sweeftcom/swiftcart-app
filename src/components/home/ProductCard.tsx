import { motion, AnimatePresence } from 'framer-motion';
import { DbProduct } from '@/lib/supabase-types';
import { Plus, Minus, Star } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: DbProduct;
  variant?: 'compact' | 'full';
}

export const ProductCard = ({ product, variant = 'compact' }: ProductCardProps) => {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const productImages = typeof product.images === 'string' 
    ? (() => { try { return JSON.parse(product.images); } catch { return []; } })()
    : product.images;

  const discountPercent = product.mrp > product.price 
    ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
    : 0;

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
    <Link to={`/product/${product.slug}`}>
      <motion.div
        whileHover={{ y: -4, shadow: '0 12px 30px -10px rgba(0,0,0,0.1)' }}
        className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/40 h-full flex flex-col transition-all group"
      >
        {/* Image Container */}
        <div className="relative p-4 bg-muted/20">
          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-tighter shadow-lg">
              {discountPercent}% OFF
            </span>
          )}
          {product.isVeg !== undefined && (
            <span className={`absolute top-3 right-3 z-10 w-5 h-5 rounded-lg border-2 flex items-center justify-center bg-white shadow-sm ${Number(product.isVeg) === 1 ? 'border-green-600' : 'border-red-600'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${Number(product.isVeg) === 1 ? 'bg-green-600' : 'border-red-600'}`} />
            </span>
          )}
          <div className="aspect-square flex items-center justify-center">
            {productImages && productImages.length > 0 ? (
              <img 
                src={productImages[0]} 
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center">
                <span className="text-4xl">🛒</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 space-y-2">
          {product.rating && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="text-[10px] font-black text-amber-600">{product.rating}</span>
              </div>
              {product.reviewCount && (
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">({product.reviewCount})</span>
              )}
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em] mt-1.5">
              {product.packSize || product.weight || product.unit}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="font-black text-lg text-foreground tracking-tighter leading-none">₹{Number(product.price).toFixed(0)}</span>
              {Number(product.mrp) > Number(product.price) && (
                <span className="text-[10px] text-muted-foreground line-through font-bold">
                  ₹{Number(product.mrp).toFixed(0)}
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
                  className="flex items-center justify-center w-10 h-10 rounded-2xl bg-secondary text-primary font-black text-sm border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.div
                  key="quantity"
                  initial={{ width: 40, opacity: 0 }}
                  animate={{ width: 90, opacity: 1 }}
                  exit={{ width: 40, opacity: 0 }}
                  className="flex items-center justify-between bg-primary rounded-2xl overflow-hidden p-0.5 shadow-lg shadow-primary/20"
                >
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleDecrease}
                    className="w-8 h-8 flex items-center justify-center text-primary-foreground hover:bg-white/10 rounded-xl"
                  >
                    <Minus className="w-4 h-4" strokeWidth={3} />
                  </motion.button>
                  <span className="font-black text-primary-foreground text-sm">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleIncrease}
                    className="w-8 h-8 flex items-center justify-center text-primary-foreground hover:bg-white/10 rounded-xl"
                  >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
