export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: "admin" | "manager" | "cashier" | "barista";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role: "admin" | "manager" | "cashier" | "barista";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          sku: string;
          name: string;
          description: string | null;
          image_url: string | null;
          price: number;
          cost: number;
          is_available: boolean;
          is_archived: boolean;
          track_stock: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          sku: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          price: number;
          cost?: number;
          is_available?: boolean;
          is_archived?: boolean;
          track_stock?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      modifier_groups: {
        Row: {
          id: string;
          name: string;
          is_required: boolean;
          min_select: number;
          max_select: number;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          is_required?: boolean;
          min_select?: number;
          max_select?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["modifier_groups"]["Insert"]>;
      };
      modifier_options: {
        Row: {
          id: string;
          modifier_group_id: string;
          name: string;
          price_delta: number;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          modifier_group_id: string;
          name: string;
          price_delta?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["modifier_options"]["Insert"]>;
      };
      product_modifier_groups: {
        Row: {
          id: string;
          product_id: string;
          modifier_group_id: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          modifier_group_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_modifier_groups"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          receipt_number: string;
          customer_id: string | null;
          cashier_id: string;
          status: "pending" | "preparing" | "ready" | "completed" | "cancelled" | "refunded";
          payment_status: "unpaid" | "paid" | "refunded" | "failed";
          subtotal: number;
          discount_amount: number;
          vat_amount: number;
          service_charge_amount: number;
          total_amount: number;
          order_type: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          receipt_number: string;
          customer_id?: string | null;
          cashier_id: string;
          status?: "pending" | "preparing" | "ready" | "completed" | "cancelled" | "refunded";
          payment_status?: "unpaid" | "paid" | "refunded" | "failed";
          subtotal?: number;
          discount_amount?: number;
          vat_amount?: number;
          service_charge_amount?: number;
          total_amount?: number;
          order_type?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          base_price: number;
          modifier_total: number;
          unit_price: number;
          total_price: number;
          note: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          base_price: number;
          modifier_total?: number;
          unit_price: number;
          total_price: number;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      order_item_modifiers: {
        Row: {
          id: string;
          order_item_id: string;
          modifier_group_name: string;
          modifier_option_name: string;
          price_delta: number;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          modifier_group_name: string;
          modifier_option_name: string;
          price_delta?: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_item_modifiers"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          payment_method: "cash" | "promptpay_qr" | "qr_payment" | "credit_card" | "e_wallet";
          amount: number;
          received_amount: number | null;
          change_amount: number | null;
          status: "unpaid" | "paid" | "refunded" | "failed";
          transaction_ref: string | null;
          paid_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_method: "cash" | "promptpay_qr" | "qr_payment" | "credit_card" | "e_wallet";
          amount: number;
          received_amount?: number | null;
          change_amount?: number | null;
          status?: "unpaid" | "paid" | "refunded" | "failed";
          transaction_ref?: string | null;
          paid_at?: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      store_settings: {
        Row: {
          id: string;
          store_name: string;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          tax_id: string | null;
          currency: string;
          timezone: string;
          vat_enabled: boolean;
          vat_rate: number;
          service_charge_enabled: boolean;
          service_charge_rate: number;
          receipt_prefix: string;
          receipt_footer: string;
          printer_paper_size: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_name?: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          tax_id?: string | null;
          currency?: string;
          timezone?: string;
          vat_enabled?: boolean;
          vat_rate?: number;
          service_charge_enabled?: boolean;
          service_charge_rate?: number;
          receipt_prefix?: string;
          receipt_footer?: string;
          printer_paper_size?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_settings"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "barista";
      order_status: "pending" | "preparing" | "ready" | "completed" | "cancelled" | "refunded";
      payment_status: "unpaid" | "paid" | "refunded" | "failed";
      payment_method: "cash" | "promptpay_qr" | "qr_payment" | "credit_card" | "e_wallet";
    };
    CompositeTypes: Record<string, never>;
  };
};

