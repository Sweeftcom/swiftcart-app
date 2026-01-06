import { motion } from 'framer-motion';
import { MapPin, ChevronDown, Clock, Search, User, ShoppingBag, Zap } from 'lucide-react';
import { useLocationStore } from '@/stores/locationStore';
import { useCartStore } from '@/stores/cartStore';
import { Link } from 'react-router-dom';

export const Header = () => {
  const { nearestStore } = useLocationStore();
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <header className="sticky top-0 z-50 bg-card shadow-card">
      <div className="container py-3">
        {/* Top Row - Location & Profile */}
        <div className="flex items-center justify-between gap-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">Home</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                123 Brigade Road, Koramangala
              </p>
            </div>
          </motion.button>

          <div className="flex items-center gap-3">
            <Link to="/profile">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
              >
                <User className="w-5 h-5 text-foreground" />
              </motion.button>
            </Link>

            <Link to="/cart">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Delivery Time Badge */}
        {nearestStore && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Delivery in {nearestStore.estimatedDeliveryMinutes} mins
              </span>
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <Link to="/search">
          <motion.div
            whileTap={{ scale: 0.99 }}
            className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted cursor-pointer"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">Search for "milk"</span>
          </motion.div>
        </Link>
      </div>
    </header>
  );
};
