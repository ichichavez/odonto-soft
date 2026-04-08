import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/api-auth"
import { createServerClient } from "@/lib/supabase"

const PLAN_MRR: Record<string, number> = {
  free: 0,
  pro: 29,
  enterprise: 79,
}

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  const supabase = createServerClient()

  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("*, clinics(name)")
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also include clinics without a subscription row (implicit free)
  const { data: clinics } = await supabase
    .from("clinics")
    .select("id, name, created_at")

  const subsClinicIds = new Set((subs ?? []).map((s) => s.clinic_id))
  const clinicsWithoutSub = (clinics ?? []).filter((c) => !subsClinicIds.has(c.id))

  const result = [
    ...(subs ?? []).map((s: any) => ({
      id: s.id,
      clinic_id: s.clinic_id,
      clinic_name: s.clinics?.name ?? "—",
      plan: s.plan,
      status: s.status,
      stripe_subscription_id: s.stripe_subscription_id,
      stripe_customer_id: s.stripe_customer_id,
      current_period_start: s.current_period_start,
      current_period_end: s.current_period_end,
      cancel_at_period_end: s.cancel_at_period_end,
      updated_at: s.updated_at,
      mrr: PLAN_MRR[s.plan] ?? 0,
    })),
    ...clinicsWithoutSub.map((c) => ({
      id: `implicit-${c.id}`,
      clinic_id: c.id,
      clinic_name: c.name,
      plan: "free",
      status: "trialing",
      stripe_subscription_id: null,
      stripe_customer_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      updated_at: c.created_at,
      mrr: 0,
    })),
  ]

  return NextResponse.json(result)
}
