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
  const clinicIds = ((clinics ?? []) as any[]).map((c: any) => c.id)
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

  // Get subscriptions (table not in generated types yet)
  const { data: subs } = await (supabase as any)
    .from("subscriptions")
    .select("clinic_id, plan, status, billing_type, current_period_end")
    .in("clinic_id", clinicIds)

  const subByClinic: Record<string, { plan: string; status: string; billing_type: string; current_period_end: string | null }> = {}
  for (const s of (subs ?? []) as any[]) {
    subByClinic[s.clinic_id] = {
      plan: s.plan,
      status: s.status,
      billing_type: s.billing_type ?? "automatic",
      current_period_end: s.current_period_end ?? null,
    }
  }

  const result = ((clinics ?? []) as any[]).map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status ?? "active",
    created_at: c.created_at,
    plan: subByClinic[c.id]?.plan ?? "free",
    sub_status: subByClinic[c.id]?.status ?? "trialing",
    billing_type: subByClinic[c.id]?.billing_type ?? "automatic",
    expires_at: subByClinic[c.id]?.current_period_end ?? null,
    user_count: countByClinic[c.id] ?? 0,
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  const supabase = createServerClient()
  const body = await request.json()
  const { clinicName, adminName, adminEmail, adminPassword, plan, expiresAt } = body

  if (!clinicName || !adminName || !adminEmail || !adminPassword || !plan) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  let authUserId: string | null = null

  try {
    // 1. Insert clinic
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .insert({
        name: clinicName,
        primary_color: "#10b981",
        currency: "PYG",
        tax_rate: 10,
        status: "active",
      } as any)
      .select("id")
      .single()

    if (clinicError || !clinic) {
      return NextResponse.json({ error: clinicError?.message ?? "Error creando clínica" }, { status: 500 })
    }

    const clinicId = (clinic as any).id

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: adminName },
    })

    if (authError || !authData.user) {
      // Rollback: delete clinic
      await supabase.from("clinics").delete().eq("id", clinicId)
      return NextResponse.json({ error: authError?.message ?? "Error creando usuario" }, { status: 500 })
    }

    authUserId = authData.user.id

    // 3. Insert user profile
    const { error: userError } = await supabase.from("users").insert({
      id: authUserId,
      email: adminEmail,
      name: adminName,
      role: "admin",
      clinic_id: clinicId,
    })

    if (userError) {
      // Rollback: delete auth user and clinic
      await supabase.auth.admin.deleteUser(authUserId)
      await supabase.from("clinics").delete().eq("id", clinicId)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // 4. Insert subscription
    const { error: subError } = await (supabase as any).from("subscriptions").insert({
      clinic_id: clinicId,
      plan,
      status: "active",
      billing_type: "manual",
      current_period_end: expiresAt ?? null,
    })

    if (subError) {
      // Rollback
      await supabase.auth.admin.deleteUser(authUserId)
      await supabase.from("users").delete().eq("id", authUserId)
      await supabase.from("clinics").delete().eq("id", clinicId)
      return NextResponse.json({ error: subError.message }, { status: 500 })
    }

    return NextResponse.json({ clinic_id: clinicId, user_id: authUserId }, { status: 201 })
  } catch (err: any) {
    // Best-effort rollback
    if (authUserId) {
      await supabase.auth.admin.deleteUser(authUserId).catch(() => {})
    }
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  const supabase = createServerClient()
  const body = await request.json()
  const { clinicId, status, plan, billing_type, expiresAt } = body

  if (!clinicId) {
    return NextResponse.json({ error: "clinicId requerido" }, { status: 400 })
  }

  // Update clinic status
  if (status) {
    const { error } = await supabase
      .from("clinics")
      .update({ status } as any)
      .eq("id", clinicId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Update subscription fields (upsert)
  const subUpdates: Record<string, any> = { clinic_id: clinicId, updated_at: new Date().toISOString() }
  if (plan) subUpdates.plan = plan
  if (billing_type) subUpdates.billing_type = billing_type
  if (expiresAt !== undefined) subUpdates.current_period_end = expiresAt

  if (plan || billing_type || expiresAt !== undefined) {
    const { error } = await (supabase as any)
      .from("subscriptions")
      .upsert(subUpdates, { onConflict: "clinic_id" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
