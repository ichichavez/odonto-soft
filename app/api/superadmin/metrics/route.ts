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

  // All clinics
  const { data: clinics } = await supabase
    .from("clinics")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false })

  const clinicsData = clinics ?? []
  const total_clinics = clinicsData.length
  const active_clinics = clinicsData.filter((c) => c.status === "active").length
  const suspended_clinics = clinicsData.filter((c) => c.status === "suspended").length

  // New clinics this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const new_clinics_this_month = clinicsData.filter(
    (c) => new Date(c.created_at) >= startOfMonth
  ).length

  // All users
  const { count: total_users } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })

  // Subscriptions
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("clinic_id, plan, status, updated_at")

  const subsData = subs ?? []
  const plan_breakdown = {
    free: subsData.filter((s) => s.plan === "free").length,
    pro: subsData.filter((s) => s.plan === "pro").length,
    enterprise: subsData.filter((s) => s.plan === "enterprise").length,
  }

  // Clinics without a subscription row are implicitly 'free'
  const clinicsWithSub = new Set(subsData.map((s) => s.clinic_id))
  const implicitFree = clinicsData.filter((c) => !clinicsWithSub.has(c.id)).length
  plan_breakdown.free += implicitFree

  const mrr = plan_breakdown.pro * 29 + plan_breakdown.enterprise * 79

  // MRR history — last 6 months (current MRR projected back)
  const mrr_history = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return {
      month: d.toLocaleString("es", { month: "short", year: "2-digit" }),
      mrr: i === 5 ? mrr : 0, // Only show real data for current month
    }
  })

  // Recent clinics (latest 5) with user count and plan
  const recentIds = clinicsData.slice(0, 5).map((c) => c.id)

  const { data: userCounts } = await supabase
    .from("users")
    .select("clinic_id")
    .in("clinic_id", recentIds)

  const countByClinic: Record<string, number> = {}
  for (const u of userCounts ?? []) {
    if (u.clinic_id) {
      countByClinic[u.clinic_id] = (countByClinic[u.clinic_id] ?? 0) + 1
    }
  }

  const subsByClinic: Record<string, string> = {}
  for (const s of subsData) {
    subsByClinic[s.clinic_id] = s.plan
  }

  const recent_clinics = clinicsData.slice(0, 5).map((c) => ({
    id: c.id,
    name: c.name,
    plan: subsByClinic[c.id] ?? "free",
    status: c.status ?? "active",
    created_at: c.created_at,
    user_count: countByClinic[c.id] ?? 0,
  }))

  return NextResponse.json({
    total_clinics,
    active_clinics,
    suspended_clinics,
    total_users: total_users ?? 0,
    mrr,
    new_clinics_this_month,
    plan_breakdown,
    mrr_history,
    recent_clinics,
  })
}
