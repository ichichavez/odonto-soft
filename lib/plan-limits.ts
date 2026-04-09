import type { SupabaseClient } from "@supabase/supabase-js"

// ── Plan limits definition ─────────────────────────────────────────────────

type Resource = "patients" | "users" | "branches"

interface PlanLimit {
  patients: number | null
  users: number | null
  branches: number | null
}

export const PLAN_LIMITS: Record<string, PlanLimit> = {
  trial:       { patients: 10,   users: 2,    branches: 1    },
  basico:      { patients: 300,  users: 3,    branches: 2    },
  pro:         { patients: 2000, users: 20,   branches: 5    },
  empresarial: { patients: null, users: null, branches: null },
}

// ── Helpers ────────────────────────────────────────────────────────────────

export async function getClinicPlan(supabase: SupabaseClient, clinicId: string): Promise<string> {
  const { data } = await (supabase as any)
    .from("subscriptions")
    .select("plan")
    .eq("clinic_id", clinicId)
    .single()

  return data?.plan ?? "trial"
}

export async function checkPlanLimit(
  supabase: SupabaseClient,
  clinicId: string,
  resource: Resource
): Promise<{ allowed: boolean; current: number; limit: number | null }> {
  const plan = await getClinicPlan(supabase, clinicId)
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial
  const limit = limits[resource]

  const tableMap: Record<Resource, string> = {
    patients: "patients",
    users:    "users",
    branches: "branches",
  }

  const { count } = await supabase
    .from(tableMap[resource])
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)

  const current = count ?? 0

  if (limit === null) return { allowed: true, current, limit: null }
  return { allowed: current < limit, current, limit }
}
