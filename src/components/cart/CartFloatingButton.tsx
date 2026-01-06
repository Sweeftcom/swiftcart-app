import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, Clock, Zap } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { Link } from 'react-router-dom';

export const CartFloatingButton = () => {
  const itemCount = useCartStore((state) => state.getItemCount());
  const total = useCartStore((state) => state.getTotal());

  if (itemCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-8 md:w-96"
      >
        <Link to="/cart">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary rounded-2xl p-4 shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-6 h-6 text-primary-foreground" />
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                </div>
                <div>
                  <p className="text-primary-foreground font-bold">
                    ₹{total.toFixed(0)}
                  </p>
                  <div className="flex items-center gap-1 text-primary-foreground/80 text-xs">
                    <Zap className="w-3 h-3" />
                    <span>Free delivery above ₹199</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-primary-foreground font-semibold">
                <span>View Cart</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};
