import { createBrowserClient } from "@/lib/supabase"
import type { DentalRecord, DentalRecordInsert, DentalRecordUpdate, DentalRecordHistory } from "@/types/dental"

export const dentalRecordService = {
  // Obtener ficha activa de un paciente (única por paciente)
  async getByPatient(patientId: string): Promise<DentalRecord | null> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("dental_records")
      .select("*")
      .eq("patient_id", patientId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  // Crear o actualizar la ficha (upsert).
  // Antes de actualizar, guarda snapshot en el historial.
  async upsert(
    record: DentalRecordInsert & { patient_id: string },
    savedByName: string,
    savedById?: string
  ): Promise<DentalRecord> {
    const supabase = createBrowserClient()

    // Si ya existe, guardar snapshot antes de actualizar
    const existing = await dentalRecordService.getByPatient(record.patient_id)

    if (existing) {
      // Guardar snapshot histórico
      await supabase.from("dental_record_history").insert({
        dental_record_id: existing.id,
        patient_id: existing.patient_id,
        snapshot: existing as any,
        saved_by: savedById ?? null,
        saved_by_name: savedByName,
      })

      // Si el odontograma inicial ya está bloqueado, no sobreescribirlo
      const updateData: DentalRecordUpdate = {
        ...record,
        updated_at: new Date().toISOString(),
        updated_by: savedById ?? null,
      }
      if (existing.odontogram_locked) {
        delete updateData.odontogram_initial
        delete updateData.odontogram_locked
      }

      const { data, error } = await supabase
        .from("dental_records")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    }

    // Crear nuevo registro
    const { data, error } = await supabase
      .from("dental_records")
      .insert({
        ...record,
        updated_by: savedById ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Bloquear el odontograma inicial (solo se puede hacer una vez)
  async lockOdontogram(patientId: string, odontogramData: any): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("dental_records")
      .update({
        odontogram_initial: odontogramData,
        odontogram_locked: true,
        updated_at: new Date().toISOString(),
      })
      .eq("patient_id", patientId)
      .eq("odontogram_locked", false) // solo si no está bloqueado

    if (error) throw error
  },

  // Obtener historial de cambios
  async getHistory(patientId: string): Promise<DentalRecordHistory[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("dental_record_history")
      .select("*")
      .eq("patient_id", patientId)
      .order("saved_at", { ascending: false })

    if (error) throw error
    return data ?? []
  },

  // Obtener un snapshot específico del historial
  async getHistorySnapshot(historyId: string): Promise<DentalRecordHistory | null> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("dental_record_history")
      .select("*")
      .eq("id", historyId)
      .maybeSingle()

    if (error) throw error
    return data
  },
}
