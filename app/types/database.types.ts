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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          detail: string
          district: string
          id: number
          is_default: boolean
          label: string
          phone: string
          province: string
          receiver: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          detail: string
          district: string
          id?: never
          is_default?: boolean
          label?: string
          phone: string
          province: string
          receiver: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          detail?: string
          district?: string
          id?: never
          is_default?: boolean
          label?: string
          phone?: string
          province?: string
          receiver?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: number
          product_id: number
          quantity: number
          updated_at: string
          user_id: string
          variant_id: number | null
        }
        Insert: {
          created_at?: string
          id?: never
          product_id: number
          quantity?: number
          updated_at?: string
          user_id: string
          variant_id?: number | null
        }
        Update: {
          created_at?: string
          id?: never
          product_id?: number
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: number
          image_url: string | null
          name: string
          parent_id: number | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: never
          image_url?: string | null
          name: string
          parent_id?: number | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: never
          image_url?: string | null
          name?: string
          parent_id?: number | null
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
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number | null
          product_snapshot: Json
          quantity: number
          unit_price: number
          variant_id: number | null
        }
        Insert: {
          id?: never
          order_id: number
          product_id?: number | null
          product_snapshot: Json
          quantity: number
          unit_price: number
          variant_id?: number | null
        }
        Update: {
          id?: never
          order_id?: number
          product_id?: number | null
          product_snapshot?: Json
          quantity?: number
          unit_price?: number
          variant_id?: number | null
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_snapshot: Json
          cancelled_at: string | null
          created_at: string
          delivered_at: string | null
          id: number
          paid_at: string | null
          payment_method: string | null
          remark: string | null
          shipped_at: string | null
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_snapshot: Json
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: never
          paid_at?: string | null
          payment_method?: string | null
          remark?: string | null
          shipped_at?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_snapshot?: Json
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: never
          paid_at?: string | null
          payment_method?: string | null
          remark?: string | null
          shipped_at?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          id: number
          name: string
          price_modifier: number
          product_id: number
          stock: number
          value: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          price_modifier?: number
          product_id: number
          stock?: number
          value: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          price_modifier?: number
          product_id?: number
          stock?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: number | null
          compare_price: number | null
          created_at: string
          description: string | null
          id: number
          images: Json
          is_active: boolean
          name: string
          price: number
          slug: string
          stock: number
          updated_at: string
        }
        Insert: {
          category_id?: number | null
          compare_price?: number | null
          created_at?: string
          description?: string | null
          id?: never
          images?: Json
          is_active?: boolean
          name: string
          price: number
          slug: string
          stock?: number
          updated_at?: string
        }
        Update: {
          category_id?: number | null
          compare_price?: number | null
          created_at?: string
          description?: string | null
          id?: never
          images?: Json
          is_active?: boolean
          name?: string
          price?: number
          slug?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: number
          images: string[]
          order_id: number | null
          product_id: number
          rating: number
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: never
          images?: string[]
          order_id?: number | null
          product_id: number
          rating: number
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: never
          images?: string[]
          order_id?: number | null
          product_id?: number
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status:
        | "pending"
        | "paid"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
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
    Enums: {
      order_status: [
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
    },
  },
} as const
