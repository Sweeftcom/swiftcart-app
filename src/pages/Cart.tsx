import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, Clock, Zap, Tag, ChevronRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useLocationStore } from '@/stores/locationStore';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart,
    appliedCoupon,
    getSubtotal,
    getDiscount,
    getDeliveryFee,
    getTotal,
  } = useCartStore();
  const { nearestStore } = useLocationStore();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-card shadow-card">
          <div className="container py-4 flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <h1 className="text-lg font-bold text-foreground">Your Cart</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center mb-6"
          >
            <span className="text-6xl">🛒</span>
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground text-center mb-6">
            Start adding items to your cart and we'll deliver them in minutes!
          </p>
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
            >
              Start Shopping
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Your Cart</h1>
              <p className="text-xs text-muted-foreground">{items.length} items</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={clearCart}
            className="text-sm text-destructive font-medium"
          >
            Clear all
          </motion.button>
        </div>
      </header>

      <main className="container py-4 space-y-4">
        {/* Delivery Info */}
        {nearestStore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-secondary"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                Delivery in {nearestStore.estimatedDeliveryMinutes} minutes
              </p>
              <p className="text-sm text-muted-foreground">
                From {nearestStore.name}
              </p>
            </div>
          </motion.div>
        )}

        {/* Cart Items */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Review Items</h3>
          </div>
          <div className="divide-y divide-border">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🛒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground line-clamp-2">
                    {item.product.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{item.product.unit}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-foreground">₹{item.product.price}</span>
                    {item.product.mrp > item.product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{item.product.mrp}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (item.quantity === 1) {
                        removeItem(item.product.id);
                      } else {
                        updateQuantity(item.product.id, item.quantity - 1);
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="w-4 h-4 text-destructive" />
                    ) : (
                      <Minus className="w-4 h-4 text-foreground" />
                    )}
                  </motion.button>
                  <span className="w-8 text-center font-bold text-foreground">
                    {item.quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-primary-foreground" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coupon Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Apply Coupon</p>
                <p className="text-sm text-muted-foreground">
                  {appliedCoupon ? appliedCoupon.code : 'Save more on your order'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </motion.div>

        {/* Bill Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Bill Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Item Total</span>
              <span className="text-foreground">₹{subtotal.toFixed(0)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary">Coupon Discount</span>
                <span className="text-primary">-₹{discount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              {deliveryFee === 0 ? (
                <span className="text-primary">FREE</span>
              ) : (
                <span className="text-foreground">₹{deliveryFee}</span>
              )}
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">Grand Total</span>
              <span className="font-bold text-foreground text-lg">₹{total.toFixed(0)}</span>
            </div>
          </div>
        </motion.div>

        {/* Secure Payment Badge */}
        <div className="flex items-center justify-center gap-2 py-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">100% Secure Payments</span>
        </div>
      </main>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe">
        <div className="container">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">₹{total.toFixed(0)}</p>
            </div>
            <Link to="/checkout">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
