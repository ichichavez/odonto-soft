import { createBrowserClient } from "@/lib/supabase"

export type Branch = {
  id: string
  clinic_id: string
  name: string
  address: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

export const branchService = {
  async getByClinic(clinicId: string): Promise<Branch[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("name", { ascending: true })
    if (error) throw error
    return data as Branch[]
  },

  async create(data: { clinic_id: string; name: string; address?: string; phone?: string }): Promise<Branch> {
    const supabase = createBrowserClient()
    const { data: result, error } = await supabase
      .from("branches")
      .insert([data])
      .select()
      .single()
    if (error) throw error
    return result as Branch
  },

  async update(id: string, data: Partial<Pick<Branch, "name" | "address" | "phone" | "is_active">>): Promise<Branch> {
    const supabase = createBrowserClient()
    const { data: result, error } = await supabase
      .from("branches")
      .update(data)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return result as Branch
  },

  async setActive(id: string, is_active: boolean): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("branches").update({ is_active }).eq("id", id)
    if (error) throw error
  },
}
