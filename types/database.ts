export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ============================================================
// JSONB shape types — estructuras de los campos JSONB
// ============================================================

export type ReasonOfVisit = "dolor" | "caries" | "traumatismo" | "control" | "otro"

export type ExtraOralExam = {
  atm: {
    pain_palpation: boolean
    pain_opening: boolean
    pain_closing: boolean
    joint_noise: boolean
    no_issues: boolean
    other: string
  }
  head: {
    scar: boolean
    asymmetry: boolean
    normal_size: boolean
    normal_shape: boolean
    other: string
  }
  face: {
    asymmetric_front: boolean
    convex_profile: boolean
    concave_profile: boolean
    straight_profile: boolean
    no_particularities: boolean
  }
  lymph_nodes: {
    no_particularities: boolean
    enlarged: boolean
    enlarged_detail: string
    other: string
  }
  lips: {
    short: boolean
    normal: boolean
    dry_cracked: boolean
    injured_commissures: boolean
    labial_incompetence: boolean
  }
}

export type IntraOralExam = {
  gums: {
    localized_gingivitis: boolean
    generalized_gingivitis: boolean
    healthy: boolean
    periodontal_pockets: boolean
    other: string
  }
  tongue: {
    no_anomalies: boolean
    short_frenulum: boolean
    geographic: boolean
    coated: boolean
    other: string
  }
  hard_palate: {
    color: string
    normal_size: boolean
    normal_shape: boolean
    color_anomaly: boolean
    ulcers: boolean
    size_anomaly: boolean
    torus: boolean
    burns: boolean
    erythema: boolean
    other: string
  }
  soft_palate: {
    no_particularities: boolean
    burns: boolean
    ulcers: boolean
    petechiae_erythema: boolean
  }
  pharynx: {
    normal: boolean
    grade1: boolean
    grade2: boolean
    grade3: boolean
    grade4: boolean
    surgically_removed: boolean
  }
  floor_of_mouth: {
    no_abnormalities: boolean
    ranula: boolean
    short_frenulum: boolean
    lingual_tori: boolean
  }
  occlusion_temporary: {
    straight_terminal_plane: boolean
    mesial_terminal_plane: boolean
    distal_terminal_plane: boolean
  }
  occlusion_mixed_permanent: {
    class1: boolean
    class2: boolean
    class3: boolean
  }
  bite_type: {
    normal: boolean
    anterior_crossbite: boolean
    posterior_crossbite: boolean
    single_tooth_crossbite: boolean
    anterior_open_bite: boolean
    scissor_bite: boolean
    other: string
  }
}

export type Habits = {
  finger_sucking: boolean
  finger_sucking_which: string
  nail_biting: boolean
  pencil_biting: boolean
  pen_biting: boolean
  lip_interposition: boolean
  no_bad_habits: boolean
  mouth_opening: "normal" | "limited" | "right" | "left" | ""
  lip_closure: "normal" | "insufficient" | "other" | ""
  lip_closure_other: string
  breathing: "nasal" | "oral" | "mixed" | ""
  swallowing: "normal" | "chin_wrinkle" | "lingual_interposition" | "lower_lip_interposition" | ""
}

export type MedicalHistory = {
  under_medical_treatment: boolean
  treatment_duration: string
  taking_medication: boolean
  medication_detail: string
  diseases: {
    tuberculosis: boolean
    leprosy: boolean
    cardiac: boolean
    sexual_diseases: boolean
    asthma: boolean
    hepatitis: boolean
    hypertension: boolean
    malaria: boolean
    allergy: boolean
    aids: boolean
    chagas: boolean
    psychiatric: boolean
    rheumatic_fever: boolean
    seizures: boolean
    epilepsy: boolean
    fainting: boolean
    sinusitis: boolean
    coagulation_problems: boolean
    anemia: boolean
    diabetes: boolean
    hemophilia: boolean
    ulcers: boolean
    other: boolean
    other_detail: string
  }
  needs_blood_transfusion: boolean
  transfusion_reason: string
  had_surgery: boolean
  surgery_detail: string
  bleeds_excessively: boolean
  smokes: boolean
  smoking_duration: string
  cigarettes_per_day: string
  drinks_alcohol: boolean
  alcohol_duration: string
  pregnant: boolean
  pregnancy_duration: string
  tolerates_anesthesia: boolean
  never_had_anesthesia: boolean
  elisa_test: boolean
  elisa_test_duration: string
  consultation_reason: string
}

