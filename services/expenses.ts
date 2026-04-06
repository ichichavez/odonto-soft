import { createBrowserClient } from "@/lib/supabase"

export type ExpenseCategory =
  | "material_dental"
  | "equipo"
  | "alquiler"
  | "salario"
  | "servicios"
  | "limpieza"
  | "marketing"
  | "otro"

export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "cheque"

export type Expense = {
  id: string
  clinic_id: string | null
  created_by: string | null
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  payment_method: PaymentMethod
  notes: string | null
  created_at: string
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  material_dental: "Material dental",
  equipo:          "Equipo / Instrumental",
  alquiler:        "Alquiler",
  salario:         "Salarios",
  servicios:       "Servicios (luz, agua, internet…)",
  limpieza:        "Limpieza / Mantenimiento",
  marketing:       "Marketing / Publicidad",
  otro:            "Otro",
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo:      "Efectivo",
  transferencia: "Transferencia",
  tarjeta:       "Tarjeta",
  cheque:        "Cheque",
}

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
    if (error) throw error
    return data as Expense[]
  },

  async getByDateRange(from: string, to: string): Promise<Expense[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false })
    if (error) throw error
    return data as Expense[]
  },

  async create(expense: Omit<Expense, "id" | "created_at">): Promise<Expense> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("expenses")
      .insert([expense])
      .select()
      .single()
    if (error) throw error
    return data as Expense
  },

  async update(id: string, expense: Partial<Omit<Expense, "id" | "created_at">>): Promise<Expense> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("expenses")
      .update(expense)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return data as Expense
  },

  async delete(id: string): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("expenses").delete().eq("id", id)
    if (error) throw error
  },
}
