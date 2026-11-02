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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          badge: string
          campaign_name: string
          creative_note: string
          cta: number
          fix: string
          format: string
          id: string
          landing_match: number
          landing_page: string
          offer: string
          offer_clarity: number
          persona_fit: number
          persona_target: string
          platform: string
          proof: number
          running_since: string
          sort_order: number
          verdict: string
        }
        Insert: {
          badge?: string
          campaign_name: string
          creative_note: string
          cta: number
          fix: string
          format: string
          id?: string
          landing_match: number
          landing_page: string
          offer: string
          offer_clarity: number
          persona_fit: number
          persona_target: string
          platform: string
          proof: number
          running_since: string
          sort_order?: number
          verdict: string
        }
        Update: {
          badge?: string
          campaign_name?: string
          creative_note?: string
          cta?: number
          fix?: string
          format?: string
          id?: string
          landing_match?: number
          landing_page?: string
          offer?: string
          offer_clarity?: number
          persona_fit?: number
          persona_target?: string
          platform?: string
          proof?: number
          running_since?: string
          sort_order?: number
          verdict?: string
        }
        Relationships: []
      }
      agent_assignments: {
        Row: {
          agent_key: string
          assignment_key: string
          brief: string
          company: string
          context: string
          id: string
          removed: boolean
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agent_key: string
          assignment_key: string
          brief: string
          company: string
          context?: string
          id?: string
          removed?: boolean
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agent_key?: string
          assignment_key?: string
          brief?: string
          company?: string
          context?: string
          id?: string
          removed?: boolean
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      agent_outputs: {
        Row: {
          agent_key: string
          assignment_key: string
          company: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          agent_key: string
          assignment_key: string
          company: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
        }
        Update: {
          agent_key?: string
          assignment_key?: string
          company?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      assumption_provenance: {
        Row: {
          confidence: string
          derivation: string
          key: string
          label: string
          replaces_with: string
          sort_order: number
          source: string
          value_text: string
        }
        Insert: {
          confidence: string
          derivation: string
          key: string
          label: string
          replaces_with: string
          sort_order?: number
          source: string
          value_text: string
        }
        Update: {
          confidence?: string
          derivation?: string
          key?: string
          label?: string
          replaces_with?: string
          sort_order?: number
          source?: string
          value_text?: string
        }
        Relationships: []
      }
      assumptions: {
        Row: {
          default_value: number
          key: string
          label: string
          max_value: number
          min_value: number
          note: string
          sort_order: number
          step: number
          unit: string
          value: number
        }
        Insert: {
          default_value: number
          key: string
          label: string
          max_value: number
          min_value: number
          note: string
          sort_order?: number
          step?: number
          unit: string
          value: number
        }
        Update: {
          default_value?: number
          key?: string
          label?: string
          max_value?: number
          min_value?: number
          note?: string
          sort_order?: number
          step?: number
          unit?: string
          value?: number
        }
        Relationships: []
      }
      changelog: {
        Row: {
          detail: string
          entry_date: string
          id: string
          title: string
        }
        Insert: {
          detail: string
          entry_date: string
          id?: string
          title: string
        }
        Update: {
          detail?: string
          entry_date?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          appstore_url: string | null
          build_error: string | null
          build_lock_until: string | null
          build_status: string
          build_step: string | null
          competitors_hint: string | null
          country: string
          created_at: string
          description_hint: string | null
          domain: string
          id: string
          legacy: boolean
          name: string
          play_url: string | null
          profile: Json
          requested_by: string | null
          requested_email: string | null
          section_map: Json
          sector: string | null
          slug: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          appstore_url?: string | null
          build_error?: string | null
          build_lock_until?: string | null
          build_status?: string
          build_step?: string | null
          competitors_hint?: string | null
          country?: string
          created_at?: string
          description_hint?: string | null
          domain: string
          id?: string
          legacy?: boolean
          name: string
          play_url?: string | null
          profile?: Json
          requested_by?: string | null
          requested_email?: string | null
          section_map?: Json
          sector?: string | null
          slug: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          appstore_url?: string | null
          build_error?: string | null
          build_lock_until?: string | null
          build_status?: string
          build_step?: string | null
          competitors_hint?: string | null
          country?: string
          created_at?: string
          description_hint?: string | null
          domain?: string
          id?: string
          legacy?: boolean
          name?: string
          play_url?: string | null
          profile?: Json
          requested_by?: string | null
          requested_email?: string | null
          section_map?: Json
          sector?: string | null
          slug?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sections: {
        Row: {
          company_id: string
          content: Json
          error: string | null
          generated_at: string | null
          id: string
          section_key: string
          status: string
        }
        Insert: {
          company_id: string
          content?: Json
          error?: string | null
          generated_at?: string | null
          id?: string
          section_key: string
          status?: string
        }
        Update: {
          company_id?: string
          content?: Json
          error?: string | null
          generated_at?: string | null
          id?: string
          section_key?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_monthly: {
        Row: {
          badge: string
          mau_m: number
          month: string
        }
        Insert: {
          badge?: string
          mau_m: number
          month: string
        }
        Update: {
          badge?: string
          mau_m?: number
          month?: string
        }
        Relationships: []
      }
      data_connections: {
        Row: {
          account_label: string | null
          company: string
          connected_by: string | null
          credentials: Json
          last_error: string | null
          platform: string
          status: string
          updated_at: string
        }
        Insert: {
          account_label?: string | null
          company: string
          connected_by?: string | null
          credentials?: Json
          last_error?: string | null
          platform: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_label?: string | null
          company?: string
          connected_by?: string | null
          credentials?: Json
          last_error?: string | null
          platform?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      funnel_steps: {
        Row: {
          badge: string
          key: string
          label: string
          sort_order: number
          sublabel: string | null
          tone: string
          value_m: number
        }
        Insert: {
          badge: string
          key: string
          label: string
          sort_order: number
          sublabel?: string | null
          tone?: string
          value_m: number
        }
        Update: {
          badge?: string
          key?: string
          label?: string
          sort_order?: number
          sublabel?: string | null
          tone?: string
          value_m?: number
        }
        Relationships: []
      }
      generated_campaigns: {
        Row: {
          ad_variants: Json
          audience_note: string | null
          created_at: string
          creative_brief: string | null
          daily_budget_inr: number
          descriptions: Json
          external_id: string | null
          external_status: string | null
          headlines: Json
          id: string
          image_paths: Json
          keywords: Json
          landing_url: string
          launch_log: string | null
          name: string
          objective: string
          persona_key: string | null
          platform: string
          play_key: string | null
          primary_texts: Json
          status: string
          targeting: Json
          updated_at: string
        }
        Insert: {
          ad_variants?: Json
          audience_note?: string | null
          created_at?: string
          creative_brief?: string | null
          daily_budget_inr?: number
          descriptions?: Json
          external_id?: string | null
          external_status?: string | null
          headlines?: Json
          id?: string
          image_paths?: Json
          keywords?: Json
          landing_url?: string
          launch_log?: string | null
          name: string
          objective: string
          persona_key?: string | null
          platform: string
          play_key?: string | null
          primary_texts?: Json
          status?: string
          targeting?: Json
          updated_at?: string
        }
        Update: {
          ad_variants?: Json
          audience_note?: string | null
          created_at?: string
          creative_brief?: string | null
          daily_budget_inr?: number
          descriptions?: Json
          external_id?: string | null
          external_status?: string | null
          headlines?: Json
          id?: string
          image_paths?: Json
          keywords?: Json
          landing_url?: string
          launch_log?: string | null
          name?: string
          objective?: string
          persona_key?: string | null
          platform?: string
          play_key?: string | null
          primary_texts?: Json
          status?: string
          targeting?: Json
          updated_at?: string
        }
        Relationships: []
      }
      google_connection: {
        Row: {
          access_token: string | null
          account_name: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          customer_id: string | null
          developer_token: string | null
          google_email: string | null
          key: string
          login_customer_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          customer_id?: string | null
          developer_token?: string | null
          google_email?: string | null
          key?: string
          login_customer_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          customer_id?: string | null
          developer_token?: string | null
          google_email?: string | null
          key?: string
          login_customer_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      google_oauth_state: {
        Row: {
          created_at: string
          redirect_uri: string
          state: string
        }
        Insert: {
          created_at?: string
          redirect_uri: string
          state: string
        }
        Update: {
          created_at?: string
          redirect_uri?: string
          state?: string
        }
        Relationships: []
      }
      issuer_monthly: {
        Row: {
          badge: string
          cards_m: number
          id: string
          issuer_slug: string
          month: string
          net_adds_12m_m: number | null
          spend_cr: number
          yoy_spend_pct: number | null
        }
        Insert: {
          badge?: string
          cards_m: number
          id?: string
          issuer_slug: string
          month: string
          net_adds_12m_m?: number | null
          spend_cr: number
          yoy_spend_pct?: number | null
        }
        Update: {
          badge?: string
          cards_m?: number
          id?: string
          issuer_slug?: string
          month?: string
          net_adds_12m_m?: number | null
          spend_cr?: number
          yoy_spend_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "issuer_monthly_issuer_slug_fkey"
            columns: ["issuer_slug"]
            isOneToOne: false
            referencedRelation: "issuers"
            referencedColumns: ["slug"]
          },
        ]
      }
      issuer_penetration: {
        Row: {
          active_share_pct: number
          badge: string
          confidence: string
          brand_penetration_pct: number
          issuer_slug: string
          method_note: string
          prime_share_pct: number
          survey_brand_share_pct: number
        }
        Insert: {
          active_share_pct?: number
          badge?: string
          confidence?: string
          brand_penetration_pct: number
          issuer_slug: string
          method_note?: string
          prime_share_pct: number
          survey_brand_share_pct?: number
        }
        Update: {
          active_share_pct?: number
          badge?: string
          confidence?: string
          brand_penetration_pct?: number
          issuer_slug?: string
          method_note?: string
          prime_share_pct?: number
          survey_brand_share_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "issuer_penetration_issuer_slug_fkey"
            columns: ["issuer_slug"]
            isOneToOne: true
            referencedRelation: "issuers"
            referencedColumns: ["slug"]
          },
        ]
      }
      issuers: {
        Row: {
          category: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      market_metrics: {
        Row: {
          badge: string
          key: string
          label: string
          note: string | null
          sort_order: number
          source: string
          unit: string
          value: number
        }
        Insert: {
          badge: string
          key: string
          label: string
          note?: string | null
          sort_order?: number
          source: string
          unit: string
          value: number
        }
        Update: {
          badge?: string
          key?: string
          label?: string
          note?: string | null
          sort_order?: number
          source?: string
          unit?: string
          value?: number
        }
        Relationships: []
      }
      marketing_plan_items: {
        Row: {
          action: string
          audience: string
          channel: string
          id: string
          message: string
          priority: string
          sort_order: number
          success_metric: string
        }
        Insert: {
          action: string
          audience: string
          channel: string
          id?: string
          message: string
          priority: string
          sort_order?: number
          success_metric: string
        }
        Update: {
          action?: string
          audience?: string
          channel?: string
          id?: string
          message?: string
          priority?: string
          sort_order?: number
          success_metric?: string
        }
        Relationships: []
      }
      meta_connection: {
        Row: {
          access_token: string
          account_name: string | null
          ad_account_id: string
          connected_at: string
          created_at: string
          key: string
          page_id: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          account_name?: string | null
          ad_account_id: string
          connected_at?: string
          created_at?: string
          key?: string
          page_id?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          account_name?: string | null
          ad_account_id?: string
          connected_at?: string
          created_at?: string
          key?: string
          page_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      overlap_segments: {
        Row: {
          badge: string
          description: string
          key: string
          label: string
          sort_order: number
          value_m: number
        }
        Insert: {
          badge?: string
          description: string
          key: string
          label: string
          sort_order?: number
          value_m: number
        }
        Update: {
          badge?: string
          description?: string
          key?: string
          label?: string
          sort_order?: number
          value_m?: number
        }
        Relationships: []
      }
      page_views: {
        Row: {
          company: string | null
          email: string
          id: string
          path: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          company?: string | null
          email: string
          id?: string
          path: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          company?: string | null
          email?: string
          id?: string
          path?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      persona_platforms: {
        Row: {
          audience_size_m: number | null
          id: string
          index_score: number
          persona_slug: string
          platform: string
        }
        Insert: {
          audience_size_m?: number | null
          id?: string
          index_score: number
          persona_slug: string
          platform: string
        }
        Update: {
          audience_size_m?: number | null
          id?: string
          index_score?: number
          persona_slug?: string
          platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_platforms_persona_slug_fkey"
            columns: ["persona_slug"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["slug"]
          },
        ]
      }
      personas: {
        Row: {
          cards_held: number
          channels: string
          city_tier: string
          brand_status: string
          hooks: string
          message: string
          name: string
          penetration_pct: number
          primary_issuers: string
          size_m: number
          slug: string
          sort_order: number
          typical_spend: string
          wants: string
          who: string
        }
        Insert: {
          cards_held: number
          channels: string
          city_tier: string
          brand_status: string
          hooks: string
          message: string
          name: string
          penetration_pct: number
          primary_issuers: string
          size_m: number
          slug: string
          sort_order?: number
          typical_spend: string
          wants: string
          who: string
        }
        Update: {
          cards_held?: number
          channels?: string
          city_tier?: string
          brand_status?: string
          hooks?: string
          message?: string
          name?: string
          penetration_pct?: number
          primary_issuers?: string
          size_m?: number
          slug?: string
          sort_order?: number
          typical_spend?: string
          wants?: string
          who?: string
        }
        Relationships: []
      }
      plays: {
        Row: {
          channel: string
          conversion_pct: number
          effort: number
          impact: number
          lever: string
          name: string
          owner: string
          rationale: string
          reach_m: number
          segment: string
          slug: string
          sort_order: number
        }
        Insert: {
          channel: string
          conversion_pct: number
          effort: number
          impact: number
          lever: string
          name: string
          owner: string
          rationale: string
          reach_m: number
          segment: string
          slug: string
          sort_order?: number
        }
        Update: {
          channel?: string
          conversion_pct?: number
          effort?: number
          impact?: number
          lever?: string
          name?: string
          owner?: string
          rationale?: string
          reach_m?: number
          segment?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      roadmap_status: {
        Row: {
          item_id: string
          owner: string | null
          status: string
          updated_at: string
        }
        Insert: {
          item_id: string
          owner?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          item_id?: string
          owner?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      score_bands: {
        Row: {
          badge: string
          band: string
          has_card: boolean
          key: string
          label: string
          note: string
          on_brand_m: number
          size_m: number
          sort_order: number
        }
        Insert: {
          badge?: string
          band: string
          has_card?: boolean
          key: string
          label: string
          note: string
          on_brand_m?: number
          size_m: number
          sort_order?: number
        }
        Update: {
          badge?: string
          band?: string
          has_card?: boolean
          key?: string
          label?: string
          note?: string
          on_brand_m?: number
          size_m?: number
          sort_order?: number
        }
        Relationships: []
      }
      segment_profiles: {
        Row: {
          badge: string
          bucket: string
          dimension: string
          id: string
          note: string | null
          segment: string
          share_pct: number
          sort_order: number
        }
        Insert: {
          badge?: string
          bucket: string
          dimension: string
          id?: string
          note?: string | null
          segment: string
          share_pct: number
          sort_order?: number
        }
        Update: {
          badge?: string
          bucket?: string
          dimension?: string
          id?: string
          note?: string | null
          segment?: string
          share_pct?: number
          sort_order?: number
        }
        Relationships: []
      }
      sources: {
        Row: {
          badge: string
          cadence: string
          feeds: string
          key: string
          name: string
          refreshed_on: string
          sort_order: number
          what_it_gives: string
        }
        Insert: {
          badge: string
          cadence: string
          feeds: string
          key: string
          name: string
          refreshed_on: string
          sort_order?: number
          what_it_gives: string
        }
        Update: {
          badge?: string
          cadence?: string
          feeds?: string
          key?: string
          name?: string
          refreshed_on?: string
          sort_order?: number
          what_it_gives?: string
        }
        Relationships: []
      }
      targetability_tiers: {
        Row: {
          badge: string
          basis: string
          cost_to_win: string
          key: string
          label: string
          play: string
          share_pct: number
          sort_order: number
          verdict: string
          who: string
          why: string
        }
        Insert: {
          badge?: string
          basis?: string
          cost_to_win: string
          key: string
          label: string
          play: string
          share_pct: number
          sort_order?: number
          verdict: string
          who: string
          why: string
        }
        Update: {
          badge?: string
          basis?: string
          cost_to_win?: string
          key?: string
          label?: string
          play?: string
          share_pct?: number
          sort_order?: number
          verdict?: string
          who?: string
          why?: string
        }
        Relationships: []
      }
      upi_share: {
        Row: {
          app: string
          month: string
          share_pct: number
          sort_order: number
        }
        Insert: {
          app: string
          month: string
          share_pct: number
          sort_order?: number
        }
        Update: {
          app?: string
          month?: string
          share_pct?: number
          sort_order?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
