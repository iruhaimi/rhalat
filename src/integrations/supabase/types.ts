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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_unlock_requests: {
        Row: {
          created_at: string | null
          email: string
          id: string
          reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_transfer_requests: {
        Row: {
          admin_notes: string | null
          application_id: string
          created_at: string
          from_agent_id: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          to_agent_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          application_id: string
          created_at?: string
          from_agent_id: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_agent_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          application_id?: string
          created_at?: string
          from_agent_id?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_agent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_transfer_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_transfer_requests_from_agent_id_fkey"
            columns: ["from_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_transfer_requests_from_agent_id_fkey"
            columns: ["from_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_transfer_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_transfer_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_transfer_requests_to_agent_id_fkey"
            columns: ["to_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_transfer_requests_to_agent_id_fkey"
            columns: ["to_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_work_submissions: {
        Row: {
          admin_notes: string | null
          agent_id: string
          application_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          agent_id: string
          application_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          agent_id?: string
          application_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_work_submissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_work_submissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_work_submissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_work_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_work_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
        ]
      }
      application_messages: {
        Row: {
          application_id: string
          attachment_name: string | null
          attachment_path: string | null
          attachment_type: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          priority: Database["public"]["Enums"]["message_priority"]
          read_at: string | null
          sender_id: string
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          application_id: string
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_type?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          priority?: Database["public"]["Enums"]["message_priority"]
          read_at?: string | null
          sender_id: string
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          application_id?: string
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_type?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          priority?: Database["public"]["Enums"]["message_priority"]
          read_at?: string | null
          sender_id?: string
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_notes: {
        Row: {
          application_id: string
          author_id: string
          author_name: string | null
          content: string
          created_at: string
          id: string
          note_type: Database["public"]["Enums"]["note_type"]
        }
        Insert: {
          application_id: string
          author_id: string
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          note_type: Database["public"]["Enums"]["note_type"]
        }
        Update: {
          application_id?: string
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"]
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["application_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["application_status"] | null
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["application_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["application_status"] | null
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["application_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["application_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          accommodation_details: string | null
          admin_notes: string | null
          agent_notes: string | null
          approved_at: string | null
          assigned_agent_id: string | null
          created_at: string
          display_number: string | null
          draft_data: Json | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          purpose_of_travel: string | null
          rejection_reason: string | null
          return_date: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          travel_date: string | null
          updated_at: string
          user_id: string
          visa_type_id: string
        }
        Insert: {
          accommodation_details?: string | null
          admin_notes?: string | null
          agent_notes?: string | null
          approved_at?: string | null
          assigned_agent_id?: string | null
          created_at?: string
          display_number?: string | null
          draft_data?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          purpose_of_travel?: string | null
          rejection_reason?: string | null
          return_date?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          travel_date?: string | null
          updated_at?: string
          user_id: string
          visa_type_id: string
        }
        Update: {
          accommodation_details?: string | null
          admin_notes?: string | null
          agent_notes?: string | null
          approved_at?: string | null
          assigned_agent_id?: string | null
          created_at?: string
          display_number?: string | null
          draft_data?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          purpose_of_travel?: string | null
          rejection_reason?: string | null
          return_date?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          travel_date?: string | null
          updated_at?: string
          user_id?: string
          visa_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_visa_type_id_fkey"
            columns: ["visa_type_id"]
            isOneToOne: false
            referencedRelation: "visa_types"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          display_order: number | null
          expected_appointment_date: string | null
          expected_appointment_note: string | null
          expected_appointment_updated_at: string | null
          expected_appointment_updated_by: string | null
          flag_url: string | null
          id: string
          is_active: boolean | null
          is_schengen: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number | null
          expected_appointment_date?: string | null
          expected_appointment_note?: string | null
          expected_appointment_updated_at?: string | null
          expected_appointment_updated_by?: string | null
          flag_url?: string | null
          id?: string
          is_active?: boolean | null
          is_schengen?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number | null
          expected_appointment_date?: string | null
          expected_appointment_note?: string | null
          expected_appointment_updated_at?: string | null
          expected_appointment_updated_by?: string | null
          flag_url?: string | null
          id?: string
          is_active?: boolean | null
          is_schengen?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_access_log: {
        Row: {
          access_type: string
          accessed_by: string
          accessed_by_name: string | null
          application_id: string
          created_at: string
          document_id: string
          document_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          access_type?: string
          accessed_by: string
          accessed_by_name?: string | null
          application_id: string
          created_at?: string
          document_id: string
          document_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string
          accessed_by_name?: string | null
          application_id?: string
          created_at?: string
          document_id?: string
          document_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "application_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "application_documents_safe"
            referencedColumns: ["id"]
          },
        ]
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
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          subscribed_at?: string
          unsubscribed_at?: string | null
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
      footer_settings: {
        Row: {
          category: string
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          key: string
          label: string
          updated_at: string
          url: string | null
          value: string
          value_en: string | null
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          label: string
          updated_at?: string
          url?: string | null
          value: string
          value_en?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          label?: string
          updated_at?: string
          url?: string | null
          value?: string
          value_en?: string | null
        }
        Relationships: []
      }
      hero_destinations: {
        Row: {
          country: string
          country_en: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          name: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          country: string
          country_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          name: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          country?: string
          country_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          name?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_settings: {
        Row: {
          category: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          key: string
          type: string
          updated_at: string
          value: string
          value_en: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key: string
          type?: string
          updated_at?: string
          value: string
          value_en?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key?: string
          type?: string
          updated_at?: string
          value?: string
          value_en?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string
          created_at: string
          currency: string | null
          id: string
          invoice_number: string | null
          paid_at: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          application_id: string
          created_at?: string
          currency?: string | null
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          application_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_sensitive_operations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string
          id: string
          operation_data: Json | null
          operation_type: Database["public"]["Enums"]["sensitive_operation_type"]
          rejection_reason: string | null
          request_reason: string | null
          requested_by: string
          status: Database["public"]["Enums"]["approval_status"]
          target_user_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          operation_data?: Json | null
          operation_type: Database["public"]["Enums"]["sensitive_operation_type"]
          rejection_reason?: string | null
          request_reason?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["approval_status"]
          target_user_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          operation_data?: Json | null
          operation_type?: Database["public"]["Enums"]["sensitive_operation_type"]
          rejection_reason?: string | null
          request_reason?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["approval_status"]
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          id: string
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          phone: string | null
          updated_at: string
          user_id: string
          wallet_balance: number | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          additional_details: string | null
          admin_notes: string | null
          application_number: string
          created_at: string
          email: string
          id: string
          phone: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          additional_details?: string | null
          admin_notes?: string | null
          application_number: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          status?: string
          updated_at?: string
        }
        Update: {
          additional_details?: string | null
          admin_notes?: string | null
          application_number?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
        ]
      }
      role_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          target_user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          page: string
          section: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          page: string
          section: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          page?: string
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      special_offers: {
        Row: {
          badge: string | null
          country_name: string
          created_at: string
          description: string | null
          discount_percentage: number
          end_date: string
          flag_emoji: string | null
          id: string
          is_active: boolean | null
          is_hot: boolean | null
          original_price: number
          sale_price: number
          start_date: string
          title: string
          updated_at: string
          visa_type_id: string | null
        }
        Insert: {
          badge?: string | null
          country_name: string
          created_at?: string
          description?: string | null
          discount_percentage: number
          end_date: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_hot?: boolean | null
          original_price: number
          sale_price: number
          start_date?: string
          title: string
          updated_at?: string
          visa_type_id?: string | null
        }
        Update: {
          badge?: string | null
          country_name?: string
          created_at?: string
          description?: string | null
          discount_percentage?: number
          end_date?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_hot?: boolean | null
          original_price?: number
          sale_price?: number
          start_date?: string
          title?: string
          updated_at?: string
          visa_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_offers_visa_type_id_fkey"
            columns: ["visa_type_id"]
            isOneToOne: false
            referencedRelation: "visa_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_2fa_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      staff_login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["staff_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["staff_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["staff_permission"]
          user_id?: string
        }
        Relationships: []
      }
      staff_recovery_codes: {
        Row: {
          code_hash: string
          code_index: number
          created_at: string | null
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          code_index: number
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          code_index?: number
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
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
      system_backups: {
        Row: {
          backup_type: string
          created_at: string
          created_by: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          records_count: Json | null
          tables_included: string[]
        }
        Insert: {
          backup_type?: string
          created_at?: string
          created_by: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          records_count?: Json | null
          tables_included: string[]
        }
        Update: {
          backup_type?: string
          created_at?: string
          created_by?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          records_count?: Json | null
          tables_included?: string[]
        }
        Relationships: []
      }
      tour_bookings: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          operator_id: string
          operator_notes: string | null
          preferred_date: string | null
          program_id: string
          status: string
          travelers_count: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          operator_id: string
          operator_notes?: string | null
          preferred_date?: string | null
          program_id: string
          status?: string
          travelers_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          operator_id?: string
          operator_notes?: string | null
          preferred_date?: string | null
          program_id?: string
          status?: string
          travelers_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "tour_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "tour_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_operators: {
        Row: {
          address: string | null
          admin_notes: string | null
          city: string | null
          company_name: string
          company_name_en: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_en: string | null
          email: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          logo_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          city?: string | null
          company_name: string
          company_name_en?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          city?: string | null
          company_name?: string
          company_name_en?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      tour_program_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          program_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          program_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          program_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_program_reviews_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "tour_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_programs: {
        Row: {
          available_dates: Json | null
          cancellation_policy: string | null
          cancellation_policy_en: string | null
          cover_image_url: string | null
          created_at: string
          currency: string
          daily_itinerary: Json | null
          description: string | null
          description_en: string | null
          destination: string
          destination_en: string | null
          discount_percentage: number | null
          discounted_price: number | null
          display_order: number | null
          duration_days: number
          duration_nights: number
          end_date: string | null
          exclusions: Json | null
          gallery_images: Json | null
          hotels: Json | null
          id: string
          inclusions: Json | null
          is_recurring: boolean
          max_seats: number | null
          operator_id: string
          price: number
          rejection_reason: string | null
          seats_booked: number
          start_date: string | null
          status: string
          tags: Json | null
          title: string
          title_en: string | null
          updated_at: string
          views_count: number
        }
        Insert: {
          available_dates?: Json | null
          cancellation_policy?: string | null
          cancellation_policy_en?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          daily_itinerary?: Json | null
          description?: string | null
          description_en?: string | null
          destination: string
          destination_en?: string | null
          discount_percentage?: number | null
          discounted_price?: number | null
          display_order?: number | null
          duration_days?: number
          duration_nights?: number
          end_date?: string | null
          exclusions?: Json | null
          gallery_images?: Json | null
          hotels?: Json | null
          id?: string
          inclusions?: Json | null
          is_recurring?: boolean
          max_seats?: number | null
          operator_id: string
          price?: number
          rejection_reason?: string | null
          seats_booked?: number
          start_date?: string | null
          status?: string
          tags?: Json | null
          title: string
          title_en?: string | null
          updated_at?: string
          views_count?: number
        }
        Update: {
          available_dates?: Json | null
          cancellation_policy?: string | null
          cancellation_policy_en?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          daily_itinerary?: Json | null
          description?: string | null
          description_en?: string | null
          destination?: string
          destination_en?: string | null
          discount_percentage?: number | null
          discounted_price?: number | null
          display_order?: number | null
          duration_days?: number
          duration_nights?: number
          end_date?: string | null
          exclusions?: Json | null
          gallery_images?: Json | null
          hotels?: Json | null
          id?: string
          inclusions?: Json | null
          is_recurring?: boolean
          max_seats?: number | null
          operator_id?: string
          price?: number
          rejection_reason?: string | null
          seats_booked?: number
          start_date?: string | null
          status?: string
          tags?: Json | null
          title?: string
          title_en?: string | null
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tour_programs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "tour_operators"
            referencedColumns: ["id"]
          },
        ]
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
      visa_types: {
        Row: {
          child_price: number | null
          country_id: string
          created_at: string
          description: string | null
          display_order: number | null
          entry_type: string | null
          fee_type: string | null
          gov_fee_adult: number | null
          gov_fee_child: number | null
          gov_fee_infant: number | null
          government_fees: number | null
          id: string
          infant_price: number | null
          is_active: boolean | null
          max_stay_days: number | null
          name: string
          price: number
          price_notes: string | null
          price_notes_en: string | null
          processing_days: number
          requirements: Json | null
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          child_price?: number | null
          country_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          entry_type?: string | null
          fee_type?: string | null
          gov_fee_adult?: number | null
          gov_fee_child?: number | null
          gov_fee_infant?: number | null
          government_fees?: number | null
          id?: string
          infant_price?: number | null
          is_active?: boolean | null
          max_stay_days?: number | null
          name: string
          price: number
          price_notes?: string | null
          price_notes_en?: string | null
          processing_days?: number
          requirements?: Json | null
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          child_price?: number | null
          country_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          entry_type?: string | null
          fee_type?: string | null
          gov_fee_adult?: number | null
          gov_fee_child?: number | null
          gov_fee_infant?: number | null
          government_fees?: number | null
          id?: string
          infant_price?: number | null
          is_active?: boolean | null
          max_stay_days?: number | null
          name?: string
          price?: number
          price_notes?: string | null
          price_notes_en?: string | null
          processing_days?: number
          requirements?: Json | null
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_types_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_agent_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      application_documents_safe: {
        Row: {
          application_id: string | null
          created_at: string | null
          document_type: string | null
          file_name: string | null
          file_size: number | null
          id: string | null
          mime_type: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string | null
          verification_notes: string | null
          verified_at: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          document_type?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string | null
          mime_type?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          document_type?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string | null
          mime_type?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_agent_view: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_application: {
        Args: { _app_id: string; _user_id: string }
        Returns: boolean
      }
      check_2fa_rate_limit: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      check_recovery_rate_limit: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      clear_failed_login_attempts: {
        Args: { target_email: string }
        Returns: undefined
      }
      create_application_draft: {
        Args: {
          p_draft_data?: Json
          p_travel_date?: string
          p_visa_type_id: string
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_agents_for_transfer: {
        Args: { exclude_profile_id?: string }
        Returns: {
          full_name: string
          id: string
        }[]
      }
      get_failed_attempts_count: {
        Args: { check_email: string }
        Returns: number
      }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      get_secure_document_info: {
        Args: { doc_id: string }
        Returns: {
          created_at: string
          document_type: string
          file_name: string
          id: string
          status: string
        }[]
      }
      get_user_email: { Args: { target_user_id: string }; Returns: string }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["staff_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_agent: { Args: { _user_id: string }; Returns: boolean }
      is_application_owner: {
        Args: { _app_id: string; _user_id: string }
        Returns: boolean
      }
      is_assigned_agent: {
        Args: { _app_id: string; _user_id: string }
        Returns: boolean
      }
      is_customer: { Args: { _user_id: string }; Returns: boolean }
      is_email_locked_out: { Args: { check_email: string }; Returns: boolean }
      is_profile_owner: {
        Args: { _auth_user_id: string; _profile_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tour_operator: { Args: { _user_id: string }; Returns: boolean }
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
      record_login_attempt: {
        Args: {
          p_email: string
          p_failure_reason?: string
          p_success: boolean
          p_user_agent?: string
        }
        Returns: undefined
      }
      verify_staff_2fa: {
        Args: { p_code: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "agent" | "admin" | "tour_operator"
      application_status:
        | "draft"
        | "pending_payment"
        | "submitted"
        | "whatsapp_pending"
        | "under_review"
        | "documents_required"
        | "processing"
        | "approved"
        | "rejected"
        | "cancelled"
      approval_status: "pending" | "approved" | "rejected" | "expired"
      document_status: "pending" | "verified" | "rejected"
      message_priority: "normal" | "important" | "urgent"
      note_type: "agent" | "admin" | "system"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      sensitive_operation_type:
        | "delete_staff"
        | "remove_admin_role"
        | "remove_manage_staff_permission"
      staff_permission:
        | "manage_applications"
        | "manage_users"
        | "manage_staff"
        | "manage_settings"
        | "manage_offers"
        | "manage_countries"
        | "manage_hero"
        | "view_reports"
        | "process_refunds"
        | "manage_unlock_requests"
        | "view_revenue"
        | "manage_appointments"
      wallet_transaction_type:
        | "deposit"
        | "withdrawal"
        | "payment"
        | "refund"
        | "reward"
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
      app_role: ["customer", "agent", "admin", "tour_operator"],
      application_status: [
        "draft",
        "pending_payment",
        "submitted",
        "whatsapp_pending",
        "under_review",
        "documents_required",
        "processing",
        "approved",
        "rejected",
        "cancelled",
      ],
      approval_status: ["pending", "approved", "rejected", "expired"],
      document_status: ["pending", "verified", "rejected"],
      message_priority: ["normal", "important", "urgent"],
      note_type: ["agent", "admin", "system"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      sensitive_operation_type: [
        "delete_staff",
        "remove_admin_role",
        "remove_manage_staff_permission",
      ],
      staff_permission: [
        "manage_applications",
        "manage_users",
        "manage_staff",
        "manage_settings",
        "manage_offers",
        "manage_countries",
        "manage_hero",
        "view_reports",
        "process_refunds",
        "manage_unlock_requests",
        "view_revenue",
        "manage_appointments",
      ],
      wallet_transaction_type: [
        "deposit",
        "withdrawal",
        "payment",
        "refund",
        "reward",
      ],
    },
  },
} as const
