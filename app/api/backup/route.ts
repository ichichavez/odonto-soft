import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-auth"
import { createServerClient } from "@/lib/supabase"

/**
 * GET /api/backup
 * Returns all clinic data as JSON for the requesting admin's clinic.
 * The client converts this JSON to Excel or SQL.
 */
export async function GET(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAdmin>>
  try {
    profile = await requireAdmin(request)
  } catch (response) {
    return response as Response
  }

  if (!profile.clinic_id) {
    return NextResponse.json({ error: "El admin no tiene clínica asignada" }, { status: 400 })
  }

  const clinicId = profile.clinic_id
  const supabase = createServerClient()

  const [
    { data: patients },
    { data: appointments },
    { data: invoices },
    { data: invoice_items },
    { data: budgets },
    { data: budget_items },
    { data: treatments },
    { data: purchases },
    { data: purchase_items },
    { data: expenses },
    { data: inventory },
    { data: treatment_plan_items },
    { data: users },
  ] = await Promise.all([
    supabase.from("patients").select("*").eq("clinic_id", clinicId).order("created_at"),
    supabase.from("appointments").select("*").eq("clinic_id", clinicId).order("date"),
    supabase.from("invoices").select("*").eq("clinic_id", clinicId).order("created_at"),
    supabase.from("invoice_items").select("*").order("id"),
    supabase.from("budgets").select("*").eq("clinic_id", clinicId).order("created_at"),
    supabase.from("budget_items").select("*").order("id"),
    supabase.from("treatments").select("*").eq("clinic_id", clinicId).order("created_at"),
    supabase.from("purchases").select("*").eq("clinic_id", clinicId).order("date"),
    supabase.from("purchase_items").select("*").order("id"),
    supabase.from("expenses").select("*").eq("clinic_id", clinicId).order("date"),
    supabase.from("inventory").select("*").eq("clinic_id", clinicId).order("name"),
    supabase.from("treatment_plan_items").select("*").eq("clinic_id", clinicId).order("date"),
    supabase.from("users").select("id, name, email, role, created_at").eq("clinic_id", clinicId),
  ])

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    clinic_id: clinicId,
    tables: {
      patients: patients ?? [],
      appointments: appointments ?? [],
      invoices: invoices ?? [],
      invoice_items: invoice_items ?? [],
      budgets: budgets ?? [],
      budget_items: budget_items ?? [],
      treatments: treatments ?? [],
      purchases: purchases ?? [],
      purchase_items: purchase_items ?? [],
      expenses: expenses ?? [],
      inventory: inventory ?? [],
      treatment_plan_items: treatment_plan_items ?? [],
      users: users ?? [],
    },
  })
}
