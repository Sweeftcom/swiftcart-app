import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Plus, Clock, Zap, ChevronRight, 
  CreditCard, Smartphone, Banknote, Check, ShieldCheck,
  Package, Loader2
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useLocationStore } from '@/stores/locationStore';
import { useDeliveryEta } from '@/hooks/useDeliveryEta';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { OrderService } from '@/services/OrderService';
import { DbAddress } from '@/lib/supabase-types';
import { toast } from 'sonner';

type PaymentMethod = 'upi' | 'card' | 'cod';
type Step = 'review' | 'address' | 'payment' | 'success';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    items, clearCart, getSubtotal, getSavings, getDiscount, 
    getDeliveryFee, getTotal, appliedCoupon 
  } = useCartStore();
  const { nearestStore, selectedLocation } = useLocationStore();
  const eta = useDeliveryEta();
  
  const [step, setStep] = useState<Step>('review');
  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<DbAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    flat_number: '',
    building: '',
    street: '',
    area: selectedLocation?.name || '',
    pincode: '',
    landmark: '',
    label: 'home' as 'home' | 'work' | 'other',
  });

  const subtotal = getSubtotal();
  const savings = getSavings();
  const discount = getDiscount();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const data = await blink.db.addresses.list({
          where: { userId: user.id },
          orderBy: { isDefault: 'desc' }
        });

        if (data && data.length > 0) {
          setAddresses(data as any);
          const defaultAddr = data.find((a: any) => Number(a.isDefault) === 1) || data[0];
          setSelectedAddress(defaultAddr as any);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    fetchAddresses();
  }, [user, navigate]);

  const handleAddAddress = async () => {
    if (!user) return;
    
    if (!newAddress.flat_number || !newAddress.building || !newAddress.area || !newAddress.pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const data = await blink.db.addresses.create({
        userId: user.id,
        ...newAddress,
        lat: selectedLocation?.lat,
        lng: selectedLocation?.lng,
        isDefault: addresses.length === 0 ? "1" : "0",
      });

      if (data) {
        setAddresses([...addresses, data as any]);
        setSelectedAddress(data as any);
        setShowAddAddress(false);
        toast.success('Address added!');
      }
    } catch (error) {
      toast.error('Failed to add address');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddress || !nearestStore) {
      toast.error('Missing required information');
      return;
    }

    setIsLoading(true);
    try {
      const estimatedDelivery = new Date();
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + eta.minutes);

      const orderData = {
        userId: user.id,
        storeId: nearestStore.id,
        addressId: selectedAddress.id,
        subtotal: subtotal,
        discount: discount,
        deliveryFee: deliveryFee,
        total: total,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
        estimatedDeliveryMinutes: eta.minutes,
        estimatedDeliveryTime: estimatedDelivery.toISOString(),
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images?.[0] || null,
          quantity: item.quantity,
          price: Number(item.product.price),
          mrp: Number(item.product.mrp),
        }))
      };

      const order = await OrderService.placeOrder(orderData);

      setOrderId(order.id);
      clearCart();
      setStep('success');
      toast.success('Order placed successfully! 🎉');
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'upi', label: 'UPI / PhonePe / GPay', icon: Smartphone, desc: 'Pay using any UPI app' },
    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
    { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
  ];

  if (items.length === 0 && step !== 'success') {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-card shadow-card border-b">
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (step === 'review') navigate(-1);
              else if (step === 'address') setStep('review');
              else if (step === 'payment') setStep('address');
            }}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {step === 'review' && 'Order Summary'}
              {step === 'address' && 'Delivery Address'}
              {step === 'payment' && 'Payment'}
              {step === 'success' && 'Order Confirmed'}
            </h1>
            {step !== 'success' && (
              <p className="text-xs text-muted-foreground">
                Step {step === 'review' ? 1 : step === 'address' ? 2 : 3} of 3
              </p>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="container py-4 space-y-4"
          >
            <div className="bg-primary/10 rounded-2xl p-4 flex items-center gap-3 border border-primary/20">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Delivery in {eta.text}</p>
                <p className="text-sm text-muted-foreground">
                  From {nearestStore?.name || 'SweeftCom Store'}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="font-semibold text-foreground">
                  {items.length} Items
                </h3>
                <button 
                  onClick={() => navigate('/cart')}
                  className="text-primary text-sm font-bold"
                >
                  Edit Cart
                </button>
              </div>
              <div className="p-4 max-h-60 overflow-y-auto space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-foreground">₹{(Number(item.product.price) * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 shadow-sm border space-y-3">
              <h3 className="font-semibold text-foreground">Bill Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Total</span>
                  <span className="font-medium">₹{subtotal.toFixed(0)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Product Discount</span>
                    <span>-₹{savings.toFixed(0)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span>-₹{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-primary font-bold' : 'font-medium'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>To Pay</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-50">
              <button
                onClick={() => setStep('address')}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg"
              >
                Continue to Address
              </button>
            </div>
          </motion.div>
        )}

        {step === 'address' && (
          <motion.div
            key="address"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="container py-4 space-y-4"
          >
            {addresses.length > 0 && !showAddAddress && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Select Delivery Address</h3>
                {addresses.map((addr) => (
                  <motion.button
                    key={addr.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAddress(addr)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${
                      selectedAddress?.id === addr.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedAddress?.id === addr.id ? 'bg-primary' : 'bg-secondary'
                      }`}>
                        <MapPin className={`w-5 h-5 ${selectedAddress?.id === addr.id ? 'text-primary-foreground' : 'text-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground capitalize">{addr.label}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {addr.flat_number}, {addr.building}, {addr.street}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {addr.area}, {addr.city} - {addr.pincode}
                        </p>
                      </div>
                      {selectedAddress?.id === addr.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {!showAddAddress && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddAddress(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 flex items-center gap-3 transition-all hover:bg-primary/10"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-primary">Add New Address</span>
              </motion.button>
            )}

            {showAddAddress && (
              <div className="bg-card rounded-2xl p-5 shadow-lg border space-y-4">
                <h3 className="font-bold text-lg text-foreground">New Address</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Flat/House No.*"
                      value={newAddress.flat_number}
                      onChange={(e) => setNewAddress({ ...newAddress, flat_number: e.target.value })}
                      className="p-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary/30 outline-none transition-all"
                    />
                    <input
                      placeholder="Building Name*"
                      value={newAddress.building}
                      onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                      className="p-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary/30 outline-none transition-all"
                    />
                  </div>
                  <input
                    placeholder="Street/Road"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="p-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary/30 outline-none transition-all"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Area*"
                      value={newAddress.area}
                      onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                      className="p-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary/30 outline-none transition-all"
                    />
                    <input
                      placeholder="Pincode*"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="p-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary/30 outline-none transition-all"
                    />
                  </div>
                  <input
                    placeholder="Landmark (optional)"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                    className="p-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary/30 outline-none transition-all"
                  />
                  <div className="flex gap-2">
                    {(['home', 'work', 'other'] as const).map((label) => (
                      <button
                        key={label}
                        onClick={() => setNewAddress({ ...newAddress, label })}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                          newAddress.label === label
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddAddress(false)}
                    className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAddress}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Address'}
                  </button>
                </div>
              </div>
            )}

            {selectedAddress && !showAddAddress && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-50">
                <button
                  onClick={() => setStep('payment')}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg"
                >
                  Confirm Address
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="container py-4 space-y-4"
          >
            <h3 className="font-semibold text-foreground">Select Payment Method</h3>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <motion.button
                  key={method.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      paymentMethod === method.id ? 'bg-primary' : 'bg-secondary'
                    }`}>
                      <method.icon className={`w-6 h-6 ${paymentMethod === method.id ? 'text-primary-foreground' : 'text-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{method.label}</p>
                      <p className="text-sm text-muted-foreground">{method.desc}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-sm border border-primary/10 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <p className="font-bold text-foreground">Safe & Secure Payments</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your payment information is encrypted and never stored on our servers.
              </p>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-50">
              <div className="flex items-center justify-between mb-4 px-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total to Pay</p>
                  <p className="text-2xl font-black text-foreground">₹{total.toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary font-bold">SAVING ₹{savings.toFixed(0)}</p>
                </div>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:bg-primary/90 transition-all disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span>Place Order</span>
                    <ChevronRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="container py-12 flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40"
              >
                <Check className="w-12 h-12 text-primary-foreground" strokeWidth={4} />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-4 border-primary"
              />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-foreground">Order Confirmed!</h2>
              <p className="text-muted-foreground text-lg px-4">
                Yay! Your order has been placed and is being packed.
              </p>
            </div>

            <div className="w-full bg-card rounded-3xl p-6 shadow-lg border border-primary/5 space-y-4 max-w-sm">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Estimated Delivery</span>
                <span className="font-bold text-foreground text-lg">{eta.text}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Delivery Partner</span>
                <span className="font-bold text-foreground">Searching...</span>
              </div>
            </div>

            <div className="w-full space-y-4 max-w-sm pt-4">
              <button
                onClick={() => navigate(`/orders/${orderId}`)}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg"
              >
                Track Order Live
              </button>
              <button
                onClick={() => navigate('/home')}
                className="w-full py-4 rounded-2xl bg-secondary text-foreground font-bold text-lg"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
