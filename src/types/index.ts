// Enhanced Quick Commerce Data Models

export type UserRole = 'customer' | 'vendor' | 'driver' | 'admin';

export interface Profile {
  id: string;
  userId: string;
  phone: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: 'home' | 'work' | 'other';
  customLabel?: string;
  flatNumber: string;
  building: string;
  street: string;
  area: string;
  landmark?: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
  deliveryInstructions?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  type: 'dark_store' | 'partner_store';
  address: string;
  city: string;
  lat: number;
  lng: number;
  baseHandlingMinutes: number;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  rating: number;
  totalOrders: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  brand?: string;
  images: string[];
  price: number;
  mrp: number;
  unit: string;
  packSize?: string;
  weight?: string;
  rating: number;
  reviewCount: number;
  isVeg: boolean;
  isAvailable: boolean;
  stockQuantity: number;
  maxQuantityPerOrder: number;
  createdAt: string;
}

export interface StoreInventory {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  updatedAt: string;
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
  driverId?: string;
  addressId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  surgeFee: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  estimatedDeliveryMinutes: number;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderAssignment {
  id: string;
  orderId: string;
  driverId: string;
  status: 'offered' | 'accepted' | 'rejected' | 'timed_out';
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  vehicleType: string;
  vehicleNumber?: string;
  isAvailable: boolean;
  isVerified: boolean;
  status: 'offline' | 'online' | 'busy';
  currentOrderId?: string;
  currentLat?: number;
  currentLng?: number;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'vendor_payout' | 'driver_earnings';
  referenceId?: string;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ProductReview extends Review {
  productId: string;
  images: string[];
}

export interface StoreReview extends Review {
  storeId: string;
}

export interface DriverReview extends Review {
  driverId: string;
  orderId: string;
}
