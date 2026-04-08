import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/api-auth"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  const supabase = createServerClient()

  const { data: clinics, error } = await supabase
    .from("clinics")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get user counts per clinic
  const clinicIds = (clinics ?? []).map((c) => c.id)
  const { data: users } = await supabase
    .from("users")
    .select("clinic_id")
    .in("clinic_id", clinicIds)

  const countByClinic: Record<string, number> = {}
  for (const u of users ?? []) {
    if (u.clinic_id) {
      countByClinic[u.clinic_id] = (countByClinic[u.clinic_id] ?? 0) + 1
    }
  }

  // Get subscriptions
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("clinic_id, plan, status")
    .in("clinic_id", clinicIds)

  const subByClinic: Record<string, { plan: string; status: string }> = {}
  for (const s of subs ?? []) {
    subByClinic[s.clinic_id] = { plan: s.plan, status: s.status }
  }

  const result = (clinics ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status ?? "active",
    created_at: c.created_at,
    plan: subByClinic[c.id]?.plan ?? "free",
    sub_status: subByClinic[c.id]?.status ?? "trialing",
    user_count: countByClinic[c.id] ?? 0,
  }))

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  const supabase = createServerClient()
  const body = await request.json()
  const { clinicId, status, plan } = body

  if (!clinicId) {
    return NextResponse.json({ error: "clinicId requerido" }, { status: 400 })
  }

  // Update clinic status
  if (status) {
    const { error } = await supabase
      .from("clinics")
      .update({ status })
      .eq("id", clinicId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Update subscription plan (upsert)
  if (plan) {
    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        { clinic_id: clinicId, plan, updated_at: new Date().toISOString() },
        { onConflict: "clinic_id" }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
