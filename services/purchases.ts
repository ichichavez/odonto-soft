import { createBrowserClient } from "@/lib/supabase"

export type Purchase = {
  id: string
  clinic_id: string | null
  branch_id: string | null
  created_by: string | null
  date: string
  supplier: string | null
  notes: string | null
  total: number
  created_at: string
}

export type PurchaseItem = {
  id: string
  purchase_id: string
  material_id: string | null
  description: string
  quantity: number
  unit_cost: number
  total: number
}

export type PurchaseWithItems = Purchase & {
  purchase_items: (PurchaseItem & { materials: { name: string; unit: string } | null })[]
  users: { name: string } | null
}

export type NewPurchaseItem = {
  material_id: string | null
  description: string
  quantity: number
  unit_cost: number
  total: number
}

export const purchaseService = {
  async getAll(branchId?: string | null): Promise<PurchaseWithItems[]> {
    const supabase = createBrowserClient()
    let q = supabase.from("purchases").select(`*, users(name), purchase_items(*, materials(name, unit))`)
    if (branchId) q = q.eq("branch_id", branchId)
    const { data, error } = await q
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
    if (error) throw error
    return data as PurchaseWithItems[]
  },

  async getById(id: string): Promise<PurchaseWithItems> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("purchases")
      .select(`*, users(name), purchase_items(*, materials(name, unit))`)
      .eq("id", id)
      .single()
    if (error) throw error
    return data as PurchaseWithItems
  },

  async getByDateRange(from: string, to: string, branchId?: string | null): Promise<PurchaseWithItems[]> {
    const supabase = createBrowserClient()
    let q = supabase
      .from("purchases")
      .select(`*, users(name), purchase_items(*, materials(name, unit))`)
      .gte("date", from)
      .lte("date", to)
    if (branchId) q = q.eq("branch_id", branchId)
    const { data, error } = await q.order("date", { ascending: false })
    if (error) throw error
    return data as PurchaseWithItems[]
  },

  /** Crea la compra, inserta ítems y registra movimientos de entrada en inventario */
  async create(
    purchase: Omit<Purchase, "id" | "created_at">,
    items: NewPurchaseItem[],
    userId: string,
    branchId?: string | null
  ): Promise<Purchase> {
    const supabase = createBrowserClient()

    // 1. Insertar la compra
    const { data: purchaseData, error: purchaseError } = await supabase
      .from("purchases")
      .insert([{ ...purchase, branch_id: branchId ?? null }])
      .select()
      .single()
    if (purchaseError) throw purchaseError

    const purchaseId = purchaseData.id

    // 2. Insertar ítems
    const itemsToInsert = items.map(item => ({ ...item, purchase_id: purchaseId }))
    const { error: itemsError } = await supabase.from("purchase_items").insert(itemsToInsert)
    if (itemsError) throw itemsError

    // 3. Actualizar stock de cada material con una entrada
    for (const item of items) {
      if (!item.material_id) continue
      try {
        // Obtener stock actual
        const { data: mat } = await supabase
          .from("materials")
          .select("stock_quantity")
          .eq("id", item.material_id)
          .single()

        const previousStock = mat?.stock_quantity ?? 0
        const newStock = previousStock + item.quantity

        // Actualizar el stock
        await supabase
          .from("materials")
          .update({ stock_quantity: newStock })
          .eq("id", item.material_id)

        // Registrar el movimiento de inventario
        await supabase.from("inventory_movements").insert([{
          material_id: item.material_id,
          movement_type: "entrada",
          quantity: item.quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          user_id: userId,
          notes: `Compra #${purchaseId.substring(0, 8)} — ${item.description}`,
        }])
      } catch (err) {
        console.error("Error actualizando stock para material", item.material_id, err)
      }
    }

    return purchaseData as Purchase
  },

  async delete(id: string): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("purchases").delete().eq("id", id)
    if (error) throw error
  },
}
