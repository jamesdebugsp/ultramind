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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          calendar_event_id: string | null
          calendar_synced_at: string | null
          client_id: string | null
          client_name: string
          client_whatsapp: string | null
          confirmed_at: string | null
          created_at: string
          date: string
          duration_minutes: number | null
          id: string
          notes: string | null
          service_id: string | null
          status: string
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_event_id?: string | null
          calendar_synced_at?: string | null
          client_id?: string | null
          client_name: string
          client_whatsapp?: string | null
          confirmed_at?: string | null
          created_at?: string
          date: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          service_id?: string | null
          status?: string
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_event_id?: string | null
          calendar_synced_at?: string | null
          client_id?: string | null
          client_name?: string
          client_whatsapp?: string | null
          confirmed_at?: string | null
          created_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          service_id?: string | null
          status?: string
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_conversations: {
        Row: {
          business_user_id: string
          client_name: string | null
          conversation_data: Json | null
          created_at: string
          current_step: string
          expires_at: string | null
          id: string
          last_message_at: string | null
          phone_number: string
          selected_date: string | null
          selected_service_id: string | null
          selected_time: string | null
          updated_at: string
        }
        Insert: {
          business_user_id: string
          client_name?: string | null
          conversation_data?: Json | null
          created_at?: string
          current_step?: string
          expires_at?: string | null
          id?: string
          last_message_at?: string | null
          phone_number: string
          selected_date?: string | null
          selected_service_id?: string | null
          selected_time?: string | null
          updated_at?: string
        }
        Update: {
          business_user_id?: string
          client_name?: string | null
          conversation_data?: Json | null
          created_at?: string
          current_step?: string
          expires_at?: string | null
          id?: string
          last_message_at?: string | null
          phone_number?: string
          selected_date?: string | null
          selected_service_id?: string | null
          selected_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_conversations_selected_service_id_fkey"
            columns: ["selected_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          published_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          business_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          owner_name: string | null
          phone: string | null
          slug: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          owner_name?: string | null
          phone?: string | null
          slug?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          owner_name?: string | null
          phone?: string | null
          slug?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          message: string | null
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          message?: string | null
          reminder_type?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          message?: string | null
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          id: string
          name: string
          price: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name: string
          price?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          appointment_interval: number | null
          auto_confirm: boolean | null
          created_at: string
          id: string
          language: string | null
          reminder_hours: number | null
          send_reminders: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          working_days: Json | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          appointment_interval?: number | null
          auto_confirm?: boolean | null
          created_at?: string
          id?: string
          language?: string | null
          reminder_hours?: number | null
          send_reminders?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          working_days?: Json | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          appointment_interval?: number | null
          auto_confirm?: boolean | null
          created_at?: string
          id?: string
          language?: string | null
          reminder_hours?: number | null
          send_reminders?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          working_days?: Json | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          max_appointments: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          reminders_enabled: boolean
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          whatsapp_bot_enabled: boolean
          whatsapp_bot_override: boolean | null
          whatsapp_bot_trial_until: string | null
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_appointments?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          reminders_enabled?: boolean
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          whatsapp_bot_enabled?: boolean
          whatsapp_bot_override?: boolean | null
          whatsapp_bot_trial_until?: string | null
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_appointments?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          reminders_enabled?: boolean
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_bot_enabled?: boolean
          whatsapp_bot_override?: boolean | null
          whatsapp_bot_trial_until?: string | null
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      appointment_availability: {
        Row: {
          date: string | null
          status: string | null
          time: string | null
          user_id: string | null
        }
        Insert: {
          date?: string | null
          status?: string | null
          time?: string | null
          user_id?: string | null
        }
        Update: {
          date?: string | null
          status?: string | null
          time?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_business_info: {
        Row: {
          address: string | null
          business_name: string | null
          description: string | null
          id: string | null
          instagram: string | null
          logo_url: string | null
          slug: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          description?: string | null
          id?: string | null
          instagram?: string | null
          logo_url?: string | null
          slug?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          description?: string | null
          id?: string | null
          instagram?: string | null
          logo_url?: string | null
          slug?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      clean_expired_conversations: { Args: never; Returns: number }
      create_public_appointment: {
        Args: {
          p_client_name: string
          p_client_whatsapp: string
          p_date: string
          p_service_id: string
          p_time: string
          p_user_id: string
        }
        Returns: string
      }
      get_user_subscription: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          max_appointments: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          reminders_enabled: boolean
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          whatsapp_bot_enabled: boolean
          whatsapp_bot_override: boolean | null
          whatsapp_bot_trial_until: string | null
          whatsapp_enabled: boolean
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_owner_email: { Args: { email: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_whatsapp_bot_active: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      subscription_plan: "basic" | "pro" | "premium"
      subscription_status: "active" | "trial" | "inactive" | "cancelled"
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
      app_role: ["super_admin", "admin", "user"],
      subscription_plan: ["basic", "pro", "premium"],
      subscription_status: ["active", "trial", "inactive", "cancelled"],
    },
  },
} as const
