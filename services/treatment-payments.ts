import { createBrowserClient } from "@/lib/supabase"
import type { TreatmentPlanItem } from "@/services/treatment-plan"

export interface TreatmentPayment {
  id: string
  patient_id: string
  clinic_id: string
  treatment_plan_item_id: string | null
  receipt_number: string
  date: string
  amount: number
  method: string
  concept: string | null
  created_by: string | null
  created_at: string
}

export interface ReceiptData {
  receipt_number: string
  date: string
  patient_name: string
  treatment_description: string
  tooth: string | null
  treatment_cost: number
  amount_this_payment: number
  total_paid_before: number
  total_paid_after: number
  remaining: number
  method: string
  concept: string | null
}

export const treatmentPaymentService = {
  async getByPatient(patientId: string): Promise<TreatmentPayment[]> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("treatment_payments")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getByItem(itemId: string): Promise<TreatmentPayment[]> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("treatment_payments")
      .select("*")
      .eq("treatment_plan_item_id", itemId)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async generateReceiptNumber(clinicId: string): Promise<string> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("treatment_payments")
      .select("receipt_number")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    // Extrae el número más alto de los recibos existentes (formato REC-NNN)
    let maxNum = 0
    for (const row of data ?? []) {
      const match = String(row.receipt_number).match(/(\d+)$/)
      if (match) {
        const n = parseInt(match[1], 10)
        if (n > maxNum) maxNum = n
      }
    }

    const next = maxNum + 1
    return `REC-${String(next).padStart(3, "0")}`
  },

  async create(data: {
    patient_id: string
    clinic_id: string
    treatment_plan_item_id: string | null
    date: string
    amount: number
    method: string
    concept: string | null
    created_by: string | null
  }): Promise<TreatmentPayment> {
    const supabase = createBrowserClient()
    const receipt_number = await this.generateReceiptNumber(data.clinic_id)

    const { data: row, error } = await (supabase as any)
      .from("treatment_payments")
      .insert({ ...data, receipt_number })
      .select()
      .single()

    if (error) throw error
    return row as TreatmentPayment
  },

  async delete(id: string): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await (supabase as any)
      .from("treatment_payments")
      .delete()
      .eq("id", id)

    if (error) throw error
  },

  /**
   * Construye ReceiptData para mostrar/imprimir el recibo.
   * allItemPayments debe estar ordenado por date ASC, created_at ASC.
   */
  buildReceiptData(
    payment: TreatmentPayment,
    item: TreatmentPlanItem,
    allItemPayments: TreatmentPayment[],
    patientName: string,
  ): ReceiptData {
    // Pagos anteriores = todos los pagos antes de éste (por created_at)
    const idx = allItemPayments.findIndex((p) => p.id === payment.id)
    const before = idx > 0 ? allItemPayments.slice(0, idx) : []
    const total_paid_before = before.reduce((s, p) => s + p.amount, 0)
    const total_paid_after = total_paid_before + payment.amount
    const remaining = Math.max(0, item.cost - total_paid_after)

    return {
      receipt_number: payment.receipt_number,
      date: payment.date,
      patient_name: patientName,
      treatment_description: item.description,
      tooth: item.tooth ?? null,
      treatment_cost: item.cost,
      amount_this_payment: payment.amount,
      total_paid_before,
      total_paid_after,
      remaining,
      method: payment.method,
      concept: payment.concept,
    }
  },
}
