import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Plus, Minus, Zap, ShieldCheck, Truck, Package, Heart, Share2, Info } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useLocationStore } from '@/stores/locationStore';
import { useDeliveryEta } from '@/hooks/useDeliveryEta';
import { blink } from '@/lib/blink';
import { DbProduct } from '@/lib/supabase-types';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const { nearestStore } = useLocationStore();
  const eta = useDeliveryEta();

  const cartItem = items.find((item) => item.product.id === product?.id);
  const quantity = cartItem?.quantity || 0;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        const data = await blink.db.products.list({
          where: { slug }
        });
        if (data.length > 0) {
          const prod = data[0];
          // Handle images string/array from SQLite
          if (typeof prod.images === 'string') {
            try {
              prod.images = JSON.parse(prod.images);
            } catch {
              prod.images = [];
            }
          }
          setProduct(prod as any);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">Unboxing...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-secondary rounded-[2.5rem] flex items-center justify-center">
          <Package className="w-12 h-12 text-muted-foreground/40" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Product Not Found</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">The item you're looking for might be out of stock or discontinued.</p>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="w-full max-w-xs py-4 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg"
        >
          BACK TO STORE
        </button>
      </div>
    );
  }

  const discountPercent = product.mrp > product.price 
    ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
    : 0;

  const handleAdd = () => addItem(product);
  const handleIncrease = () => updateQuantity(product.id, quantity + 1);
  const handleDecrease = () => {
    if (quantity > 1) updateQuantity(product.id, quantity - 1);
    else removeItem(product.id);
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container py-4 flex items-center justify-between gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors ${isFavorite ? 'text-red-500' : 'text-foreground'}`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-b from-secondary/30 to-background">
        <div className="container py-8">
          <div className="relative aspect-square max-w-md mx-auto group">
            {discountPercent > 0 && (
              <motion.div 
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: -5 }}
                className="absolute top-4 left-4 z-10 px-4 py-1.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black shadow-xl"
              >
                {discountPercent}% OFF
              </motion.div>
            )}
            {product.is_veg !== null && (
              <span className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-xl border-2 flex items-center justify-center bg-white shadow-md ${product.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                <span className={`w-4 h-4 rounded-full ${product.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
              </span>
            )}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                src={product.images?.[activeImage] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl"
              />
            </AnimatePresence>
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="flex justify-center gap-3 mt-8">
              {product.images.map((img, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-[1.25rem] overflow-hidden border-2 transition-all ${
                    activeImage === i ? 'border-primary shadow-lg scale-110' : 'border-border/40 opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 rounded-[2rem] p-5 flex items-center gap-4 border border-primary/10"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-0.5">Flash Delivery</p>
            <p className="text-lg font-black text-foreground leading-tight">Get it in {eta.text}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Stock available at {nearestStore?.name || 'Central Hub'}</p>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="space-y-1">
            {product.brand && (
              <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">{product.brand}</p>
            )}
            <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight">{product.name}</h1>
            <p className="text-lg font-bold text-muted-foreground">{product.pack_size || product.weight || product.unit}</p>
          </div>
          
          {product.rating && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-black text-amber-600">{product.rating}</span>
              </div>
              <div className="h-4 w-px bg-border/60" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {product.review_count || 0} REVIEWS
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-4xl font-black text-foreground tracking-tighter">₹{Number(product.price).toFixed(0)}</span>
          {Number(product.mrp) > Number(product.price) && (
            <div className="flex flex-col">
              <span className="text-lg text-muted-foreground line-through font-bold leading-none">₹{Number(product.mrp).toFixed(0)}</span>
              <span className="text-xs font-black text-primary uppercase tracking-tighter">{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-[1.5rem] p-4 text-center border border-border/40 shadow-sm space-y-2">
            <Truck className="w-6 h-6 text-primary mx-auto" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">FREE DELIVERY</p>
            <p className="text-xs font-bold">ABOVE ₹199</p>
          </div>
          <div className="bg-card rounded-[1.5rem] p-4 text-center border border-border/40 shadow-sm space-y-2">
            <ShieldCheck className="w-6 h-6 text-primary mx-auto" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">QUALITY</p>
            <p className="text-xs font-bold">GUARANTEED</p>
          </div>
          <div className="bg-card rounded-[1.5rem] p-4 text-center border border-border/40 shadow-sm space-y-2">
            <Package className="w-6 h-6 text-primary mx-auto" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PACKAGING</p>
            <p className="text-xs font-bold">ECO-FRIENDLY</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            Product Details
          </h3>
          <div className="bg-card rounded-[2rem] p-6 border border-border/40 shadow-sm">
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              {product.description || "No detailed description available for this product. Our items are always fresh and hand-picked for quality."}
            </p>
          </div>
        </div>

        {product.vendor_name && (
          <div className="bg-secondary/30 rounded-[2rem] p-6 border border-border/40">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Merchant Info</h3>
            <p className="font-black text-foreground">{product.vendor_name}</p>
            {product.vendor_info && (
              <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{product.vendor_info}</p>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-border/40 p-6 pb-safe z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="container max-w-lg flex items-center gap-6">
          <div className="flex-shrink-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">TOTAL PAYABLE</p>
            <p className="text-3xl font-black text-foreground tracking-tighter leading-none">₹{Number(product.price).toFixed(0)}</p>
          </div>
          
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.button
                  key="add"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAdd}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <Plus className="w-6 h-6" />
                  <span>ADD TO CART</span>
                </motion.button>
              ) : (
                <motion.div
                  key="quantity"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex items-center justify-between bg-primary rounded-2xl overflow-hidden p-1 shadow-xl shadow-primary/20"
                >
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleDecrease}
                    className="w-12 h-12 flex items-center justify-center text-primary-foreground hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Minus className="w-6 h-6" strokeWidth={3} />
                  </motion.button>
                  <span className="font-black text-primary-foreground text-2xl px-4">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleIncrease}
                    className="w-12 h-12 flex items-center justify-center text-primary-foreground hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Plus className="w-6 h-6" strokeWidth={3} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <CartFloatingButton />
    </div>
  );
};

export default ProductDetail;
