export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          area: string
          building: string
          city: string
          created_at: string
          custom_label: string | null
          delivery_instructions: string | null
          flat_number: string
          id: string
          is_default: boolean
          label: string
          landmark: string | null
          lat: number | null
          lng: number | null
          pincode: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          building: string
          city?: string
          created_at?: string
          custom_label?: string | null
          delivery_instructions?: string | null
          flat_number: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          lat?: number | null
          lng?: number | null
          pincode: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          building?: string
          city?: string
          created_at?: string
          custom_label?: string | null
          delivery_instructions?: string | null
          flat_number?: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          lat?: number | null
          lng?: number | null
          pincode?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aurangabad_locations: {
        Row: {
          created_at: string
          id: string
          is_serviceable: boolean
          lat: number
          lng: number
          name: string
          pincode: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_serviceable?: boolean
          lat: number
          lng: number
          name: string
          pincode?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_serviceable?: boolean
          lat?: number
          lng?: number
          name?: string
          pincode?: string | null
          type?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          background_color: string | null
          category_id: string | null
          created_at: string
          deep_link: string | null
          id: string
          image: string
          is_active: boolean
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          background_color?: string | null
          category_id?: string | null
          created_at?: string
          deep_link?: string | null
          id?: string
          image: string
          is_active?: boolean
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          background_color?: string | null
          category_id?: string | null
          created_at?: string
          deep_link?: string | null
          id?: string
          image?: string
          is_active?: boolean
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          banner_image: string | null
          banner_text: string | null
          created_at: string
          icon: string | null
          id: string
          image: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          banner_image?: string | null
          banner_text?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          banner_image?: string | null
          banner_text?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_value: number
          usage_count: number | null
          usage_limit: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          name: string
          phone: string
          rating: number | null
          total_deliveries: number | null
          updated_at: string
          user_id: string | null
          vehicle_number: string | null
          vehicle_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          name: string
          phone: string
          rating?: number | null
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          name?: string
          phone?: string
          rating?: number | null
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          deep_link: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deep_link?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          deep_link?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          mrp: number
          order_id: string
          price: number
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          mrp: number
          order_id: string
          price: number
          product_id: string
          product_image?: string | null
          product_name: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          mrp?: number
          order_id?: string
          price?: number
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_time: string | null
          address_id: string
          created_at: string
          delivery_fee: number
          discount: number
          driver_id: string | null
          driver_lat: number | null
          driver_lng: number | null
          estimated_delivery_minutes: number
          estimated_delivery_time: string
          feedback: string | null
          id: string
          order_number: string
          payment_id: string | null
          payment_method: string
          payment_status: string
          rating: number | null
          status: string
          store_id: string
          subtotal: number
          surge_fee: number
          tax: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_delivery_time?: string | null
          address_id: string
          created_at?: string
          delivery_fee?: number
          discount?: number
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_delivery_minutes: number
          estimated_delivery_time: string
          feedback?: string | null
          id?: string
          order_number: string
          payment_id?: string | null
          payment_method: string
          payment_status?: string
          rating?: number | null
          status?: string
          store_id: string
          subtotal: number
          surge_fee?: number
          tax?: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_delivery_time?: string | null
          address_id?: string
          created_at?: string
          delivery_fee?: number
          discount?: number
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_delivery_minutes?: number
          estimated_delivery_time?: string
          feedback?: string | null
          id?: string
          order_number?: string
          payment_id?: string | null
          payment_method?: string
          payment_status?: string
          rating?: number | null
          status?: string
          store_id?: string
          subtotal?: number
          surge_fee?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          best_before_days: number | null
          brand: string | null
          category_id: string
          created_at: string
          description: string | null
          expiry_date: string | null
          id: string
          images: string[]
          is_available: boolean
          is_fresh: boolean | null
          is_veg: boolean | null
          max_quantity_per_order: number
          mrp: number
          name: string
          pack_size: string | null
          price: number
          rating: number | null
          review_count: number | null
          slug: string
          stock_quantity: number
          store_id: string | null
          tags: string[] | null
          unit: string
          updated_at: string
          vendor_info: string | null
          vendor_name: string | null
          weight: string | null
        }
        Insert: {
          best_before_days?: number | null
          brand?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          images?: string[]
          is_available?: boolean
          is_fresh?: boolean | null
          is_veg?: boolean | null
          max_quantity_per_order?: number
          mrp: number
          name: string
          pack_size?: string | null
          price: number
          rating?: number | null
          review_count?: number | null
          slug: string
          stock_quantity?: number
          store_id?: string | null
          tags?: string[] | null
          unit?: string
          updated_at?: string
          vendor_info?: string | null
          vendor_name?: string | null
          weight?: string | null
        }
        Update: {
          best_before_days?: number | null
          brand?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          images?: string[]
          is_available?: boolean
          is_fresh?: boolean | null
          is_veg?: boolean | null
          max_quantity_per_order?: number
          mrp?: number
          name?: string
          pack_size?: string | null
          price?: number
          rating?: number | null
          review_count?: number | null
          slug?: string
          stock_quantity?: number
          store_id?: string | null
          tags?: string[] | null
          unit?: string
          updated_at?: string
          vendor_info?: string | null
          vendor_name?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          base_handling_minutes: number
          city: string
          closes_at: string
          created_at: string
          id: string
          is_open: boolean
          lat: number
          lng: number
          name: string
          opens_at: string
          rating: number | null
          total_orders: number | null
          type: string
          updated_at: string
        }
        Insert: {
          address: string
          base_handling_minutes?: number
          city?: string
          closes_at?: string
          created_at?: string
          id?: string
          is_open?: boolean
          lat: number
          lng: number
          name: string
          opens_at?: string
          rating?: number | null
          total_orders?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string
          base_handling_minutes?: number
          city?: string
          closes_at?: string
          created_at?: string
          id?: string
          is_open?: boolean
          lat?: number
          lng?: number
          name?: string
          opens_at?: string
          rating?: number | null
          total_orders?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
