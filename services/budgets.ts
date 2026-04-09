import { createBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type Budget = Database["public"]["Tables"]["budgets"]["Row"]
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"]
export type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"]

export type BudgetItem = Database["public"]["Tables"]["budget_items"]["Row"]
export type BudgetItemInsert = Database["public"]["Tables"]["budget_items"]["Insert"]

export const budgetService = {
  // Obtener todos los presupuestos
  async getAll(branchId?: string | null) {
    const supabase = createBrowserClient()
    let q = supabase
      .from("budgets")
      .select(`
        *,
        patients (id, first_name, last_name),
        users (id, name)
      `)
    if (branchId) q = q.eq("branch_id", branchId)
    const { data, error } = await q.order("date", { ascending: false })

    if (error) throw error
    return data
  },

  // Obtener un presupuesto por ID
  async getById(id: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("budgets")
      .select(`
        *,
        patients (id, first_name, last_name, email, phone, address),
        users (id, name),
        budget_items (
          id,
          treatment_id,
          description,
          tooth,
          quantity,
          price,
          total,
          treatments (id, name)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  // Crear un nuevo presupuesto con sus ítems
  async create(budget: BudgetInsert, items: BudgetItemInsert[], branchId?: string | null) {
    const supabase = createBrowserClient()
    // Iniciar una transacción
    const { data: budgetData, error: budgetError } = await supabase
      .from("budgets")
      .insert([{ ...budget, branch_id: branchId ?? null }])
      .select()

    if (budgetError) throw budgetError

    const budgetId = budgetData[0].id

    // Agregar el ID del presupuesto a cada ítem
    const itemsWithBudgetId = items.map((item) => ({
      ...item,
      budget_id: budgetId,
    }))

    const { error: itemsError } = await supabase.from("budget_items").insert(itemsWithBudgetId)

    if (itemsError) throw itemsError

    return budgetData[0]
  },

  // Actualizar un presupuesto
  async update(id: string, budget: BudgetUpdate, items?: BudgetItemInsert[]) {
    const supabase = createBrowserClient()
    // Actualizar el presupuesto
    const { data: budgetData, error: budgetError } = await supabase.from("budgets").update(budget).eq("id", id).select()

    if (budgetError) throw budgetError

    // Si hay ítems para actualizar
    if (items && items.length > 0) {
      // Eliminar los ítems existentes
      const { error: deleteError } = await supabase.from("budget_items").delete().eq("budget_id", id)

      if (deleteError) throw deleteError

      // Agregar los nuevos ítems
      const itemsWithBudgetId = items.map((item) => ({
        ...item,
        budget_id: id,
      }))

      const { error: itemsError } = await supabase.from("budget_items").insert(itemsWithBudgetId)

      if (itemsError) throw itemsError
    }

    return budgetData[0]
  },

  // Eliminar un presupuesto
  async delete(id: string) {
    const supabase = createBrowserClient()
    // Los ítems se eliminarán automáticamente por la restricción ON DELETE CASCADE
    const { error } = await supabase.from("budgets").delete().eq("id", id)

    if (error) throw error
    return true
  },

  // Generar número de presupuesto
  async generateBudgetNumber() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("budgets")
      .select("number")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      const lastNumber = data[0].number
      const numericPart = Number.parseInt(lastNumber.replace("PR", ""))
      return `PR${String(numericPart + 1).padStart(3, "0")}`
    }

    return "PR001"
  },
}
