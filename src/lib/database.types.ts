export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          user_type: 'cliente' | 'venditore' | 'admin';
          nome: string;
          cognome: string;
          telefono: string | null;
          ragione_sociale: string | null;
          partita_iva: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          user_type: 'cliente' | 'venditore' | 'admin';
          nome: string;
          cognome: string;
          telefono?: string | null;
          ragione_sociale?: string | null;
          partita_iva?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          user_type?: 'cliente' | 'venditore' | 'admin';
          nome?: string;
          cognome?: string;
          telefono?: string | null;
          ragione_sociale?: string | null;
          partita_iva?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          profile_id: string;
          business_name: string;
          plan_type: 'starter' | 'professional' | 'enterprise';
          plan_status: 'active' | 'suspended' | 'cancelled';
          product_limit: number;
          verified_badge: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          business_name: string;
          plan_type: 'starter' | 'professional' | 'enterprise';
          plan_status?: 'active' | 'suspended' | 'cancelled';
          product_limit: number;
          verified_badge?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          business_name?: string;
          plan_type?: 'starter' | 'professional' | 'enterprise';
          plan_status?: 'active' | 'suspended' | 'cancelled';
          product_limit?: number;
          verified_badge?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          description: string;
          price: number;
          stock: number;
          category: string;
          images: string[];
          is_sponsored: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          name: string;
          description: string;
          price: number;
          stock: number;
          category: string;
          images?: string[];
          is_sponsored?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          name?: string;
          description?: string;
          price?: number;
          stock?: number;
          category?: string;
          images?: string[];
          is_sponsored?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          order_number: string;
          total_amount: number;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          order_number: string;
          total_amount: number;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          order_number?: string;
          total_amount?: number;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          vendor_id: string;
          quantity: number;
          price: number;
          tracking_number: string | null;
          shipping_status: 'pending' | 'processing' | 'shipped' | 'delivered';
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          vendor_id: string;
          quantity: number;
          price: number;
          tracking_number?: string | null;
          shipping_status?: 'pending' | 'processing' | 'shipped' | 'delivered';
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          vendor_id?: string;
          quantity?: number;
          price?: number;
          tracking_number?: string | null;
          shipping_status?: 'pending' | 'processing' | 'shipped' | 'delivered';
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_type: 'cliente' | 'venditore' | 'admin';
      plan_type: 'starter' | 'professional' | 'enterprise';
      order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    };
  };
}
