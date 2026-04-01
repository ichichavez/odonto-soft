export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: "admin" | "dentista" | "asistente"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role: "admin" | "dentista" | "asistente"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: "admin" | "dentista" | "asistente"
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          identity_number: string | null
          email: string | null
          phone: string | null
          birth_date: string | null
          gender: string | null
          marital_status: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          identity_number?: string | null
          email?: string | null
          phone?: string | null
          birth_date?: string | null
          gender?: string | null
          marital_status?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          identity_number?: string | null
          email?: string | null
          phone?: string | null
          birth_date?: string | null
          gender?: string | null
          marital_status?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          allergies: string | null
          medications: string | null
          chronic_diseases: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          allergies?: string | null
          medications?: string | null
          chronic_diseases?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          allergies?: string | null
          medications?: string | null
          chronic_diseases?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dental_records: {
        Row: {
          id: string
          patient_id: string
          last_visit: string | null
          previous_treatments: string | null
          hygiene_habits: string | null
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          last_visit?: string | null
          previous_treatments?: string | null
          hygiene_habits?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          last_visit?: string | null
          previous_treatments?: string | null
          hygiene_habits?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      treatments: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          dentist_id: string
          treatment_id: string | null
          date: string
          time: string
          duration: number | null
          status: "scheduled" | "completed" | "cancelled" | "no_show"
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          dentist_id: string
          treatment_id?: string | null
          date: string
          time: string
          duration?: number | null
          status?: "scheduled" | "completed" | "cancelled" | "no_show"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          dentist_id?: string
          treatment_id?: string | null
          date?: string
          time?: string
          duration?: number | null
          status?: "scheduled" | "completed" | "cancelled" | "no_show"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          number: string
          patient_id: string
          created_by: string
          date: string
          valid_until: string | null
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status: "pendiente" | "aceptado" | "rechazado" | "expirado"
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: string
          patient_id: string
          created_by: string
          date: string
          valid_until?: string | null
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status?: "pendiente" | "aceptado" | "rechazado" | "expirado"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: string
          patient_id?: string
          created_by?: string
          date?: string
          valid_until?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          status?: "pendiente" | "aceptado" | "rechazado" | "expirado"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budget_items: {
        Row: {
          id: string
          budget_id: string
          treatment_id: string
          description: string
          quantity: number
          price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          treatment_id: string
          description: string
          quantity: number
          price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          treatment_id?: string
          description?: string
          quantity?: number
          price?: number
          total?: number
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          number: string
          patient_id: string
          budget_id: string | null
          created_by: string
          date: string
          due_date: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status: "pendiente" | "pagada" | "anulada" | "vencida"
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: string
          patient_id: string
          budget_id?: string | null
          created_by: string
          date: string
          due_date: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status?: "pendiente" | "pagada" | "anulada" | "vencida"
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: string
          patient_id?: string
          budget_id?: string | null
          created_by?: string
          date?: string
          due_date?: string
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          status?: "pendiente" | "pagada" | "anulada" | "vencida"
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          treatment_id: string | null
          description: string
          quantity: number
          price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          treatment_id?: string | null
          description: string
          quantity: number
          price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          treatment_id?: string | null
          description?: string
          quantity?: number
          price?: number
          total?: number
          created_at?: string
        }
      }
      material_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          name: string
          category_id: string
          description: string | null
          unit: string
          stock_quantity: number
          min_stock_quantity: number
          cost_price: number
          profit_percentage: number
          price: number
          supplier: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id: string
          description?: string | null
          unit: string
          stock_quantity: number
          min_stock_quantity: number
          cost_price: number
          profit_percentage: number
          price: number
          supplier?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string
          description?: string | null
          unit?: string
          stock_quantity?: number
          min_stock_quantity?: number
          cost_price?: number
          profit_percentage?: number
          price?: number
          supplier?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      material_sales: {
        Row: {
          id: string
          invoice_id: string
          material_id: string
          quantity: number
          cost_price: number
          sale_price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          material_id: string
          quantity: number
          cost_price: number
          sale_price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          material_id?: string
          quantity?: number
          cost_price?: number
          sale_price?: number
          total?: number
          created_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          material_id: string
          user_id: string
          movement_type: "entrada" | "salida" | "ajuste"
          quantity: number
          notes: string | null
          reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          user_id: string
          movement_type: "entrada" | "salida" | "ajuste"
          quantity: number
          notes?: string | null
          reference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          user_id?: string
          movement_type?: "entrada" | "salida" | "ajuste"
          quantity?: number
          notes?: string | null
          reference?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: "info" | "warning" | "error" | "success"
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: "info" | "warning" | "error" | "success"
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: "info" | "warning" | "error" | "success"
          read?: boolean
          created_at?: string
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
      user_role: "admin" | "dentista" | "asistente"
      appointment_status: "scheduled" | "completed" | "cancelled" | "no_show"
      budget_status: "pendiente" | "aceptado" | "rechazado" | "expirado"
      invoice_status: "pendiente" | "pagada" | "anulada" | "vencida"
      movement_type: "entrada" | "salida" | "ajuste"
      notification_type: "info" | "warning" | "error" | "success"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos de utilidad para facilitar el uso
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Patient = Database["public"]["Tables"]["patients"]["Row"]
export type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"]
export type DentalRecord = Database["public"]["Tables"]["dental_records"]["Row"]
export type Treatment = Database["public"]["Tables"]["treatments"]["Row"]
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
export type Budget = Database["public"]["Tables"]["budgets"]["Row"]
export type BudgetItem = Database["public"]["Tables"]["budget_items"]["Row"]
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"]
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"]
export type Material = Database["public"]["Tables"]["materials"]["Row"]
export type MaterialCategory = Database["public"]["Tables"]["material_categories"]["Row"]
export type MaterialSale = Database["public"]["Tables"]["material_sales"]["Row"]
export type InventoryMovement = Database["public"]["Tables"]["inventory_movements"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]

// Tipos para inserciones
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"]
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"]
export type MedicalRecordInsert = Database["public"]["Tables"]["medical_records"]["Insert"]
export type DentalRecordInsert = Database["public"]["Tables"]["dental_records"]["Insert"]
export type TreatmentInsert = Database["public"]["Tables"]["treatments"]["Insert"]
export type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"]
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"]
export type BudgetItemInsert = Database["public"]["Tables"]["budget_items"]["Insert"]
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"]
export type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"]
export type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"]
export type MaterialCategoryInsert = Database["public"]["Tables"]["material_categories"]["Insert"]
export type MaterialSaleInsert = Database["public"]["Tables"]["material_sales"]["Insert"]
export type InventoryMovementInsert = Database["public"]["Tables"]["inventory_movements"]["Insert"]
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]

// Tipos para actualizaciones
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"]
export type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"]
export type MedicalRecordUpdate = Database["public"]["Tables"]["medical_records"]["Update"]
export type DentalRecordUpdate = Database["public"]["Tables"]["dental_records"]["Update"]
export type TreatmentUpdate = Database["public"]["Tables"]["treatments"]["Update"]
export type AppointmentUpdate = Database["public"]["Tables"]["appointments"]["Update"]
export type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"]
export type BudgetItemUpdate = Database["public"]["Tables"]["budget_items"]["Update"]
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"]
export type InvoiceItemUpdate = Database["public"]["Tables"]["invoice_items"]["Update"]
export type MaterialUpdate = Database["public"]["Tables"]["materials"]["Update"]
export type MaterialCategoryUpdate = Database["public"]["Tables"]["material_categories"]["Update"]
export type MaterialSaleUpdate = Database["public"]["Tables"]["material_sales"]["Update"]
export type InventoryMovementUpdate = Database["public"]["Tables"]["inventory_movements"]["Update"]
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"]
