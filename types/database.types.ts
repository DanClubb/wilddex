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
      dex_shares: {
        Row: {
          created_at: string
          show_details: boolean
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          show_details?: boolean
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          show_details?: boolean
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          created_at: string
          first_seen_on: string
          id: string
          location_text: string | null
          notes: string | null
          species_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          first_seen_on?: string
          id?: string
          location_text?: string | null
          notes?: string | null
          species_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          first_seen_on?: string
          id?: string
          location_text?: string | null
          notes?: string | null
          species_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "my_dex"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "entries_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_photos: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          is_cover: boolean
          storage_path: string
          thumb_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          is_cover?: boolean
          storage_path: string
          thumb_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          is_cover?: boolean
          storage_path?: string
          thumb_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_photos_entry_id_user_id_fkey"
            columns: ["entry_id", "user_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      groups: {
        Row: {
          default_selected: boolean
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          default_selected?: boolean
          id?: never
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          default_selected?: boolean
          id?: never
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dex_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          dex_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          dex_name?: string | null
          id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: never
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: never
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      species: {
        Row: {
          best_time: string | null
          common_name: string
          created_at: string
          group_id: number
          habitat: string | null
          id: number
          is_active: boolean
          scientific_name: string
          slug: string
          summary: string
        }
        Insert: {
          best_time?: string | null
          common_name: string
          created_at?: string
          group_id: number
          habitat?: string | null
          id?: never
          is_active?: boolean
          scientific_name: string
          slug: string
          summary: string
        }
        Update: {
          best_time?: string | null
          common_name?: string
          created_at?: string
          group_id?: number
          habitat?: string | null
          id?: never
          is_active?: boolean
          scientific_name?: string
          slug?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      species_regions: {
        Row: {
          rarity: Database["public"]["Enums"]["rarity_tier"]
          region_id: number
          species_id: number
        }
        Insert: {
          rarity: Database["public"]["Enums"]["rarity_tier"]
          region_id: number
          species_id: number
        }
        Update: {
          rarity?: Database["public"]["Enums"]["rarity_tier"]
          region_id?: number
          species_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "species_regions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_regions_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "my_dex"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_regions_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dex_groups: {
        Row: {
          group_id: number
          user_id: string
        }
        Insert: {
          group_id: number
          user_id: string
        }
        Update: {
          group_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dex_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dex_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dex_regions: {
        Row: {
          region_id: number
          user_id: string
        }
        Insert: {
          region_id: number
          user_id: string
        }
        Update: {
          region_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dex_regions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dex_regions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_dex: {
        Row: {
          common_name: string | null
          cover_photo_id: string | null
          cover_storage_path: string | null
          cover_thumb_path: string | null
          entry_id: string | null
          first_seen_on: string | null
          group_name: string | null
          group_slug: string | null
          group_sort_order: number | null
          location_text: string | null
          rarity: Database["public"]["Enums"]["rarity_tier"] | null
          scientific_name: string | null
          slug: string | null
          species_id: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_entry_photo: {
        Args: {
          p_entry_id: string
          p_storage_path: string
          p_thumb_path: string
        }
        Returns: string
      }
      delete_entry_photo: { Args: { p_photo_id: string }; Returns: string[] }
      log_entry: {
        Args: {
          p_first_seen_on: string
          p_location_text: string
          p_notes: string
          p_species_id: number
          p_storage_path: string
          p_thumb_path: string
        }
        Returns: string
      }
      save_dex_settings: {
        Args: {
          p_dex_name: string
          p_group_ids: number[]
          p_region_ids: number[]
        }
        Returns: undefined
      }
      is_shared_photo: { Args: { p_name: string }; Returns: boolean }
      set_sharing: {
        Args: { p_enabled: boolean; p_show_details?: boolean }
        Returns: string
      }
      shared_dex: { Args: { p_token: string }; Returns: Json }
      shared_species: { Args: { p_token: string; p_slug: string }; Returns: Json }
      set_cover_photo: { Args: { p_photo_id: string }; Returns: undefined }
      species_page: { Args: { p_slug: string }; Returns: Json }
    }
    Enums: {
      rarity_tier: "common" | "uncommon" | "rare" | "legendary"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      rarity_tier: ["common", "uncommon", "rare", "legendary"],
    },
  },
} as const
