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
      appointments: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          date: string
          dentist_id: string
          duration: number | null
          id: string
          notes: string | null
          patient_id: string
          status: string
          time: string
          treatment_id: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          date: string
          dentist_id: string
          duration?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          status?: string
          time: string
          treatment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          date?: string
          dentist_id?: string
          duration?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string
          time?: string
          treatment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budget_id: string
          created_at: string | null
          description: string
          id: string
          price: number
          quantity: number
          total: number
          treatment_id: string
        }
        Insert: {
          budget_id: string
          created_at?: string | null
          description: string
          id?: string
          price: number
          quantity?: number
          total: number
          treatment_id: string
        }
        Update: {
          budget_id?: string
          created_at?: string | null
          description?: string
          id?: string
          price?: number
          quantity?: number
          total?: number
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          created_by: string
          date: string
          id: string
          notes: string | null
          number: string
          patient_id: string
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          date: string
          id?: string
          notes?: string | null
          number: string
          patient_id: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          date?: string
          id?: string
          notes?: string | null
          number?: string
          patient_id?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          consent_template: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          consent_template?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          consent_template?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      consent_signatures: {
        Row: {
          clinic_id: string | null
          consent_text_snapshot: string
          created_by: string | null
          id: string
          patient_id: string
          signed_at: string | null
          signed_by_ci: string | null
          signed_by_name: string
        }
        Insert: {
          clinic_id?: string | null
          consent_text_snapshot: string
          created_by?: string | null
          id?: string
          patient_id: string
          signed_at?: string | null
          signed_by_ci?: string | null
          signed_by_name: string
        }
        Update: {
          clinic_id?: string | null
          consent_text_snapshot?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          signed_at?: string | null
          signed_by_ci?: string | null
          signed_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_signatures_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_signatures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_signatures_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_record_history: {
        Row: {
          dental_record_id: string
          id: string
          patient_id: string
          saved_at: string | null
          saved_by: string | null
          saved_by_name: string | null
          snapshot: Json
        }
        Insert: {
          dental_record_id: string
          id?: string
          patient_id: string
          saved_at?: string | null
          saved_by?: string | null
          saved_by_name?: string | null
          snapshot: Json
        }
        Update: {
          dental_record_id?: string
          id?: string
          patient_id?: string
          saved_at?: string | null
          saved_by?: string | null
          saved_by_name?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dental_record_history_dental_record_id_fkey"
            columns: ["dental_record_id"]
            isOneToOne: false
            referencedRelation: "dental_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_record_history_saved_by_fkey"
            columns: ["saved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_records: {
        Row: {
          civil_status: string | null
          clinic_id: string | null
          consultation_date: string | null
          created_at: string | null
          dental_history: Json | null
          diet_record: Json | null
          extra_oral_exam: Json | null
          feeding_history: Json | null
          guardian_name: string | null
          guardian_phone: string | null
          habits: Json | null
          height: number | null
          id: string
          intra_oral_exam: Json | null
          medical_history: Json | null
          odontogram_initial: Json | null
          odontogram_locked: boolean | null
          patient_id: string
          patient_type: string
          profession: string | null
          reason_of_visit: string[] | null
          reason_other: string | null
          referred_by: string | null
          updated_at: string | null
          updated_by: string | null
          weight: number | null
          work_address: string | null
        }
        Insert: {
          civil_status?: string | null
          clinic_id?: string | null
          consultation_date?: string | null
          created_at?: string | null
          dental_history?: Json | null
          diet_record?: Json | null
          extra_oral_exam?: Json | null
          feeding_history?: Json | null
          guardian_name?: string | null
          guardian_phone?: string | null
          habits?: Json | null
          height?: number | null
          id?: string
          intra_oral_exam?: Json | null
          medical_history?: Json | null
          odontogram_initial?: Json | null
          odontogram_locked?: boolean | null
          patient_id: string
          patient_type?: string
          profession?: string | null
          reason_of_visit?: string[] | null
          reason_other?: string | null
          referred_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          weight?: number | null
          work_address?: string | null
        }
        Update: {
          civil_status?: string | null
          clinic_id?: string | null
          consultation_date?: string | null
          created_at?: string | null
          dental_history?: Json | null
          diet_record?: Json | null
          extra_oral_exam?: Json | null
          feeding_history?: Json | null
          guardian_name?: string | null
          guardian_phone?: string | null
          habits?: Json | null
          height?: number | null
          id?: string
          intra_oral_exam?: Json | null
          medical_history?: Json | null
          odontogram_initial?: Json | null
          odontogram_locked?: boolean | null
          patient_id?: string
          patient_type?: string
          profession?: string | null
          reason_of_visit?: string[] | null
          reason_other?: string | null
          referred_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          weight?: number | null
          work_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          id: string
          material_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference: string | null
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          material_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          material_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          price: number
          quantity: number
          total: number
          treatment_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          price: number
          quantity?: number
          total: number
          treatment_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          price?: number
          quantity?: number
          total?: number
          treatment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          budget_id: string | null
          clinic_id: string | null
          created_at: string | null
          created_by: string
          date: string
          due_date: string
          id: string
          notes: string | null
          number: string
          patient_id: string
          payment_method: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string | null
        }
        Insert: {
          budget_id?: string | null
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          date: string
          due_date: string
          id?: string
          notes?: string | null
          number: string
          patient_id: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          budget_id?: string | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          date?: string
          due_date?: string
          id?: string
          notes?: string | null
          number?: string
          patient_id?: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      material_sales: {
        Row: {
          cost_price: number
          created_at: string | null
          id: string
          invoice_id: string
          material_id: string
          quantity: number
          sale_price: number
          total: number
        }
        Insert: {
          cost_price: number
          created_at?: string | null
          id?: string
          invoice_id: string
          material_id: string
          quantity: number
          sale_price: number
          total: number
        }
        Update: {
          cost_price?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          material_id?: string
          quantity?: number
          sale_price?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_sales_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category_id: string
          clinic_id: string | null
          cost_price: number
          created_at: string | null
          description: string | null
          id: string
          min_stock_quantity: number
          name: string
          price: number
          profit_percentage: number
          stock_quantity: number
          supplier: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          clinic_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          min_stock_quantity?: number
          name: string
          price?: number
          profit_percentage?: number
          stock_quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          clinic_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          min_stock_quantity?: number
          name?: string
          price?: number
          profit_percentage?: number
          stock_quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          allergies: string | null
          chronic_diseases: string | null
          created_at: string | null
          id: string
          medications: string | null
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          allergies?: string | null
          chronic_diseases?: string | null
          created_at?: string | null
          id?: string
          medications?: string | null
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          allergies?: string | null
          chronic_diseases?: string | null
          created_at?: string | null
          id?: string
          medications?: string | null
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_files: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          notes: string | null
          patient_id: string
          taken_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string
          file_url: string
          id?: string
          notes?: string | null
          patient_id: string
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          patient_id?: string
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          clinic_id: string | null
          created_at: string | null
          email: string | null
          first_name: string
          gender: string | null
          guardian_identity_number: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          guardian_secondary_phone: string | null
          id: string
          identity_number: string | null
          last_name: string
          marital_status: string | null
          patient_type: string | null
          phone: string | null
          profession: string | null
          secondary_phone: string | null
          updated_at: string | null
          work_address: string | null
          work_phone: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          guardian_identity_number?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          guardian_secondary_phone?: string | null
          id?: string
          identity_number?: string | null
          last_name: string
          marital_status?: string | null
          patient_type?: string | null
          phone?: string | null
          profession?: string | null
          secondary_phone?: string | null
          updated_at?: string | null
          work_address?: string | null
          work_phone?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          guardian_identity_number?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          guardian_secondary_phone?: string | null
          id?: string
          identity_number?: string | null
          last_name?: string
          marital_status?: string | null
          patient_type?: string | null
          phone?: string | null
          profession?: string | null
          secondary_phone?: string | null
          updated_at?: string | null
          work_address?: string | null
          work_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          id: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
