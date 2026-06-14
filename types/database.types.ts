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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          description: string | null
          display_order: number
          icon: string
          id: string
          is_optional: boolean
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          display_order: number
          icon: string
          id?: string
          is_optional?: boolean
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_optional?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      custom_species: {
        Row: {
          category_id: string | null
          common_name: string
          created_at: string
          description: string | null
          id: string
          scientific_name: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          common_name: string
          created_at?: string
          description?: string | null
          id?: string
          scientific_name?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          common_name?: string
          created_at?: string
          description?: string | null
          id?: string
          scientific_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_species_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      dex_categories: {
        Row: {
          added_at: string
          category_id: string
          dex_id: string
          id: string
        }
        Insert: {
          added_at?: string
          category_id: string
          dex_id: string
          id?: string
        }
        Update: {
          added_at?: string
          category_id?: string
          dex_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dex_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dex_categories_dex_id_fkey"
            columns: ["dex_id"]
            isOneToOne: false
            referencedRelation: "dexes"
            referencedColumns: ["id"]
          },
        ]
      }
      dexes: {
        Row: {
          bird_full_list: boolean
          created_at: string
          id: string
          name: string
          scope_england: boolean
          scope_northern_ireland: boolean
          scope_scotland: boolean
          scope_wales: boolean
          show_unspotted: boolean
          user_id: string
        }
        Insert: {
          bird_full_list?: boolean
          created_at?: string
          id?: string
          name: string
          scope_england?: boolean
          scope_northern_ireland?: boolean
          scope_scotland?: boolean
          scope_wales?: boolean
          show_unspotted?: boolean
          user_id: string
        }
        Update: {
          bird_full_list?: boolean
          created_at?: string
          id?: string
          name?: string
          scope_england?: boolean
          scope_northern_ireland?: boolean
          scope_scotland?: boolean
          scope_wales?: boolean
          show_unspotted?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
      sightings: {
        Row: {
          created_at: string
          custom_species_id: string | null
          date_spotted: string
          dex_id: string
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          notes: string | null
          photo_url: string | null
          species_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_species_id?: string | null
          date_spotted: string
          dex_id: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          photo_url?: string | null
          species_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          custom_species_id?: string | null
          date_spotted?: string
          dex_id?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          photo_url?: string | null
          species_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sightings_custom_species_id_fkey"
            columns: ["custom_species_id"]
            isOneToOne: false
            referencedRelation: "custom_species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sightings_dex_id_fkey"
            columns: ["dex_id"]
            isOneToOne: false
            referencedRelation: "dexes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sightings_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          category_id: string
          common_name: string
          created_at: string
          description: string | null
          found_in_england: boolean
          found_in_northern_ireland: boolean
          found_in_scotland: boolean
          found_in_wales: boolean
          habitat: string | null
          id: string
          rarity_tier: string
          scientific_name: string
          slug: string
          status: string
          thumbnail_url: string | null
        }
        Insert: {
          category_id: string
          common_name: string
          created_at?: string
          description?: string | null
          found_in_england?: boolean
          found_in_northern_ireland?: boolean
          found_in_scotland?: boolean
          found_in_wales?: boolean
          habitat?: string | null
          id?: string
          rarity_tier?: string
          scientific_name: string
          slug: string
          status: string
          thumbnail_url?: string | null
        }
        Update: {
          category_id?: string
          common_name?: string
          created_at?: string
          description?: string | null
          found_in_england?: boolean
          found_in_northern_ireland?: boolean
          found_in_scotland?: boolean
          found_in_wales?: boolean
          habitat?: string | null
          id?: string
          rarity_tier?: string
          scientific_name?: string
          slug?: string
          status?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "species_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
