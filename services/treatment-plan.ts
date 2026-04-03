import { createBrowserClient } from "@/lib/supabase"

export interface TreatmentPlanItem {
  id?: string
  patient_id: string
  clinic_id?: string | null
  created_by?: string | null
  date: string
  tooth?: string | null
  description: string
  cost: number
  payment: number
  notes?: string | null
  created_at?: string
}

export const treatmentPlanService = {
  async getByPatient(patientId: string): Promise<TreatmentPlanItem[]> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("treatment_plan_items")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: true })

    if (error) throw error
    return data ?? []
  },

  // Reemplaza todos los ítems del paciente con los nuevos (delete + insert)
  async upsertItems(patientId: string, items: Omit<TreatmentPlanItem, "id" | "created_at">[]): Promise<void> {
    const supabase = createBrowserClient()

    const { error: deleteError } = await (supabase as any)
      .from("treatment_plan_items")
      .delete()
      .eq("patient_id", patientId)

    if (deleteError) throw deleteError

    if (items.length === 0) return

    const rows = items.map((item) => ({ ...item, patient_id: patientId }))

    const { error: insertError } = await (supabase as any)
      .from("treatment_plan_items")
      .insert(rows)

    if (insertError) throw insertError
  },
}
