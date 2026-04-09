import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { createServerClient } from "@/lib/supabase"
import { getClinicPlan, PLAN_LIMITS } from "@/lib/plan-limits"

export async function GET(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAuth>>
  try {
    profile = await requireAuth(request)
  } catch (response) {
    return response as Response
  }

  if (!profile.clinic_id) {
    return NextResponse.json({ error: "Sin clínica asignada" }, { status: 400 })
  }

  const supabase = createServerClient()
  const clinicId = profile.clinic_id

  const plan = await getClinicPlan(supabase, clinicId)
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial

  const [{ count: patients }, { count: users }, { count: branches }] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("clinic_id", clinicId),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("clinic_id", clinicId),
    supabase.from("branches").select("*", { count: "exact", head: true }).eq("clinic_id", clinicId),
  ])

  // Fetch subscription status separately
  const { data: sub } = await (supabase as any)
    .from("subscriptions")
    .select("status")
    .eq("clinic_id", clinicId)
    .single()

  return NextResponse.json({
    plan,
    status: sub?.status ?? "trialing",
    limits: {
      patients: limits.patients,
      users:    limits.users,
      branches: limits.branches,
    },
    usage: {
      patients: patients ?? 0,
      users:    users    ?? 0,
      branches: branches ?? 0,
    },
  })
}
