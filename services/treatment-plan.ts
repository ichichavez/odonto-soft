import { createBrowserClient } from "@/lib/supabase"

export interface TreatmentPlanItem {
  id: string
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

  // Trae todos los ítems con datos del paciente (para reporte de saldos)
  async getAllWithPatients(): Promise<any[]> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("treatment_plan_items")
      .select("patient_id, date, cost, payment, patients(id, first_name, last_name, ci, phone)")
      .order("date", { ascending: false })
    if (error) throw error
    return data ?? []
  },

  // Sincroniza los ítems del paciente preservando IDs para no perder pagos asociados.
  // Items con ID → UPDATE (no toca el campo payment, lo gestiona el trigger).
  // Items sin ID → INSERT.
  // Items en DB que ya no están en el form → DELETE (si falla por FK RESTRICT = tiene pagos → se ignora silenciosamente).
  // Retorna la lista actualizada con IDs.
  async upsertItems(
    patientId: string,
    items: Array<Partial<TreatmentPlanItem> & { patient_id: string; description: string; cost: number; payment: number; date: string }>,
  ): Promise<TreatmentPlanItem[]> {
    const supabase = createBrowserClient()

    // 1. Obtener IDs actuales en DB
    const { data: dbItems, error: fetchError } = await (supabase as any)
      .from("treatment_plan_items")
      .select("id")
      .eq("patient_id", patientId)
    if (fetchError) throw fetchError

    const dbIds = new Set<string>((dbItems ?? []).map((r: any) => r.id as string))
    const formIds = new Set<string>(items.filter((i) => i.id).map((i) => i.id as string))

    // 2. UPDATE los que ya tienen ID
    for (const item of items.filter((i) => i.id)) {
      const { error } = await (supabase as any)
        .from("treatment_plan_items")
        .update({
          date:        item.date,
          tooth:       item.tooth ?? null,
          description: item.description,
          cost:        item.cost,
          notes:       item.notes ?? null,
        })
        .eq("id", item.id)
      if (error) throw error
    }

    // 3. INSERT los nuevos (sin ID)
    const toInsert = items
      .filter((i) => !i.id)
      .map((i) => ({
        patient_id:  patientId,
        clinic_id:   i.clinic_id ?? null,
        created_by:  i.created_by ?? null,
        date:        i.date,
        tooth:       i.tooth ?? null,
        description: i.description,
        cost:        i.cost,
        payment:     0,
        notes:       i.notes ?? null,
      }))

    if (toInsert.length > 0) {
      const { error } = await (supabase as any)
        .from("treatment_plan_items")
        .insert(toInsert)
      if (error) throw error
    }

    // 4. DELETE los que ya no están en el form (ignorar error FK RESTRICT = tienen pagos)
    const toDelete = [...dbIds].filter((id) => !formIds.has(id))
    for (const id of toDelete) {
      await (supabase as any)
        .from("treatment_plan_items")
        .delete()
        .eq("id", id)
      // No lanzar error — puede fallar por FK RESTRICT si el item tiene pagos
    }

    // 5. Retornar lista actualizada
    const { data: updated, error: fetchUpdated } = await (supabase as any)
      .from("treatment_plan_items")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: true })
    if (fetchUpdated) throw fetchUpdated
    return updated ?? []
  },
}
