import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, Tag, ChevronRight, ShieldCheck, Percent, Zap, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useLocationStore } from '@/stores/locationStore';
import { useDeliveryEta } from '@/hooks/useDeliveryEta';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart,
    appliedCoupon,
    getSubtotal,
    getSavings,
    getDiscount,
    getDeliveryFee,
    getTotal,
  } = useCartStore();
  const { nearestStore } = useLocationStore();
  const eta = useDeliveryEta();

  const subtotal = getSubtotal();
  const savings = getSavings();
  const discount = getDiscount();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="container py-4 flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-xl font-black text-foreground uppercase tracking-tight">YOUR CART</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-[3rem] bg-secondary flex items-center justify-center"
          >
            <ShoppingBag className="w-16 h-16 text-muted-foreground/40" />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Empty Cart</h2>
            <p className="text-muted-foreground font-medium max-w-xs mx-auto">
              Your bag is looking a bit light. Let's fill it with some goodies!
            </p>
          </div>
          <Link to="/home" className="w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              START SHOPPING
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-lg font-black text-foreground uppercase tracking-tight">CHECKOUT</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{items.length} ITEMS SELECTED</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={clearCart}
            className="text-[10px] text-destructive font-black uppercase tracking-widest bg-destructive/10 px-3 py-1.5 rounded-lg"
          >
            CLEAR ALL
          </motion.button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-5 rounded-[2rem] bg-primary/5 border border-primary/10 shadow-inner"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-black text-lg text-foreground leading-tight">
              Get it in {eta.text}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
              Delivering from {nearestStore?.name || 'Central Dark Store'}
            </p>
          </div>
        </motion.div>

        <div className="bg-card rounded-[2rem] overflow-hidden shadow-sm border border-border/40">
          <div className="p-5 border-b border-border/40 bg-muted/10">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Review Items</h3>
          </div>
          <div className="divide-y divide-border/40">
            {items.map((item, index) => {
              const productImages = typeof item.product.images === 'string' 
                ? (() => { try { return JSON.parse(item.product.images); } catch { return []; } })()
                : item.product.images;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 flex items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border/20 shadow-inner">
                    {productImages && productImages.length > 0 ? (
                      <img 
                        src={productImages[0]} 
                        alt={item.product.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-muted-foreground/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                      {item.product.pack_size || item.product.weight || item.product.unit}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-black text-foreground">
                        ₹{Number(item.product.price).toFixed(0)}
                      </span>
                      {Number(item.product.mrp) > Number(item.product.price) && (
                        <span className="text-[10px] text-muted-foreground line-through font-bold">
                          ₹{Number(item.product.mrp).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-secondary p-1 rounded-2xl">
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-xl bg-background text-primary flex items-center justify-center shadow-sm"
                    >
                      <Plus className="w-4 h-4" strokeWidth={3} />
                    </motion.button>
                    <span className="w-8 text-center font-black text-foreground text-sm">
                      {item.quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => {
                        if (item.quantity === 1) {
                          removeItem(item.product.id);
                        } else {
                          updateQuantity(item.product.id, item.quantity - 1);
                        }
                      }}
                      className="w-8 h-8 rounded-xl bg-background text-muted-foreground flex items-center justify-center shadow-sm"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      ) : (
                        <Minus className="w-4 h-4" strokeWidth={3} />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {savings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 rounded-[1.5rem] p-5 flex items-center gap-4 border border-green-500/20"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-green-600" strokeWidth={3} />
            </div>
            <div>
              <p className="font-black text-green-600 uppercase tracking-tight">
                You're saving ₹{savings.toFixed(0)}!
              </p>
              <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-widest">
                Flash discount applied successfully
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[2rem] p-6 shadow-sm border border-border/40"
        >
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Bill Breakdown</h3>
          <div className="space-y-4 font-bold text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Item Subtotal</span>
              <span className="text-foreground font-black">₹{subtotal.toFixed(0)}</span>
            </div>
            {savings > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-primary uppercase tracking-widest text-[10px]">Stock Discount</span>
                <span className="text-primary font-black">-₹{savings.toFixed(0)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-primary uppercase tracking-widest text-[10px]">Coupon Savings</span>
                <span className="text-primary font-black">-₹{discount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Convenience Fee</span>
              {deliveryFee === 0 ? (
                <span className="text-green-600 font-black tracking-widest text-[10px]">FREE</span>
              ) : (
                <span className="text-foreground font-black">₹{deliveryFee}</span>
              )}
            </div>
            <div className="h-px bg-border/40 border-dashed border-t my-2" />
            <div className="flex items-center justify-between">
              <span className="font-black text-foreground uppercase tracking-widest text-xs">Total Payable</span>
              <span className="font-black text-foreground text-2xl tracking-tighter">₹{total.toFixed(0)}</span>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <ShieldCheck className="w-5 h-5 text-muted-foreground/40" />
          <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">PCI DSS Compliant Handshake</span>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-border/40 p-6 pb-safe z-50">
        <div className="container max-w-lg flex items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">TOTAL</p>
            <p className="text-3xl font-black text-foreground tracking-tighter leading-none">₹{total.toFixed(0)}</p>
          </div>
          <Link to="/checkout" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <span>CONTINUE</span>
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
