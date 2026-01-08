import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Plus, Minus, Zap, ShieldCheck, Truck, Package, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useLocationStore } from '@/stores/locationStore';
import { useDeliveryEta } from '@/hooks/useDeliveryEta';
import { supabase } from '@/integrations/supabase/client';
import { DbProduct } from '@/lib/supabase-types';
import { CartFloatingButton } from '@/components/cart/CartFloatingButton';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const { nearestStore } = useLocationStore();
  const eta = useDeliveryEta();

  const cartItem = items.find((item) => item.product.id === product?.id);
  const quantity = cartItem?.quantity || 0;

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (data) setProduct(data as DbProduct);
      setIsLoading(false);
    };

    if (slug) fetchProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-4xl mb-4">📦</p>
        <p className="text-foreground font-medium">Product not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          Go Back
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
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex-1" />
        </div>
      </header>

      {/* Product Images */}
      <div className="bg-muted/30 p-4">
        <div className="relative aspect-square max-w-md mx-auto">
          {discountPercent > 0 && (
            <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              {discountPercent}% OFF
            </span>
          )}
          {product.is_veg !== null && (
            <span className={`absolute top-4 right-4 z-10 w-6 h-6 rounded border-2 flex items-center justify-center bg-white ${product.is_veg ? 'border-green-600' : 'border-red-600'}`}>
              <span className={`w-3 h-3 rounded-full ${product.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
            </span>
          )}
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={product.images?.[activeImage] || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-contain rounded-2xl"
            />
          </AnimatePresence>
        </div>
        
        {/* Image Thumbnails */}
        {product.images && product.images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  activeImage === i ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="container py-4 space-y-4">
        {/* ETA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Get it in {eta.text}</p>
            <p className="text-sm text-muted-foreground">From {nearestStore?.name || 'SweeftCom Store'}</p>
          </div>
        </motion.div>

        {/* Title & Rating */}
        <div>
          {product.brand && (
            <p className="text-sm text-primary font-medium mb-1">{product.brand}</p>
          )}
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
          <p className="text-muted-foreground">{product.pack_size || product.weight || product.unit}</p>
          
          {product.rating && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="font-medium">{product.rating}</span>
              </div>
              {product.review_count && (
                <span className="text-sm text-muted-foreground">
                  ({product.review_count} reviews)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-foreground">₹{Number(product.price).toFixed(0)}</span>
          {Number(product.mrp) > Number(product.price) && (
            <>
              <span className="text-lg text-muted-foreground line-through">₹{Number(product.mrp).toFixed(0)}</span>
              <span className="text-sm font-semibold text-primary">{discountPercent}% OFF</span>
            </>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div>
            <h3 className="font-semibold text-foreground mb-2">About this item</h3>
            <p className="text-muted-foreground text-sm">{product.description}</p>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 text-center shadow-sm">
            <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Free delivery</p>
            <p className="text-xs font-medium">above ₹199</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Quality</p>
            <p className="text-xs font-medium">Guaranteed</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-sm">
            <Package className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Easy</p>
            <p className="text-xs font-medium">Returns</p>
          </div>
        </div>

        {/* Vendor Info */}
        {product.vendor_name && (
          <div className="bg-card rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-foreground mb-1">Sold by</h3>
            <p className="text-muted-foreground">{product.vendor_name}</p>
            {product.vendor_info && (
              <p className="text-sm text-muted-foreground mt-1">{product.vendor_info}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe">
        <div className="container flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Price</p>
            <p className="text-xl font-bold text-foreground">₹{Number(product.price).toFixed(0)}</p>
          </div>
          
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Cart
              </motion.button>
            ) : (
              <motion.div
                key="quantity"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex items-center gap-3 bg-primary rounded-xl overflow-hidden"
              >
                <button
                  onClick={handleDecrease}
                  className="px-4 py-3 text-primary-foreground hover:bg-primary/90"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold text-primary-foreground text-lg min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  className="px-4 py-3 text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CartFloatingButton />
    </div>
  );
};

export default ProductDetail;