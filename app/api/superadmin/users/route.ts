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

  // Get all users from public.users (sin email — está en auth.users)
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, role, clinic_id, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Obtener emails desde auth.users vía admin API
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const au of authList?.users ?? []) {
    emailMap[au.id] = au.email ?? ""
  }

  // Get clinic names
  const clinicIds = [...new Set((users ?? []).map((u) => u.clinic_id).filter(Boolean))]
  const { data: clinics } = await supabase
    .from("clinics")
    .select("id, name")
    .in("id", clinicIds as string[])

  const clinicMap: Record<string, string> = {}
  for (const c of clinics ?? []) {
    clinicMap[c.id] = c.name
  }

  const result = (users ?? []).map((u) => ({
    id: u.id,
    name: u.name ?? emailMap[u.id] ?? "—",
    email: emailMap[u.id] ?? "—",
    role: u.role ?? "asistente",
    clinic_id: u.clinic_id,
    clinic_name: u.clinic_id ? (clinicMap[u.clinic_id] ?? "—") : null,
    created_at: u.created_at,
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
  const { userId, role } = body

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (role) updates.role = role

  const { error } = await supabase.from("users").update(updates).eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
