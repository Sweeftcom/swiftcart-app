// Quick Commerce Data Models

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  label: 'home' | 'work' | 'other';
  customLabel?: string;
  flatNumber: string;
  building: string;
  street: string;
  landmark?: string;
  city: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface Store {
  id: string;
  name: string;
  type: 'dark_store' | 'partner_store';
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedDeliveryMinutes: number;
  isOpen: boolean;
  rating: number;
  totalOrders: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brand: string;
  images: string[];
  price: number;
  mrp: number;
  discountPercent: number;
  unit: string;
  packSize: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  isVeg: boolean;
  isAvailable: boolean;
  maxQuantity: number;
}

export interface InventorySummary {
  productId: string;
  storeId: string;
  quantity: number;
  isAvailable: boolean;
  lastUpdated: Date;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  reservationExpiry?: Date;
  isReserved: boolean;
}

export interface Cart {
  id: string;
  userId: string;
  storeId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  surgeFee: number;
  discount: number;
  total: number;
  appliedCoupon?: Coupon;
  estimatedDeliveryMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  validUntil: Date;
}

export type OrderStatus = 
  | 'placed'
  | 'confirmed'
  | 'packing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  store: Store;
  items: CartItem[];
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }[];
  deliveryAddress: Address;
  subtotal: number;
  deliveryFee: number;
  surgeFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  rider?: RiderSummary;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiderSummary {
  id: string;
  name: string;
  phone: string; // masked
  avatar?: string;
  rating: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'wallet' | 'cod';
  name: string;
  icon: string;
  details?: string;
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planName: string;
  planType: 'monthly' | 'quarterly' | 'yearly';
  benefits: string[];
  price: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  autoRenew: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'offer' | 'system';
  title: string;
  message: string;
  deepLink?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  backgroundColor: string;
  deepLink?: string;
  sortOrder: number;
  isActive: boolean;
}
