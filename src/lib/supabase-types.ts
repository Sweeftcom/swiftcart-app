// Database types for SweeftCom

export interface DbProfile {
  id: string;
  user_id: string;
  phone: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAddress {
  id: string;
  user_id: string;
  label: 'home' | 'work' | 'other';
  custom_label: string | null;
  flat_number: string;
  building: string;
  street: string;
  area: string;
  landmark: string | null;
  city: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  delivery_instructions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbStore {
  id: string;
  name: string;
  type: 'dark_store' | 'partner_store';
  address: string;
  city: string;
  lat: number;
  lng: number;
  base_handling_minutes: number;
  is_open: boolean;
  opens_at: string;
  closes_at: string;
  rating: number | null;
  total_orders: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  banner_image: string | null;
  banner_text: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  store_id: string | null;
  brand: string | null;
  images: string[];
  price: number;
  mrp: number;
  unit: string;
  pack_size: string | null;
  weight: string | null;
  rating: number | null;
  review_count: number | null;
  tags: string[] | null;
  is_veg: boolean | null;
  is_fresh: boolean | null;
  expiry_date: string | null;
  best_before_days: number | null;
  stock_quantity: number;
  max_quantity_per_order: number;
  is_available: boolean;
  vendor_name: string | null;
  vendor_info: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string;
  store_id: string;
  driver_id: string | null;
  address_id: string;
  status: 'placed' | 'confirmed' | 'packing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_fee: number;
  surge_fee: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'upi' | 'card' | 'netbanking' | 'cod';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_id: string | null;
  estimated_delivery_minutes: number;
  estimated_delivery_time: string;
  actual_delivery_time: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  mrp: number;
  created_at: string;
}

export interface DbDriver {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  avatar_url: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  current_lat: number | null;
  current_lng: number | null;
  rating: number | null;
  total_deliveries: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: 'order' | 'offer' | 'system' | 'otp';
  title: string;
  message: string;
  deep_link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DbCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  usage_count: number | null;
  is_active: boolean;
  created_at: string;
}

export interface DbBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  background_color: string | null;
  deep_link: string | null;
  category_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbAurangabadLocation {
  id: string;
  name: string;
  type: 'colony' | 'society' | 'area' | 'landmark' | 'road';
  pincode: string | null;
  lat: number;
  lng: number;
  is_serviceable: boolean;
  created_at: string;
}
