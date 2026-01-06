import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, Coupon } from '@/types';

interface CartState {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  
  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
}

const DELIVERY_FEE = 25;
const FREE_DELIVERY_THRESHOLD = 199;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      addItem: (product: Product) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { 
                      ...item, 
                      quantity: Math.min(item.quantity + 1, product.maxQuantity),
                      isReserved: true,
                      reservationExpiry: new Date(Date.now() + 10 * 60 * 1000)
                    }
                  : item
              ),
            };
          }

          const newItem: CartItem = {
            id: `cart-${product.id}-${Date.now()}`,
            product,
            quantity: 1,
            isReserved: true,
            reservationExpiry: new Date(Date.now() + 10 * 60 * 1000),
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.product.id !== productId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.product.id === productId
                ? { 
                    ...item, 
                    quantity: Math.min(quantity, item.product.maxQuantity),
                    reservationExpiry: new Date(Date.now() + 10 * 60 * 1000)
                  }
                : item
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null });
      },

      applyCoupon: (coupon: Coupon) => {
        set({ appliedCoupon: coupon });
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getDiscount: () => {
        const coupon = get().appliedCoupon;
        const subtotal = get().getSubtotal();

        if (!coupon || subtotal < coupon.minOrderValue) return 0;

        if (coupon.discountType === 'percentage') {
          const discount = (subtotal * coupon.discountValue) / 100;
          return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
        }

        return coupon.discountValue;
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      },

      getTotal: () => {
        return get().getSubtotal() - get().getDiscount() + get().getDeliveryFee();
      },
    }),
    {
      name: 'blinkit-cart',
    }
  )
);
