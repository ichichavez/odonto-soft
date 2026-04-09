import { createBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type Treatment = Database["public"]["Tables"]["treatments"]["Row"]
export type TreatmentInsert = Database["public"]["Tables"]["treatments"]["Insert"]
export type TreatmentUpdate = Database["public"]["Tables"]["treatments"]["Update"]

export const treatmentService = {
  // Obtener todos los tratamientos
  async getAll(branchId?: string | null) {
    const supabase = createBrowserClient()
    let q = supabase.from("treatments").select("*")
    if (branchId) q = q.eq("branch_id", branchId)
    const { data, error } = await q.order("name", { ascending: true })

    if (error) throw error
    return data
  },

  // Obtener un tratamiento por ID
  async getById(id: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("treatments").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },

  // Crear un nuevo tratamiento
  async create(treatment: TreatmentInsert, branchId?: string | null) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("treatments")
      .insert([{ ...treatment, branch_id: branchId ?? null }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Actualizar un tratamiento
  async update(id: string, treatment: TreatmentUpdate) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("treatments").update(treatment).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  // Eliminar un tratamiento
  async delete(id: string) {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("treatments").delete().eq("id", id)

    if (error) throw error
    return true
  },
}