export type DentalHistory = {
  last_dentist_visit: string
  has_tooth_loss: boolean
  tooth_loss_reason: "caries" | "accident" | "mobility" | "orthodontic" | ""
  brushing_frequency: string
  hygiene_brush: boolean
  hygiene_floss: boolean
  hygiene_mouthwash: boolean
  hygiene_other: string
}

export type FeedingHistory = {
  breastfeeding_type: "maternal" | "formula" | "mixed" | ""
  breastfeeding_duration: "3months" | "6months" | "1year" | "1.5years" | "2years" | "2.5years" | "3years" | "other" | ""
  breastfeeding_duration_other: string
  solid_food_age: string
  breakfast: string
  mid_morning: string
  lunch: string
  snack: string
  dinner: string
}

export type DietRecord = {
  preferred_foods: {
    cakes: boolean
    cookies: boolean
    flan: boolean
    homemade_sweets: boolean
    condensed_milk: boolean
    excess_sugar: boolean
    pasta: boolean
    gum: boolean
    candy: boolean
    chocolate: boolean
    lollipops: boolean
    sodas: boolean
    juice_boxes: boolean
  }
  weekly_diet: {
    monday: { breakfast: string; mid_morning: string; lunch: string; snack: string }
    tuesday: { breakfast: string; mid_morning: string; lunch: string; snack: string }
    wednesday: { breakfast: string; mid_morning: string; lunch: string; snack: string }
    thursday: { breakfast: string; mid_morning: string; lunch: string; snack: string }
    friday: { breakfast: string; mid_morning: string; lunch: string; snack: string }
  }
}

