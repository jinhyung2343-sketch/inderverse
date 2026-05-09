export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      age_verifications: {
        Row: {
          ci_hash: string | null
          expires_at: string
          id: string
          provider: Database["public"]["Enums"]["age_verify_provider"]
          user_id: string
          verified_at: string
        }
        Insert: {
          ci_hash?: string | null
          expires_at: string
          id?: string
          provider: Database["public"]["Enums"]["age_verify_provider"]
          user_id: string
          verified_at?: string
        }
        Update: {
          ci_hash?: string | null
          expires_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["age_verify_provider"]
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "age_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_saves: {
        Row: {
          artwork_id: string
          id: number
          saved_at: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          id?: number
          saved_at?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          id?: number
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_tags: {
        Row: {
          channel_id: string
          tag_id: number
        }
        Insert: {
          channel_id: string
          tag_id: number
        }
        Update: {
          channel_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "channel_tags_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          age_rating: string
          comment_policy_note: string | null
          cover_image_url: string | null
          created_at: string
          creator_channel_id: string | null
          creator_id: string
          description: string | null
          id: string
          is_adult_only: boolean
          is_comment_enabled: boolean
          spark_caption: string | null
          spark_format: Database["public"]["Enums"]["spark_format"] | null
          spark_meta: Json
          spark_panel_count: number | null
          serialization_days: Json
          status: Database["public"]["Enums"]["channel_status"]
          rating_checklist: Json
          title: string
          updated_at: string
          wait_free_hours: number
          work_type: Database["public"]["Enums"]["work_type"]
        }
        Insert: {
          age_rating?: string
          comment_policy_note?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_channel_id?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_adult_only?: boolean
          is_comment_enabled?: boolean
          spark_caption?: string | null
          spark_format?: Database["public"]["Enums"]["spark_format"] | null
          spark_meta?: Json
          spark_panel_count?: number | null
          serialization_days?: Json
          status?: Database["public"]["Enums"]["channel_status"]
          rating_checklist?: Json
          title: string
          updated_at?: string
          wait_free_hours?: number
          work_type?: Database["public"]["Enums"]["work_type"]
        }
        Update: {
          age_rating?: string
          comment_policy_note?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_channel_id?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_adult_only?: boolean
          is_comment_enabled?: boolean
          spark_caption?: string | null
          spark_format?: Database["public"]["Enums"]["spark_format"] | null
          spark_meta?: Json
          spark_panel_count?: number | null
          serialization_days?: Json
          status?: Database["public"]["Enums"]["channel_status"]
          rating_checklist?: Json
          title?: string
          updated_at?: string
          wait_free_hours?: number
          work_type?: Database["public"]["Enums"]["work_type"]
        }
        Relationships: [
          {
            foreignKeyName: "channels_creator_channel_id_fkey"
            columns: ["creator_channel_id"]
            isOneToOne: false
            referencedRelation: "creator_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_assets: {
        Row: {
          asset_type: string
          channel_id: string
          created_at: string
          duration_seconds: number | null
          episode_id: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          metadata: Json
          mime_type: string
          processing_status: string
          public_url: string
          sort_order: number
          storage_path: string | null
          width: number | null
        }
        Insert: {
          asset_type: string
          channel_id: string
          created_at?: string
          duration_seconds?: number | null
          episode_id?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type: string
          processing_status?: string
          public_url: string
          sort_order?: number
          storage_path?: string | null
          width?: number | null
        }
        Update: {
          asset_type?: string
          channel_id?: string
          created_at?: string
          duration_seconds?: number | null
          episode_id?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string
          processing_status?: string
          public_url?: string
          sort_order?: number
          storage_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_agreement_consents: {
        Row: {
          agreed_at: string
          agreement_version: string
          created_at: string
          id: string
          is_agreed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          agreed_at?: string
          agreement_version: string
          created_at?: string
          id?: string
          is_agreed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          agreed_at?: string
          agreement_version?: string
          created_at?: string
          id?: string
          is_agreed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_agreement_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_channels: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          display_name: string
          external_links: Json
          id: string
          owner_id: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name: string
          external_links?: Json
          id?: string
          owner_id: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string
          external_links?: Json
          id?: string
          owner_id?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_channels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      minor_guardian_consents: {
        Row: {
          consent_version: string
          created_at: string
          guardian_email: string
          guardian_name: string
          guardian_phone: string
          guardian_relationship: string
          id: string
          notes: string | null
          requested_at: string
          reviewed_at: string | null
          status: string
          verification_channel: string
          verification_note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_version: string
          created_at?: string
          guardian_email: string
          guardian_name: string
          guardian_phone?: string
          guardian_relationship: string
          id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          status?: string
          verification_channel?: string
          verification_note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_version?: string
          created_at?: string
          guardian_email?: string
          guardian_name?: string
          guardian_phone?: string
          guardian_relationship?: string
          id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          status?: string
          verification_channel?: string
          verification_note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "minor_guardian_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_terms_consents: {
        Row: {
          age_confirmed: boolean
          agreed_at: string
          community_policy_agreed: boolean
          community_policy_version: string
          created_at: string
          email_notification_agreed: boolean
          id: string
          marketing_agreed: boolean
          payment_policy_agreed: boolean
          payment_policy_version: string
          privacy_agreed: boolean
          privacy_version: string
          push_notification_agreed: boolean
          recommendation_data_agreed: boolean
          required_terms_agreed: boolean
          terms_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_confirmed?: boolean
          agreed_at?: string
          community_policy_agreed?: boolean
          community_policy_version: string
          created_at?: string
          email_notification_agreed?: boolean
          id?: string
          marketing_agreed?: boolean
          payment_policy_agreed?: boolean
          payment_policy_version: string
          privacy_agreed?: boolean
          privacy_version: string
          push_notification_agreed?: boolean
          recommendation_data_agreed?: boolean
          required_terms_agreed?: boolean
          terms_version: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_confirmed?: boolean
          agreed_at?: string
          community_policy_agreed?: boolean
          community_policy_version?: string
          created_at?: string
          email_notification_agreed?: boolean
          id?: string
          marketing_agreed?: boolean
          payment_policy_agreed?: boolean
          payment_policy_version?: string
          privacy_agreed?: boolean
          privacy_version?: string
          push_notification_agreed?: boolean
          recommendation_data_agreed?: boolean
          required_terms_agreed?: boolean
          terms_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_terms_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          coin_type: Database["public"]["Enums"]["coin_type"]
          created_at: string
          description: string | null
          id: string
          idempotency_key: string | null
          payment_provider: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["coin_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          coin_type: Database["public"]["Enums"]["coin_type"]
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          payment_provider?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["coin_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          coin_type?: Database["public"]["Enums"]["coin_type"]
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          payment_provider?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["coin_tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_wallets: {
        Row: {
          free_balance: number
          id: string
          paid_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          free_balance?: number
          id?: string
          paid_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          free_balance?: number
          id?: string
          paid_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_images: {
        Row: {
          episode_id: string
          file_size_bytes: number | null
          height: number | null
          id: string
          image_url: string
          is_verified: boolean
          sort_order: number
          width: number | null
        }
        Insert: {
          episode_id: string
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          image_url: string
          is_verified?: boolean
          sort_order: number
          width?: number | null
        }
        Update: {
          episode_id?: string
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          image_url?: string
          is_verified?: boolean
          sort_order?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "episode_images_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_views: {
        Row: {
          episode_id: string
          id: number
          ip_hash: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          episode_id: string
          id?: number
          ip_hash?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          episode_id?: string
          id?: number
          ip_hash?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_views_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_reactions: {
        Row: {
          anon_id: string | null
          channel_id: string
          id: number
          reacted_at: string
          reaction_type: string
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          channel_id: string
          id?: number
          reacted_at?: string
          reaction_type?: string
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          channel_id?: string
          id?: number
          reacted_at?: string
          reaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spark_reactions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_saves: {
        Row: {
          channel_id: string
          id: number
          saved_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: number
          saved_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: number
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_saves_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_views: {
        Row: {
          anon_id: string | null
          channel_id: string
          id: number
          ip_hash: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          anon_id?: string | null
          channel_id: string
          id?: number
          ip_hash?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          anon_id?: string | null
          channel_id?: string
          id?: number
          ip_hash?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_views_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          body_json: Json
          body_text: string | null
          channel_id: string
          coin_price: number
          created_at: string
          episode_number: number
          id: string
          is_adult_only: boolean
          pricing_type: Database["public"]["Enums"]["episode_pricing"]
          published_at: string | null
          status: Database["public"]["Enums"]["episode_status"]
          title: string
          updated_at: string
        }
        Insert: {
          body_json?: Json
          body_text?: string | null
          channel_id: string
          coin_price?: number
          created_at?: string
          episode_number: number
          id?: string
          is_adult_only?: boolean
          pricing_type?: Database["public"]["Enums"]["episode_pricing"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["episode_status"]
          title: string
          updated_at?: string
        }
        Update: {
          body_json?: Json
          body_text?: string | null
          channel_id?: string
          coin_price?: number
          created_at?: string
          episode_number?: number
          id?: string
          is_adult_only?: boolean
          pricing_type?: Database["public"]["Enums"]["episode_pricing"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["episode_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_band: string
          avatar_url: string | null
          created_at: string
          display_name: string
          guardian_consent_requested_at: string | null
          guardian_consent_status: string
          id: string
          is_adult_verified: boolean
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          age_band?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          guardian_consent_requested_at?: string | null
          guardian_consent_status?: string
          id: string
          is_adult_verified?: boolean
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          age_band?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          guardian_consent_requested_at?: string | null
          guardian_consent_status?: string
          id?: string
          is_adult_verified?: boolean
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          coin_amount: number
          episode_id: string
          free_coin_used: number
          id: string
          paid_coin_used: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          coin_amount: number
          episode_id: string
          free_coin_used?: number
          id?: string
          paid_coin_used?: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          coin_amount?: number
          episode_id?: string
          free_coin_used?: number
          id?: string
          paid_coin_used?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_settings: {
        Row: {
          bank_info_encrypted: string | null
          channel_id: string
          creator_share_pct: number
          id: string
          min_payout_amount: number
          payout_method: Database["public"]["Enums"]["payout_method"] | null
          platform_share_pct: number | null
          updated_at: string
        }
        Insert: {
          bank_info_encrypted?: string | null
          channel_id: string
          creator_share_pct?: number
          id?: string
          min_payout_amount?: number
          payout_method?: Database["public"]["Enums"]["payout_method"] | null
          platform_share_pct?: number | null
          updated_at?: string
        }
        Update: {
          bank_info_encrypted?: string | null
          channel_id?: string
          creator_share_pct?: number
          id?: string
          min_payout_amount?: number
          payout_method?: Database["public"]["Enums"]["payout_method"] | null
          platform_share_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          channel_id: string
          created_at: string
          creator_amount: number
          creator_id: string
          creator_share_pct_snapshot: number
          free_coin_revenue: number
          gross_revenue_coins: number
          id: string
          paid_at: string | null
          paid_coin_revenue: number
          period_end: string
          period_start: string
          platform_amount: number
          status: Database["public"]["Enums"]["settlement_status"]
          total_purchases: number
        }
        Insert: {
          channel_id: string
          created_at?: string
          creator_amount?: number
          creator_id: string
          creator_share_pct_snapshot: number
          free_coin_revenue?: number
          gross_revenue_coins?: number
          id?: string
          paid_at?: string | null
          paid_coin_revenue?: number
          period_end: string
          period_start: string
          platform_amount?: number
          status?: Database["public"]["Enums"]["settlement_status"]
          total_purchases?: number
        }
        Update: {
          channel_id?: string
          created_at?: string
          creator_amount?: number
          creator_id?: string
          creator_share_pct_snapshot?: number
          free_coin_revenue?: number
          gross_revenue_coins?: number
          id?: string
          paid_at?: string | null
          paid_coin_revenue?: number
          period_end?: string
          period_start?: string
          platform_amount?: number
          status?: Database["public"]["Enums"]["settlement_status"]
          total_purchases?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlements_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: Database["public"]["Enums"]["tag_category"]
          id: number
          is_adult_only: boolean
          name: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["tag_category"]
          id?: number
          is_adult_only?: boolean
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["tag_category"]
          id?: number
          is_adult_only?: boolean
          name?: string
        }
        Relationships: []
      }
      wait_free_unlocks: {
        Row: {
          channel_id: string
          episode_id: string
          id: string
          next_unlock_available_at: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          episode_id: string
          id?: string
          next_unlock_available_at: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          episode_id?: string
          id?: string
          next_unlock_available_at?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wait_free_unlocks_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wait_free_unlocks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wait_free_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      charge_coins: {
        Args: {
          p_amount: number
          p_idempotency_key: string
          p_payment_provider: string | null
          p_user_id: string
        }
        Returns: Json
      }
      purchase_episode: {
        Args: {
          p_episode_id: string
          p_user_id: string
        }
        Returns: Json
      }
      update_webtoon_episode_with_images: {
        Args: {
          p_channel_id: string
          p_coin_price: number
          p_episode_id: string
          p_episode_number: number
          p_images?: Json
          p_is_adult_only: boolean
          p_pricing_type: Database["public"]["Enums"]["episode_pricing"]
          p_published_at: string | null
          p_status: Database["public"]["Enums"]["episode_status"]
          p_title: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      age_verify_provider: "pass" | "phone" | "manual"
      channel_status: "draft" | "publishing" | "completed" | "suspended"
      coin_tx_type: "charge" | "use" | "refund" | "expire" | "bonus"
      coin_type: "paid" | "free"
      episode_pricing: "free" | "paid" | "wait_free"
      episode_status: "draft" | "published" | "hidden"
      payout_method: "bank_transfer" | "paypal"
      spark_format: "single_cut" | "four_cut"
      settlement_status: "pending" | "processing" | "completed" | "failed"
      tag_category: "genre" | "mood" | "warning"
      user_role: "reader" | "creator" | "admin"
      work_type:
        | "webtoon"
        | "spark"
        | "novel"
        | "audio_drama"
        | "music"
        | "illustration"
        | "essay"
        | "other"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      age_verify_provider: ["pass", "phone", "manual"],
      channel_status: ["draft", "publishing", "completed", "suspended"],
      coin_tx_type: ["charge", "use", "refund", "expire", "bonus"],
      coin_type: ["paid", "free"],
      episode_pricing: ["free", "paid", "wait_free"],
      episode_status: ["draft", "published", "hidden"],
      payout_method: ["bank_transfer", "paypal"],
      spark_format: ["single_cut", "four_cut"],
      settlement_status: ["pending", "processing", "completed", "failed"],
      tag_category: ["genre", "mood", "warning"],
      user_role: ["reader", "creator", "admin"],
      work_type: [
        "webtoon",
        "spark",
        "novel",
        "audio_drama",
        "music",
        "illustration",
        "essay",
        "other",
      ],
    },
  },
} as const
