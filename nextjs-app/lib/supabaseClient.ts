import { createClient } from '@supabase/supabase-js';

// Define types for our Supabase tables
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          sku: string;
          upc?: string;
          price: number;
          cost_price: number;
          stock_quantity: number;
          min_stock_level: number;
          location_id?: string;
          category?: string;
          description?: string;
          image_url?: string;
          is_active: boolean;
          last_ordered_at?: string;
          supplier_id?: string;
          attributes?: Json;
          critical_status: 'Critical' | 'Warning' | 'Normal';
        }
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          sku: string;
          upc?: string;
          price: number;
          cost_price: number;
          stock_quantity: number;
          min_stock_level: number;
          location_id?: string;
          category?: string;
          description?: string;
          image_url?: string;
          is_active?: boolean;
          last_ordered_at?: string;
          supplier_id?: string;
          attributes?: Json;
          critical_status?: 'Critical' | 'Warning' | 'Normal';
        }
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          sku?: string;
          upc?: string;
          price?: number;
          cost_price?: number;
          stock_quantity?: number;
          min_stock_level?: number;
          location_id?: string;
          category?: string;
          description?: string;
          image_url?: string;
          is_active?: boolean;
          last_ordered_at?: string;
          supplier_id?: string;
          attributes?: Json;
          critical_status?: 'Critical' | 'Warning' | 'Normal';
        }
      },
      locations: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          zone: string;
          aisle: string;
          bin: string;
          shelf: string;
          is_active: boolean;
          product_count: number;
          attributes?: Json;
        }
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          zone: string;
          aisle: string;
          bin: string;
          shelf: string;
          is_active?: boolean;
          product_count?: number;
          attributes?: Json;
        }
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          zone?: string;
          aisle?: string;
          bin?: string;
          shelf?: string;
          is_active?: boolean;
          product_count?: number;
          attributes?: Json;
        }
      },
      orders: {
        Row: {
          id: string;
          created_at: string;
          client_id: string;
          order_number: string;
          status: 'Sent Shipping Details' | 'Awaiting Confirmation' | 'Processing' | 'Picking' | 'Packing' | 'Ready to Ship' | 'Order Shipped';
          total_amount: number;
          items: Json;
          shipping_details: Json;
          tracking_number?: string;
          notes?: string;
          assigned_to?: string;
          completed_at?: string;
          attributes?: Json;
        }
        Insert: {
          id?: string;
          created_at?: string;
          client_id: string;
          order_number: string;
          status?: 'Sent Shipping Details' | 'Awaiting Confirmation' | 'Processing' | 'Picking' | 'Packing' | 'Ready to Ship' | 'Order Shipped';
          total_amount: number;
          items: Json;
          shipping_details: Json;
          tracking_number?: string;
          notes?: string;
          assigned_to?: string;
          completed_at?: string;
          attributes?: Json;
        }
        Update: {
          id?: string;
          created_at?: string;
          client_id?: string;
          order_number?: string;
          status?: 'Sent Shipping Details' | 'Awaiting Confirmation' | 'Processing' | 'Picking' | 'Packing' | 'Ready to Ship' | 'Order Shipped';
          total_amount?: number;
          items?: Json;
          shipping_details?: Json;
          tracking_number?: string;
          notes?: string;
          assigned_to?: string;
          completed_at?: string;
          attributes?: Json;
        }
      },
      clients: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          phone?: string;
          company?: string;
          address: Json;
          status: 'Active' | 'Delinquent' | 'Flagged';
          segment?: 'VIP' | 'Standard' | 'Inactive';
          notes?: string;
          attributes?: Json;
        }
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          phone?: string;
          company?: string;
          address: Json;
          status?: 'Active' | 'Delinquent' | 'Flagged';
          segment?: 'VIP' | 'Standard' | 'Inactive';
          notes?: string;
          attributes?: Json;
        }
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          phone?: string;
          company?: string;
          address?: Json;
          status?: 'Active' | 'Delinquent' | 'Flagged';
          segment?: 'VIP' | 'Standard' | 'Inactive';
          notes?: string;
          attributes?: Json;
        }
      },
      tasks: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description?: string;
          assigned_to: string;
          due_date?: string;
          priority: 'Low' | 'Medium' | 'High' | 'Urgent';
          status: 'To Do' | 'In Progress' | 'Completed';
          related_to?: string;
          related_type?: 'Order' | 'Product' | 'Client' | 'Other';
          attributes?: Json;
        }
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description?: string;
          assigned_to: string;
          due_date?: string;
          priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
          status?: 'To Do' | 'In Progress' | 'Completed';
          related_to?: string;
          related_type?: 'Order' | 'Product' | 'Client' | 'Other';
          attributes?: Json;
        }
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string;
          assigned_to?: string;
          due_date?: string;
          priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
          status?: 'To Do' | 'In Progress' | 'Completed';
          related_to?: string;
          related_type?: 'Order' | 'Product' | 'Client' | 'Other';
          attributes?: Json;
        }
      },
      warehouse_metrics: {
        Row: {
          id: string;
          created_at: string;
          date: string;
          order_fulfillment_rate: number;
          inventory_accuracy: number;
          space_utilization: number;
          staff_productivity: number;
          efficiency_score: number;
          attributes?: Json;
        }
        Insert: {
          id?: string;
          created_at?: string;
          date: string;
          order_fulfillment_rate: number;
          inventory_accuracy: number;
          space_utilization: number;
          staff_productivity: number;
          efficiency_score: number;
          attributes?: Json;
        }
        Update: {
          id?: string;
          created_at?: string;
          date?: string;
          order_fulfillment_rate?: number;
          inventory_accuracy?: number;
          space_utilization?: number;
          staff_productivity?: number;
          efficiency_score?: number;
          attributes?: Json;
        }
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
  }
}

// Check if required environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