// ============================================================
// DATABASE SCHEMA
// ============================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: "admin" | "dentista" | "asistente"
          clinic_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role: "admin" | "dentista" | "asistente"
          clinic_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: "admin" | "dentista" | "asistente"
          clinic_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clinics: {
        Row: {
          id: string
          name: string
          slug: string | null
          logo_url: string | null
          primary_color: string
          consent_template: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          logo_url?: string | null
          primary_color?: string
          consent_template?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          logo_url?: string | null
          primary_color?: string
          consent_template?: string | null
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
          secondary_phone: string | null
          birth_date: string | null
          gender: string | null
          marital_status: string | null
          address: string | null
          avatar_url: string | null
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
          secondary_phone?: string | null
          birth_date?: string | null
          gender?: string | null
          marital_status?: string | null
          address?: string | null
          avatar_url?: string | null
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
          secondary_phone?: string | null
          birth_date?: string | null
          gender?: string | null
          marital_status?: string | null
          address?: string | null
          avatar_url?: string | null
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
          clinic_id: string | null
          patient_type: "adulto" | "nino"
          consultation_date: string | null
          reason_of_visit: string[]
          reason_other: string | null
          referred_by: string | null
          // Niño
          weight: number | null
          height: number | null
          guardian_name: string | null
          guardian_phone: string | null
          feeding_history: FeedingHistory | null
          diet_record: DietRecord | null
          // Adulto
          profession: string | null
          civil_status: string | null
          work_address: string | null
          // Compartidos
          extra_oral_exam: ExtraOralExam | null
          intra_oral_exam: IntraOralExam | null
          habits: Habits | null
          medical_history: MedicalHistory | null
          dental_history: DentalHistory | null
          // Odontograma
          odontogram_initial: Json | null
          odontogram_locked: boolean
          // Meta
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          clinic_id?: string | null
          patient_type?: "adulto" | "nino"
          consultation_date?: string | null
          reason_of_visit?: string[]
          reason_other?: string | null
          referred_by?: string | null
          weight?: number | null
          height?: number | null
          guardian_name?: string | null
          guardian_phone?: string | null
          feeding_history?: FeedingHistory | null
          diet_record?: DietRecord | null
          profession?: string | null
          civil_status?: string | null
          work_address?: string | null
          extra_oral_exam?: ExtraOralExam | null
          intra_oral_exam?: IntraOralExam | null
          habits?: Habits | null
          medical_history?: MedicalHistory | null
          dental_history?: DentalHistory | null
          odontogram_initial?: Json | null
          odontogram_locked?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          clinic_id?: string | null
          patient_type?: "adulto" | "nino"
          consultation_date?: string | null
          reason_of_visit?: string[]
          reason_other?: string | null
          referred_by?: string | null
          weight?: number | null
          height?: number | null
          guardian_name?: string | null
          guardian_phone?: string | null
          feeding_history?: FeedingHistory | null
          diet_record?: DietRecord | null
          profession?: string | null
          civil_status?: string | null
          work_address?: string | null
          extra_oral_exam?: ExtraOralExam | null
          intra_oral_exam?: IntraOralExam | null
          habits?: Habits | null
          medical_history?: MedicalHistory | null
          dental_history?: DentalHistory | null
          odontogram_initial?: Json | null
          odontogram_locked?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dental_record_history: {
        Row: {
          id: string
          dental_record_id: string
          patient_id: string
          snapshot: Json
          saved_by: string | null
          saved_by_name: string | null
          saved_at: string
        }
        Insert: {
          id?: string
          dental_record_id: string
          patient_id: string
          snapshot: Json
          saved_by?: string | null
          saved_by_name?: string | null
          saved_at?: string
        }
        Update: {
          id?: string
          dental_record_id?: string
          patient_id?: string
          snapshot?: Json
          saved_by?: string | null
          saved_by_name?: string | null
          saved_at?: string
        }
      }
      consent_signatures: {
        Row: {
          id: string
          patient_id: string
          clinic_id: string | null
          consent_text_snapshot: string
          signed_by_name: string
          signed_by_ci: string | null
          signed_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          clinic_id?: string | null
          consent_text_snapshot: string
          signed_by_name: string
          signed_by_ci?: string | null
          signed_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          clinic_id?: string | null
          consent_text_snapshot?: string
          signed_by_name?: string
          signed_by_ci?: string | null
          signed_at?: string
          created_by?: string | null
        }
      }
      patient_files: {
        Row: {
          id: string
          patient_id: string
          clinic_id: string | null
          file_url: string
          file_name: string
          file_type: "radiografia" | "foto_intraoral" | "foto_extraoral" | "documento" | "otro"
          file_size: number | null
          notes: string | null
          taken_at: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          clinic_id?: string | null
          file_url: string
          file_name: string
          file_type?: "radiografia" | "foto_intraoral" | "foto_extraoral" | "documento" | "otro"
          file_size?: number | null
          notes?: string | null
          taken_at?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          clinic_id?: string | null
          file_url?: string
          file_name?: string
          file_type?: "radiografia" | "foto_intraoral" | "foto_extraoral" | "documento" | "otro"
          file_size?: number | null
          notes?: string | null
          taken_at?: string | null
          uploaded_by?: string | null
          created_at?: string
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
      patient_type: "adulto" | "nino"
      file_type: "radiografia" | "foto_intraoral" | "foto_extraoral" | "documento" | "otro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================
// Utility types
// ============================================================
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
export type Patient = Database["public"]["Tables"]["patients"]["Row"]
export type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"]
export type DentalRecord = Database["public"]["Tables"]["dental_records"]["Row"]
export type DentalRecordHistory = Database["public"]["Tables"]["dental_record_history"]["Row"]
export type ConsentSignature = Database["public"]["Tables"]["consent_signatures"]["Row"]
export type PatientFile = Database["public"]["Tables"]["patient_files"]["Row"]
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

export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"]
export type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"]
export type DentalRecordInsert = Database["public"]["Tables"]["dental_records"]["Insert"]
export type DentalRecordUpdate = Database["public"]["Tables"]["dental_records"]["Update"]
export type PatientFileInsert = Database["public"]["Tables"]["patient_files"]["Insert"]
export type ConsentSignatureInsert = Database["public"]["Tables"]["consent_signatures"]["Insert"]
export type MedicalRecordInsert = Database["public"]["Tables"]["medical_records"]["Insert"]
export type MedicalRecordUpdate = Database["public"]["Tables"]["medical_records"]["Update"]
export type TreatmentInsert = Database["public"]["Tables"]["treatments"]["Insert"]
export type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"]
export type AppointmentUpdate = Database["public"]["Tables"]["appointments"]["Update"]
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"]
export type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"]
export type BudgetItemInsert = Database["public"]["Tables"]["budget_items"]["Insert"]
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"]
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"]
export type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"]
export type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"]
export type MaterialUpdate = Database["public"]["Tables"]["materials"]["Update"]
export type MaterialCategoryInsert = Database["public"]["Tables"]["material_categories"]["Insert"]
export type MaterialSaleInsert = Database["public"]["Tables"]["material_sales"]["Insert"]
export type InventoryMovementInsert = Database["public"]["Tables"]["inventory_movements"]["Insert"]
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"]
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"]
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"]
