/**
 * Hand-written types mirroring `supabase/migrations/0001_init.sql`.
 * If you change the schema, either update this file to match or run
 * `supabase gen types typescript --local > types/database.ts` to regenerate
 * it automatically from the live schema (recommended once the project is
 * connected to a real Supabase instance).
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "customer" | "staff" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          parent_id: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["brands"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["brands"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          brand_id: string | null;
          category_id: string | null;
          status: "draft" | "active" | "out_of_stock" | "archived";
          base_price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          sku: string;
          stock_quantity: number;
          low_stock_threshold: number;
          is_featured: boolean;
          is_bestseller: boolean;
          supports_3d: boolean;
          supports_360: boolean;
          supports_ar: boolean;
          model_glb_url: string | null;
          model_gltf_url: string | null;
          model_usdz_url: string | null;
          fallback_image_url: string | null;
          seo_title: string | null;
          seo_description: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          name: string;
          slug: string;
          sku: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & {
          product_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
        Relationships: [];
      };
      product_360_frames: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          frame_number: number;
          image_url: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_360_frames"]["Row"]> & {
          product_id: string;
          frame_number: number;
          image_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_360_frames"]["Row"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          price: number;
          compare_at_price: number | null;
          stock_quantity: number;
          image_url: string | null;
          model_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_variants"]["Row"]> & {
          product_id: string;
          sku: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
        Relationships: [];
      };
      product_hotspots: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          title: string;
          description: string | null;
          image_url: string | null;
          position: Json;
          normal: Json | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_hotspots"]["Row"]> & {
          product_id: string;
          title: string;
          position: Json;
        };
        Update: Partial<Database["public"]["Tables"]["product_hotspots"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          email: string;
          phone: string;
          status: string;
          payment_status: string;
          shipping_status: string;
          subtotal: number;
          discount_amount: number;
          shipping_fee: number;
          tax_amount: number;
          grand_total: number;
          coupon_code: string | null;
          shipping_address: Json;
          billing_address: Json | null;
          payment_method: string;
          shipping_method: string;
          customer_note: string | null;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          order_number: string;
          email: string;
          phone: string;
          subtotal: number;
          grand_total: number;
          shipping_address: Json;
          payment_method: string;
          shipping_method: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          sku: string;
          variant_name: string | null;
          image_url: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          product_name: string;
          sku: string;
          unit_price: number;
          quantity: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          name: string | null;
          discount_type: "percentage" | "fixed" | "free_shipping";
          discount_value: number;
          minimum_order_amount: number;
          maximum_discount_amount: number | null;
          usage_limit: number | null;
          usage_limit_per_user: number | null;
          starts_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["coupons"]["Row"]> & {
          code: string;
          discount_type: "percentage" | "fixed" | "free_shipping";
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Row"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          order_item_id: string | null;
          rating: number;
          title: string | null;
          content: string;
          is_verified_purchase: boolean;
          status: "pending" | "approved" | "rejected" | "hidden";
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & {
          product_id: string;
          user_id: string;
          rating: number;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]> & {
          action: string;
          entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
        Relationships: [];
      };
      product_views: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          session_id: string | null;
          viewer_mode: "image" | "360" | "3d" | "ar";
          duration_seconds: number;
          interactions: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_views"]["Row"]> & {
          product_id: string;
          viewer_mode: "image" | "360" | "3d" | "ar";
        };
        Update: Partial<Database["public"]["Tables"]["product_views"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order_with_stock_check: {
        Args: {
          p_order_number: string;
          p_user_id: string | null;
          p_email: string;
          p_phone: string;
          p_items: { product_id: string; variant_id: string; quantity: number }[];
          p_shipping_address: Json;
          p_payment_method: string;
          p_shipping_method: string;
          p_shipping_fee: number;
          p_discount_amount: number;
          p_coupon_code: string | null;
          p_customer_note: string | null;
        };
        Returns: { order_id: string; order_number: string; grand_total: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
