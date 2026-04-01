import { createBrowserClient } from "@/lib/supabase"
import type { ConsentSignature, ConsentSignatureInsert } from "@/types/database"

export const consentService = {
  // Obtener todas las firmas de un paciente (más reciente primero)
  async getByPatient(patientId: string): Promise<ConsentSignature[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("consent_signatures")
      .select("*")
      .eq("patient_id", patientId)
      .order("signed_at", { ascending: false })

    if (error) throw error
    return data ?? []
  },

  // Registrar firma de consentimiento (snapshot inmutable del texto)
  async sign(
    signature: Omit<ConsentSignatureInsert, "signed_at">
  ): Promise<ConsentSignature> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("consent_signatures")
      .insert({ ...signature, signed_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
