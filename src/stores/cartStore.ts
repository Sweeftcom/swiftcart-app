import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DbProduct, DbCoupon } from '@/lib/supabase-types';

export interface CartItem {
  id: string;
  product: DbProduct;
  quantity: number;
  addedAt: Date;
}

interface CartState {
  items: CartItem[];
  appliedCoupon: DbCoupon | null;
  
  // Actions
  addItem: (product: DbProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: DbCoupon) => void;
  removeCoupon: () => void;
  
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotalMrp: () => number;
  getSavings: () => number;
  getDiscount: () => number;
  getDeliveryFee: () => number;
  getTax: () => number;
  getTotal: () => number;
}

const DELIVERY_FEE = 25;
const FREE_DELIVERY_THRESHOLD = 199;
const TAX_RATE = 0; // GST included in prices

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      addItem: (product: DbProduct) => {
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
                      quantity: Math.min(item.quantity + 1, product.max_quantity_per_order),
                    }
                  : item
              ),
            };
          }

          const newItem: CartItem = {
            id: `cart-${product.id}-${Date.now()}`,
            product,
            quantity: 1,
            addedAt: new Date(),
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
                    quantity: Math.min(quantity, item.product.max_quantity_per_order),
                  }
                : item
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null });
      },

      applyCoupon: (coupon: DbCoupon) => {
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
          (total, item) => total + Number(item.product.price) * item.quantity,
          0
        );
      },

      getTotalMrp: () => {
        return get().items.reduce(
          (total, item) => total + Number(item.product.mrp) * item.quantity,
          0
        );
      },

      getSavings: () => {
        const mrp = get().getTotalMrp();
        const subtotal = get().getSubtotal();
        return mrp - subtotal;
      },

      getDiscount: () => {
        const coupon = get().appliedCoupon;
        const subtotal = get().getSubtotal();

        if (!coupon || subtotal < Number(coupon.min_order_value)) return 0;

        if (coupon.discount_type === 'percentage') {
          const discount = (subtotal * Number(coupon.discount_value)) / 100;
          return coupon.max_discount ? Math.min(discount, Number(coupon.max_discount)) : discount;
        }

        return Number(coupon.discount_value);
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      },

      getTax: () => {
        const subtotal = get().getSubtotal() - get().getDiscount();
        return subtotal * TAX_RATE;
      },

      getTotal: () => {
        return get().getSubtotal() - get().getDiscount() + get().getDeliveryFee() + get().getTax();
      },
    }),
    {
      name: 'sweeftcom-cart',
    }
  )
);
