import { createBrowserClient } from "@/lib/supabase"

export interface Prescription {
  id?: string
  patient_id: string
  clinic_id?: string | null
  created_by?: string | null
  date: string
  prescription_text?: string | null
  instructions_text?: string | null
  signed_by_name: string
  created_at?: string
}

export const prescriptionService = {
  async getByPatient(patientId: string): Promise<Prescription[]> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getById(id: string): Promise<Prescription> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("prescriptions")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  async create(prescription: Omit<Prescription, "id" | "created_at">): Promise<Prescription> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("prescriptions")
      .insert([prescription])
      .select()
      .single()

    if (error) throw error
    return data
  },
}
