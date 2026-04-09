import { createBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"]
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"]
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"]

export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"]
export type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"]

export type MaterialSale = Database["public"]["Tables"]["material_sales"]["Row"]
export type MaterialSaleInsert = Database["public"]["Tables"]["material_sales"]["Insert"]

export const invoiceService = {
  // Obtener todas las facturas
  async getAll(branchId?: string | null) {
    const supabase = createBrowserClient()
    let q = supabase
      .from("invoices")
      .select(`
        *,
        patients (id, first_name, last_name),
        budgets (id, number)
      `)
    if (branchId) q = q.eq("branch_id", branchId)
    const { data, error } = await q.order("date", { ascending: false })

    if (error) throw error
    return data
  },

  // Obtener facturas de un paciente (excluye anuladas)
  async getByPatient(patientId: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("invoices")
      .select("id, number, date, total, status")
      .eq("patient_id", patientId)
      .neq("status", "anulada")
      .order("date", { ascending: false })
    if (error) throw error
    return data ?? []
  },

  // Obtener una factura por ID
  async getById(id: string) {
    const supabase = createBrowserClient()

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          patients (id, first_name, last_name, email, phone, address),
          budgets (id, number),
          users (id, name),
          invoice_items (
            id,
            treatment_id,
            description,
            quantity,
            price,
            total,
            treatments (id, name)
          )
        `)
        .eq("id", id)
        .single()

      if (error) throw error

      // Intentar obtener las ventas de materiales asociadas a esta factura
      let materialSales = []
      try {
        const { data: salesData, error: salesError } = await supabase
          .from("material_sales")
          .select(`
            *,
            materials (
              id,
              name,
              unit
            )
          `)
          .eq("invoice_id", id)

        if (!salesError && salesData) {
          materialSales = salesData
        }
      } catch (salesError) {
        console.warn("No se pudieron cargar las ventas de materiales:", salesError)
        // No lanzar error, solo continuar sin las ventas de materiales
      }

      return { ...data, material_sales: materialSales }
    } catch (error) {
      console.error("Error al obtener factura:", error)
      throw error
    }
  },

  // Crear una nueva factura a partir de un presupuesto
  async createFromBudget(budgetId: string, userId: string) {
    const supabase = createBrowserClient()
    // Obtener el presupuesto
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select(`
        *,
        budget_items (*)
      `)
      .eq("id", budgetId)
      .single()

    if (budgetError) throw budgetError

    // Generar número de factura
    const invoiceNumber = await this.generateInvoiceNumber()

    // Calcular fecha de vencimiento (30 días después)
    const dueDate = new Date(budget.date)
    dueDate.setDate(dueDate.getDate() + 30)

    // Crear la factura
    const invoice: InvoiceInsert = {
      number: invoiceNumber,
      budget_id: budgetId,
      patient_id: budget.patient_id,
      created_by: userId,
      date: budget.date,
      due_date: dueDate.toISOString().split("T")[0],
      subtotal: budget.subtotal,
      tax_rate: budget.tax_rate,
      tax_amount: budget.tax_amount,
      total: budget.total,
      status: "pendiente",
      payment_method: "Transferencia bancaria",
      notes: "Factura generada automáticamente a partir del presupuesto.",
    }

    const { data: invoiceData, error: invoiceError } = await supabase.from("invoices").insert([invoice]).select()

    if (invoiceError) throw invoiceError

    const invoiceId = invoiceData[0].id

    // Crear los ítems de la factura a partir de los ítems del presupuesto
    const invoiceItems = budget.budget_items.map((item: any) => ({
      invoice_id: invoiceId,
      treatment_id: item.treatment_id,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    }))

    const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)

    if (itemsError) throw itemsError

    return invoiceData[0]
  },

  // Crear una nueva factura para venta de materiales
  async createForMaterialSale(data: {
    patientId: string
    userId: string
    date: string
    materials: Array<{
      materialId: string
      quantity: number
      costPrice: number
      salePrice: number
      total: number
    }>
    taxRate: number
    notes?: string
    paymentMethod?: string
  }) {
    const supabase = createBrowserClient()

    // Calcular subtotal, impuestos y total
    const subtotal = data.materials.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (data.taxRate / 100)
    const total = subtotal + taxAmount

    // Generar número de factura
    const invoiceNumber = await this.generateInvoiceNumber()

    // Calcular fecha de vencimiento (30 días después)
    const dueDate = new Date(data.date)
    dueDate.setDate(dueDate.getDate() + 30)

    // Crear la factura
    const invoice: InvoiceInsert = {
      number: invoiceNumber,
      budget_id: null,
      patient_id: data.patientId,
      created_by: data.userId,
      date: data.date,
      due_date: dueDate.toISOString().split("T")[0],
      subtotal,
      tax_rate: data.taxRate,
      tax_amount: taxAmount,
      total,
      status: "pendiente",
      payment_method: data.paymentMethod || "Transferencia bancaria",
      notes: data.notes || "Venta de materiales dentales.",
    }

    const { data: invoiceData, error: invoiceError } = await supabase.from("invoices").insert([invoice]).select()

    if (invoiceError) throw invoiceError

    const invoiceId = invoiceData[0].id

    // Crear los registros de venta de materiales
    const materialSales = data.materials.map(
      (item): MaterialSaleInsert => ({
        invoice_id: invoiceId,
        material_id: item.materialId,
        quantity: item.quantity,
        cost_price: item.costPrice,
        sale_price: item.salePrice,
        total: item.total,
      }),
    )

    const { error: salesError } = await supabase.from("material_sales").insert(materialSales)
    if (salesError) throw salesError

    // Registrar los movimientos de salida en el inventario
    for (const item of data.materials) {
      const { error: movementError } = await supabase.from("inventory_movements").insert({
        material_id: item.materialId,
        user_id: data.userId,
        movement_type: "salida",
        quantity: item.quantity,
        notes: `Venta de material - Factura ${invoiceNumber}`,
        reference: invoiceId,
      })

      if (movementError) {
        console.warn("Error al registrar movimiento de inventario:", movementError)
      }
    }

    return invoiceData[0]
  },

  // Crear una nueva factura directamente (sin presupuesto previo)
  async createDirectInvoice(data: {
    patient_id: string
    created_by: string
    date: string
    due_date: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    status: string
    payment_method: string
    notes?: string
    items: Array<{
      type: "treatment" | "material"
      id: string
      description: string
      quantity: number
      price: number
      total: number
      costPrice?: number
      profitPercentage?: number
    }>
  }, branchId?: string | null) {
    const supabase = createBrowserClient()

    try {
      console.log("Creando factura directa con datos:", data)

      // Generar número de factura
      const invoiceNumber = await this.generateInvoiceNumber()
      console.log("Número de factura generado:", invoiceNumber)

      // Crear la factura
      const invoice: InvoiceInsert = {
        number: invoiceNumber,
        budget_id: null,
        patient_id: data.patient_id,
        created_by: data.created_by,
        date: data.date,
        due_date: data.due_date,
        subtotal: data.subtotal,
        tax_rate: data.tax_rate,
        tax_amount: data.tax_amount,
        total: data.total,
        status: data.status,
        payment_method: data.payment_method,
        notes: data.notes || "Factura directa.",
      }

      console.log("Insertando factura:", invoice)
      const { data: invoiceData, error: invoiceError } = await supabase.from("invoices").insert([{ ...invoice, branch_id: branchId ?? null }]).select()

      if (invoiceError) {
        console.error("Error al insertar factura:", invoiceError)
        throw new Error(`Error al insertar factura: ${invoiceError.message}`)
      }

      if (!invoiceData || invoiceData.length === 0) {
        throw new Error("No se recibieron datos de la factura creada")
      }

      const invoiceId = invoiceData[0].id
      console.log("Factura creada con ID:", invoiceId)

      // Separar items por tipo para procesamiento
      const treatmentItems = data.items.filter((item) => item.type === "treatment")
      const materialItems = data.items.filter((item) => item.type === "material")

      // Procesar items de tratamientos
      if (treatmentItems.length > 0) {
        const invoiceItems = treatmentItems.map(
          (item): InvoiceItemInsert => ({
            invoice_id: invoiceId,
            treatment_id: item.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          }),
        )

        console.log("Insertando items de tratamiento:", invoiceItems)
        const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)

        if (itemsError) {
          console.error("Error al insertar items de tratamiento:", itemsError)
          throw new Error(`Error al insertar items de tratamiento: ${itemsError.message}`)
        }
      }

      // Procesar items de materiales
      if (materialItems.length > 0) {
        for (const item of materialItems) {
          try {
            console.log("Procesando material:", item)

            const costPrice = item.costPrice || 0

            // Crear venta de material
            const saleData: MaterialSaleInsert = {
              invoice_id: invoiceId,
              material_id: item.id,
              quantity: item.quantity,
              cost_price: costPrice,
              sale_price: item.price,
              total: item.total,
            }

            console.log("Creando venta de material:", saleData)
            const { error: saleError } = await supabase.from("material_sales").insert(saleData)

            if (saleError) {
              console.error("Error al crear venta de material:", saleError)
              throw new Error(`Error al crear venta de material: ${saleError.message}`)
            }

            // Registrar movimiento de salida
            const { error: movementError } = await supabase.from("inventory_movements").insert({
              material_id: item.id,
              user_id: data.created_by,
              movement_type: "salida",
              quantity: item.quantity,
              notes: `Venta de material - Factura ${invoiceNumber}`,
              reference: invoiceId,
            })

            if (movementError) {
              console.warn("Error al registrar movimiento:", movementError)
            }
          } catch (materialError) {
            console.error("Error al procesar material:", materialError)
            throw new Error(
              `Error al procesar material ${item.description}: ${materialError instanceof Error ? materialError.message : "Error desconocido"}`,
            )
          }
        }
      }

      return invoiceData[0]
    } catch (error) {
      console.error("Error en createDirectInvoice:", error)
      throw error
    }
  },

  // Actualizar una factura
  async update(id: string, invoice: InvoiceUpdate) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("invoices").update(invoice).eq("id", id).select()

    if (error) throw error
    return data[0]
  },

  // Marcar una factura como pagada
  async markAsPaid(id: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("invoices").update({ status: "pagada" }).eq("id", id).select()

    if (error) throw error
    return data[0]
  },

  // Anular una factura
  async cancel(id: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("invoices").update({ status: "anulada" }).eq("id", id).select()

    if (error) throw error
    return data[0]
  },

  // Generar número de factura único
  async generateInvoiceNumber() {
    const supabase = createBrowserClient()

    // Intentar hasta 5 veces para manejar posibles colisiones
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // Obtener el último número de factura
        const { data, error } = await supabase
          .from("invoices")
          .select("number")
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) throw error

        let nextNumber = "F001"

        if (data && data.length > 0) {
          const lastNumber = data[0].number
          // Extraer la parte numérica, asegurándose de que sea un número válido
          const match = lastNumber.match(/F(\d+)/)
          if (match && match[1]) {
            const numericPart = Number.parseInt(match[1], 10)
            if (!isNaN(numericPart)) {
              nextNumber = `F${String(numericPart + 1).padStart(3, "0")}`
            }
          }
        }

        // Verificar que el número generado no exista ya
        const { data: existingInvoice, error: checkError } = await supabase
          .from("invoices")
          .select("id")
          .eq("number", nextNumber)
          .limit(1)

        if (checkError) throw checkError

        // Si no existe, devolver el número
        if (!existingInvoice || existingInvoice.length === 0) {
          return nextNumber
        }

        // Si existe, añadir un sufijo aleatorio para garantizar unicidad
        const randomSuffix = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")
        return `${nextNumber}-${randomSuffix}`
      } catch (error) {
        console.error(`Error al generar número de factura (intento ${attempt + 1}):`, error)
        // En el último intento, lanzar el error
        if (attempt === 4) throw error
      }
    }

    // Si todos los intentos fallan, generar un número con timestamp para garantizar unicidad
    const timestamp = Date.now().toString().slice(-6)
    return `F${timestamp}`
  },
}
