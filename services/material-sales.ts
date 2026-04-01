import { createClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

type MaterialSale = Database["public"]["Tables"]["material_sales"]["Row"]
type MaterialSaleInsert = Database["public"]["Tables"]["material_sales"]["Insert"]
type MaterialSaleUpdate = Database["public"]["Tables"]["material_sales"]["Update"]

export async function createMaterialSale(materialSale: MaterialSaleInsert) {
  const supabase = createClient()

  const { data, error } = await supabase.from("material_sales").insert(materialSale).select().single()

  if (error) {
    throw new Error(`Error al crear la venta de material: ${error.message}`)
  }

  return data
}

export async function getMaterialSalesByInvoiceId(invoiceId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("material_sales")
    .select(`
      *,
      materials (
        id,
        name,
        unit
      )
    `)
    .eq("invoice_id", invoiceId)

  if (error) {
    throw new Error(`Error al obtener las ventas de materiales: ${error.message}`)
  }

  return data
}

export async function getMaterialSaleById(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("material_sales")
    .select(`
      *,
      materials (
        id,
        name,
        description,
        unit,
        price,
        cost_price,
        profit_percentage
      ),
      invoices (
        id,
        number,
        date,
        patient_id,
        patients (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(`Error al obtener la venta de material: ${error.message}`)
  }

  return data
}

export async function updateMaterialSale(id: string, materialSale: MaterialSaleUpdate) {
  const supabase = createClient()

  const { data, error } = await supabase.from("material_sales").update(materialSale).eq("id", id).select().single()

  if (error) {
    throw new Error(`Error al actualizar la venta de material: ${error.message}`)
  }

  return data
}

export async function deleteMaterialSale(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("material_sales").delete().eq("id", id)

  if (error) {
    throw new Error(`Error al eliminar la venta de material: ${error.message}`)
  }

  return true
}
