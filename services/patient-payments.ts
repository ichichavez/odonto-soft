import { createBrowserClient } from "@/lib/supabase"

export type PatientPayment = {
  id: string
  patient_id: string
  clinic_id: string | null
  date: string
  amount: number
  method: string
  concept: string | null
  created_by: string | null
  created_at: string
}

export type PatientPaymentInsert = Omit<PatientPayment, "id" | "created_at">

export const PAYMENT_METHODS: Record<string, string> = {
  efectivo:      "Efectivo",
  tarjeta:       "Tarjeta",
  transferencia: "Transferencia",
  cheque:        "Cheque",
  otros:         "Otros",
}

export const patientPaymentService = {
  // Obtener todos los pagos de la clínica (para resumen en el listado)
  async getAll(): Promise<Pick<PatientPayment, "patient_id" | "amount">[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("patient_payments")
      .select("patient_id, amount")
    if (error) throw error
    return data ?? []
  },

  async getByPatient(patientId: string): Promise<PatientPayment[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("patient_payments")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(payment: PatientPaymentInsert): Promise<PatientPayment> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("patient_payments")
      .insert([payment])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("patient_payments").delete().eq("id", id)
    if (error) throw error
  },
}
