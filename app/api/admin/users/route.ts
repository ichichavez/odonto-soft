import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-auth"
import { createServerClient } from "@/lib/supabase"
import { checkPlanLimit } from "@/lib/plan-limits"

// GET — Lista todos los usuarios de la clínica del admin autenticado
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
    .from("users")
    .select("id, name, email, role, branch_id, notification_before_minutes, created_at")
    .eq("clinic_id", profile.clinic_id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — Crea un nuevo usuario en la clínica (requiere service role)
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
  const { name, email, password, role } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "name, email, password y role son requeridos" }, { status: 400 })
  }

  const ALLOWED_ROLES = ["admin", "dentista", "asistente"]
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 400 })
  }

  const supabase = createServerClient()

  // Check plan limit for users
  const limitCheck = await checkPlanLimit(supabase, profile.clinic_id, "users")
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: `Límite de usuarios alcanzado (${limitCheck.current}/${limitCheck.limit}) para tu plan` },
      { status: 403 }
    )
  }

  // 1. Crear el usuario en Supabase Auth (usando service role)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirmar email automáticamente
    user_metadata: { name },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const authUser = authData.user
  if (!authUser) {
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
  }

  // 2. Insertar perfil en public.users con la clínica y rol
  const { error: profileError } = await supabase.from("users").insert({
    id: authUser.id,
    email,
    name,
    role,
    clinic_id: profile.clinic_id,
  })

  if (profileError) {
    // Rollback: eliminar el usuario auth si falla el perfil
    await supabase.auth.admin.deleteUser(authUser.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ id: authUser.id, email, name, role }, { status: 201 })
}

// PATCH — Cambia el rol de un usuario (solo dentro de la misma clínica)
export async function PATCH(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAdmin>>
  try {
    profile = await requireAdmin(request)
  } catch (response) {
    return response as Response
  }

  const body = await request.json()
  const { userId, role, branch_id, notification_before_minutes } = body

  if (!userId) {
    return NextResponse.json({ error: "userId es requerido" }, { status: 400 })
  }

  // Validar role si se proporciona
  if (role !== undefined) {
    const ALLOWED_ROLES = ["admin", "dentista", "asistente"]
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 })
    }
  }

  // Validar notification_before_minutes si se proporciona
  if (notification_before_minutes !== undefined) {
    const mins = Number(notification_before_minutes)
    if (!Number.isInteger(mins) || mins < 1 || mins > 120) {
      return NextResponse.json(
        { error: "notification_before_minutes debe ser entre 1 y 120" },
        { status: 400 }
      )
    }
  }

  const supabase = createServerClient()

  // Verificar que el usuario pertenece a la misma clínica
  const { data: target } = await supabase
    .from("users")
    .select("clinic_id, role")
    .eq("id", userId)
    .single()

  if (!target || target.clinic_id !== profile.clinic_id) {
    return NextResponse.json({ error: "Usuario no encontrado en tu clínica" }, { status: 404 })
  }

  // No permitir cambiar el rol de otro superadmin
  if (target.role === "superadmin") {
    return NextResponse.json({ error: "No se puede modificar un superadmin" }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (role !== undefined) updates.role = role
  if (branch_id !== undefined) updates.branch_id = branch_id
  if (notification_before_minutes !== undefined) updates.notification_before_minutes = notification_before_minutes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
  }

  const { error } = await supabase.from("users").update(updates).eq("id", userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE — Elimina un usuario de la clínica
export async function DELETE(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAdmin>>
  try {
    profile = await requireAdmin(request)
  } catch (response) {
    return response as Response
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })
  if (userId === profile.id) return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 })

  const supabase = createServerClient()

  const { data: target } = await supabase
    .from("users")
    .select("clinic_id, role")
    .eq("id", userId)
    .single()

  if (!target || target.clinic_id !== profile.clinic_id) {
    return NextResponse.json({ error: "Usuario no encontrado en tu clínica" }, { status: 404 })
  }

  if (target.role === "superadmin") {
    return NextResponse.json({ error: "No se puede eliminar un superadmin" }, { status: 403 })
  }

  // Eliminar de Auth (cascadea a public.users por trigger o FK)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
