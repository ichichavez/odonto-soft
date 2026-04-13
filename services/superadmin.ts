"use client"

import { createBrowserClient } from "@/lib/supabase"

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

// ── Metrics ──────────────────────────────────────────────────────────────────

export type SuperadminMetrics = {
  total_clinics: number
  active_clinics: number
  suspended_clinics: number
  total_users: number
  mrr: number
  new_clinics_this_month: number
  plan_breakdown: { free: number; pro: number; enterprise: number }
  mrr_history: { month: string; mrr: number }[]
  recent_clinics: {
    id: string
    name: string
    plan: string
    status: string
    created_at: string
    user_count: number
  }[]
}

export async function fetchMetrics(): Promise<SuperadminMetrics> {
  const headers = await getAuthHeader()
  const res = await fetch("/api/superadmin/metrics", { headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Clinics ───────────────────────────────────────────────────────────────────

export type ClinicRow = {
  id: string
  name: string
  status: string
  created_at: string
  plan: string
  sub_status: string
  user_count: number
}

export async function fetchClinics(): Promise<ClinicRow[]> {
  const headers = await getAuthHeader()
  const res = await fetch("/api/superadmin/clinics", { headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateClinic(
  clinicId: string,
  updates: { status?: string; plan?: string }
) {
  const headers = await getAuthHeader()
  const res = await fetch("/api/superadmin/clinics", {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ clinicId, ...updates }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Users ─────────────────────────────────────────────────────────────────────

export type UserRow = {
  id: string
  name: string
  email: string
  role: string
  clinic_id: string | null
  clinic_name: string | null
  created_at: string
}

export async function fetchUsers(): Promise<UserRow[]> {
  const headers = await getAuthHeader()
  const res = await fetch("/api/superadmin/users", { headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateUser(
  userId: string,
  updates: { role?: string; active?: boolean }
) {
  const headers = await getAuthHeader()
  const res = await fetch("/api/superadmin/users", {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...updates }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export type SubscriptionRow = {
  id: string
  clinic_id: string
  clinic_name: string
  plan: string
  status: string
  dlocal_order_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  updated_at: string
  mrr: number
}

export async function fetchSubscriptions(): Promise<SubscriptionRow[]> {
  const headers = await getAuthHeader()
  const res = await fetch("/api/superadmin/subscriptions", { headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── dLocalGo Checkout ─────────────────────────────────────────────────────────

export async function createCheckoutSession(clinicId: string, plan: string): Promise<string> {
  const headers = await getAuthHeader()
  const res = await fetch("/api/dlocal/checkout", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ clinicId, plan }),
  })
  if (!res.ok) throw new Error(await res.text())
  const { url, error } = await res.json()
  if (error) throw new Error(error)
  return url
}
