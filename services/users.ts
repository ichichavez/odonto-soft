import { createBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type User = Database["public"]["Tables"]["users"]["Row"]
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"]
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"]

export const userService = {
  // Obtener todos los usuarios
  async getAll() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("users").select("*").order("name", { ascending: true })

    if (error) throw error
    return data
  },

  // Obtener un usuario por ID
  async getById(id: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },

  // Obtener solo dentistas
  async getDentists() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .in("role", ["dentista", "admin"])
      .order("name", { ascending: true })

    if (error) throw error
    return data
  },

  // Crear un nuevo usuario
  async create(user: UserInsert) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("users").insert([user]).select().single()

    if (error) throw error
    return data
  },

  // Actualizar un usuario
  async update(id: string, user: UserUpdate) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("users").update(user).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  // Eliminar un usuario
  async delete(id: string) {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) throw error
    return true
  },
}
