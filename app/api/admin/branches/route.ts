import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-auth"
import { createServerClient } from "@/lib/supabase"
import { checkPlanLimit } from "@/lib/plan-limits"

// GET — lista sucursales de la clínica del admin autenticado
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

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("clinic_id", profile.clinic_id)
    .order("name", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — crear sucursal
export async function POST(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAdmin>>
  try {
    profile = await requireAdmin(request)
  } catch (response) {
    return response as Response
  }

  if (!profile.clinic_id) {
    return NextResponse.json({ error: "El admin no tiene clínica asignada" }, { status: 400 })
  }

  const body = await request.json()
  const { name, address, phone } = body

  if (!name) {
    return NextResponse.json({ error: "El nombre de la sucursal es requerido" }, { status: 400 })
  }

  const supabase = createServerClient()

  // Check plan limit for branches
  const limitCheck = await checkPlanLimit(supabase, profile.clinic_id, "branches")
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: `Límite de sucursales alcanzado (${limitCheck.current}/${limitCheck.limit}) para tu plan` },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from("branches")
    .insert([{ clinic_id: profile.clinic_id, name, address: address ?? null, phone: phone ?? null }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH — actualizar sucursal
export async function PATCH(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAdmin>>
  try {
    profile = await requireAdmin(request)
  } catch (response) {
    return response as Response
  }

  const body = await request.json()
  const { id, name, address, phone, is_active } = body

  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 })
  }

  const supabase = createServerClient()

  // Verificar que la sucursal pertenece a la clínica del admin
  const { data: branch } = await supabase
    .from("branches")
    .select("clinic_id")
    .eq("id", id)
    .single()

  if (!branch || branch.clinic_id !== profile.clinic_id) {
    return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (address !== undefined) updates.address = address
  if (phone !== undefined) updates.phone = phone
  if (is_active !== undefined) updates.is_active = is_active

  const { data, error } = await supabase
    .from("branches")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
