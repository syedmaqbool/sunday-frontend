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
      boost_packages: {
        Row: {
          active: boolean
          created_at: string
          description: string
          duration_days: number
          id: string
          name: string
          placement: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          duration_days: number
          id?: string
          name: string
          placement: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          name?: string
          placement?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          label: string
          sort_order?: number
          value: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          label?: string
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_notes: string
          buyer_id: string
          created_at: string
          evidence_urls: string[]
          id: string
          listing_id: string
          order_id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          return_carrier: string | null
          return_proof_urls: string[]
          return_tracking: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string
          buyer_id: string
          created_at?: string
          evidence_urls?: string[]
          id?: string
          listing_id: string
          order_id: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          return_carrier?: string | null
          return_proof_urls?: string[]
          return_tracking?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string
          buyer_id?: string
          created_at?: string
          evidence_urls?: string[]
          id?: string
          listing_id?: string
          order_id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          return_carrier?: string | null
          return_proof_urls?: string[]
          return_tracking?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          offer_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          offer_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          offer_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order_amount: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          enabled: boolean
          id: string
          key: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          name: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      flag_keywords: {
        Row: {
          action: string
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          keyword: string
          reason: string
          updated_at: string
        }
        Insert: {
          action?: string
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          keyword: string
          reason?: string
          updated_at?: string
        }
        Update: {
          action?: string
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          keyword?: string
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_categories: {
        Row: {
          active: boolean
          blurb: string
          created_at: string
          icon: string
          id: string
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          blurb?: string
          created_at?: string
          icon?: string
          id?: string
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          blurb?: string
          created_at?: string
          icon?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      help_faqs: {
        Row: {
          answer: string
          category_key: string
          created_at: string
          id: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category_key: string
          created_at?: string
          id?: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category_key?: string
          created_at?: string
          id?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      help_tutorials: {
        Row: {
          created_at: string
          cta_label: string
          cta_to: string
          icon: string
          id: string
          published: boolean
          sort_order: number
          steps: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string
          cta_to?: string
          icon?: string
          id?: string
          published?: boolean
          sort_order?: number
          steps?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string
          cta_to?: string
          icon?: string
          id?: string
          published?: boolean
          sort_order?: number
          steps?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing_boosts: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          listing_id: string
          package_id: string | null
          payment_status: string
          placement: string
          price_paid: number
          seller_id: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          listing_id: string
          package_id?: string | null
          payment_status?: string
          placement: string
          price_paid?: number
          seller_id: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          listing_id?: string
          package_id?: string | null
          payment_status?: string
          placement?: string
          price_paid?: number
          seller_id?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing_feedback: {
        Row: {
          admin_id: string
          created_at: string
          feedback: string
          id: string
          listing_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          feedback: string
          id?: string
          listing_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          feedback?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_feedback_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          admin_feedback: string | null
          brand: string
          category: string
          condition: string
          created_at: string
          description: string
          id: string
          images: string[]
          price: number
          reserved_for: string | null
          reserved_offer_id: string | null
          reserved_until: string | null
          seller_id: string
          size: string
          status: string
          title: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          admin_feedback?: string | null
          brand?: string
          category: string
          condition: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          price: number
          reserved_for?: string | null
          reserved_offer_id?: string | null
          reserved_until?: string | null
          seller_id: string
          size: string
          status?: string
          title: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          admin_feedback?: string | null
          brand?: string
          category?: string
          condition?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          price?: number
          reserved_for?: string | null
          reserved_offer_id?: string | null
          reserved_until?: string | null
          seller_id?: string
          size?: string
          status?: string
          title?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          flag_reason: string | null
          flagged: boolean
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          counter_amount: number | null
          created_at: string
          id: string
          listing_id: string
          message: string | null
          seller_id: string
          seller_message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          seller_id: string
          seller_message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          seller_id?: string
          seller_message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          discount_amount: number
          discount_code: string | null
          id: string
          item_status: Json
          items: Json
          shipping_address: string | null
          shipping_city: string | null
          shipping_first_name: string | null
          shipping_last_name: string | null
          shipping_phone: string | null
          shipping_postal: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
        }
        Insert: {
          buyer_id: string
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          id?: string
          item_status?: Json
          items?: Json
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_first_name?: string | null
          shipping_last_name?: string | null
          shipping_phone?: string | null
          shipping_postal?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
        }
        Update: {
          buyer_id?: string
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          id?: string
          item_status?: Json
          items?: Json
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_first_name?: string | null
          shipping_last_name?: string | null
          shipping_phone?: string | null
          shipping_postal?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_iban: string | null
          bank_name: string | null
          bank_swift: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string
          created_at?: string
          details?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          image_urls: string[]
          listing_id: string
          offer_id: string | null
          order_id: string | null
          rating: number
          reviewed_id: string
          reviewer_id: string
          role: string
          video_url: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          image_urls?: string[]
          listing_id: string
          offer_id?: string | null
          order_id?: string | null
          rating: number
          reviewed_id: string
          reviewer_id: string
          role: string
          video_url?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          image_urls?: string[]
          listing_id?: string
          offer_id?: string | null
          order_id?: string | null
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          role?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          created_at: string
          icon: string
          id: string
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          label: string
          sort_order?: number
          value: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          label?: string
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
          sender_role?: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          last_message_at: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tax_settings: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          rate: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          rate: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          brands: string[] | null
          budget_max: number | null
          budget_min: number | null
          categories: string[] | null
          created_at: string | null
          id: string
          onboarding_completed: boolean | null
          preferred_fit: string | null
          styles: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brands?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          categories?: string[] | null
          created_at?: string | null
          id?: string
          onboarding_completed?: boolean | null
          preferred_fit?: string | null
          styles?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brands?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          categories?: string[] | null
          created_at?: string | null
          id?: string
          onboarding_completed?: boolean | null
          preferred_fit?: string | null
          styles?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _audience?: string
          _body: string
          _link: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      expire_listing_reservation: {
        Args: { _force?: boolean; _listing_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_listings_sold: {
        Args: { _listing_ids: string[] }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
