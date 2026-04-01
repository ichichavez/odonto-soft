import { createBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type MaterialCategory = Database["public"]["Tables"]["material_categories"]["Row"]
export type MaterialCategoryInsert = Database["public"]["Tables"]["material_categories"]["Insert"]
export type MaterialCategoryUpdate = Database["public"]["Tables"]["material_categories"]["Update"]

export type Material = Database["public"]["Tables"]["materials"]["Row"]
export type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"]
export type MaterialUpdate = Database["public"]["Tables"]["materials"]["Update"]

export type InventoryMovement = Database["public"]["Tables"]["inventory_movements"]["Row"]
export type InventoryMovementInsert = Database["public"]["Tables"]["inventory_movements"]["Insert"]

export type TreatmentMaterial = Database["public"]["Tables"]["treatment_materials"]["Row"]
export type TreatmentMaterialInsert = Database["public"]["Tables"]["treatment_materials"]["Insert"]
export type TreatmentMaterialUpdate = Database["public"]["Tables"]["treatment_materials"]["Update"]

export type MaterialSale = Database["public"]["Tables"]["material_sales"]["Row"]
export type MaterialSaleInsert = Database["public"]["Tables"]["material_sales"]["Insert"]
export type MaterialSaleUpdate = Database["public"]["Tables"]["material_sales"]["Update"]

export const inventoryService = {
  // Categorías de materiales
  categories: {
    async getAll() {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("material_categories").select("*").order("name", { ascending: true })

      if (error) throw error
      return data
    },

    async getById(id: string) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("material_categories").select("*").eq("id", id).single()

      if (error) throw error
      return data
    },

    async create(category: MaterialCategoryInsert) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("material_categories").insert([category]).select().single()

      if (error) throw error
      return data
    },

    async update(id: string, category: MaterialCategoryUpdate) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("material_categories").update(category).eq("id", id).select().single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("material_categories").delete().eq("id", id)

      if (error) throw error
      return true
    },
  },

  // Materiales
  materials: {
    async getAll() {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("materials")
        .select(`
          *,
          material_categories (id, name)
        `)
        .order("name", { ascending: true })

      if (error) throw error
      return data
    },

    async getById(id: string) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("materials")
        .select(`
          *,
          material_categories (id, name)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },

    async getLowStock() {
      const supabase = createBrowserClient()

      // Primero obtenemos todos los materiales
      const { data: allMaterials, error } = await supabase
        .from("materials")
        .select(`
          *,
          material_categories (id, name)
        `)
        .order("name", { ascending: true })

      if (error) throw error

      // Filtramos en el cliente los que tienen stock bajo
      const lowStockMaterials = allMaterials.filter(
        (material) => material.stock_quantity <= (material.min_stock_quantity || 0),
      )

      return lowStockMaterials
    },

    async create(material: MaterialInsert) {
      const supabase = createBrowserClient()

      // Calcular el precio de venta basado en el costo y el porcentaje de ganancia
      if (material.cost_price && material.profit_percentage) {
        material.price = material.cost_price * (1 + material.profit_percentage / 100)
      }

      const { data, error } = await supabase.from("materials").insert([material]).select().single()

      if (error) throw error
      return data
    },

    async update(id: string, material: MaterialUpdate) {
      const supabase = createBrowserClient()

      // Calcular el precio de venta basado en el costo y el porcentaje de ganancia
      if (material.cost_price !== undefined && material.profit_percentage !== undefined) {
        material.price = material.cost_price * (1 + material.profit_percentage / 100)
      }

      const { data, error } = await supabase.from("materials").update(material).eq("id", id).select().single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("materials").delete().eq("id", id)

      if (error) throw error
      return true
    },
  },

  // Movimientos de inventario
  movements: {
    async getAll() {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("inventory_movements")
        .select(`
          *,
          materials (id, name, unit),
          users (id, name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },

    async getByMaterialId(materialId: string) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("inventory_movements")
        .select(`
          *,
          materials (id, name, unit),
          users (id, name)
        `)
        .eq("material_id", materialId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },

    async create(movement: Omit<InventoryMovementInsert, "previous_stock" | "new_stock">) {
      const supabase = createBrowserClient()

      // Obtener el stock actual del material
      const { data: material, error: materialError } = await supabase
        .from("materials")
        .select("stock_quantity")
        .eq("id", movement.material_id)
        .single()

      if (materialError) throw materialError

      const previousStock = material.stock_quantity
      let newStock = previousStock

      // Calcular el nuevo stock según el tipo de movimiento
      if (movement.movement_type === "entrada") {
        newStock = previousStock + movement.quantity
      } else if (movement.movement_type === "salida") {
        newStock = previousStock - movement.quantity
      } else if (movement.movement_type === "ajuste") {
        newStock = movement.quantity // En ajuste, quantity es el nuevo valor del stock
      }

      // Crear el movimiento con los valores de stock calculados
      const completeMovement: InventoryMovementInsert = {
        ...movement,
        previous_stock: previousStock,
        new_stock: newStock,
      }

      const { data, error } = await supabase.from("inventory_movements").insert([completeMovement]).select().single()

      if (error) throw error
      return data
    },
  },

  // Relación entre tratamientos y materiales
  treatmentMaterials: {
    async getByTreatmentId(treatmentId: string) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("treatment_materials")
        .select(`
          *,
          materials (id, name, unit, price)
        `)
        .eq("treatment_id", treatmentId)

      if (error) throw error
      return data
    },

    async create(treatmentMaterial: TreatmentMaterialInsert) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("treatment_materials").insert([treatmentMaterial]).select().single()

      if (error) throw error
      return data
    },

    async update(id: string, treatmentMaterial: TreatmentMaterialUpdate) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("treatment_materials")
        .update(treatmentMaterial)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("treatment_materials").delete().eq("id", id)

      if (error) throw error
      return true
    },

    async deleteByTreatmentId(treatmentId: string) {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("treatment_materials").delete().eq("treatment_id", treatmentId)

      if (error) throw error
      return true
    },
  },

  // Ventas de materiales
  sales: {
    async getByInvoiceId(invoiceId: string) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("material_sales")
        .select(`
          *,
          materials (id, name, unit)
        `)
        .eq("invoice_id", invoiceId)

      if (error) throw error
      return data
    },

    async create(sale: MaterialSaleInsert) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("material_sales").insert([sale]).select().single()

      if (error) throw error
      return data
    },

    async createBulk(sales: MaterialSaleInsert[]) {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("material_sales").insert(sales).select()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("material_sales").delete().eq("id", id)

      if (error) throw error
      return true
    },
  },
}
