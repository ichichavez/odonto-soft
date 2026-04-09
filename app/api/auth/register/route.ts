import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

const ALLOWED_PLANS = ["basico", "pro", "empresarial"]

export async function POST(request: Request) {
  const body = await request.json()
  const { name, clinicName, email, password, plan = "basico" } = body

  if (!name || !clinicName || !email || !password) {
    return NextResponse.json(
      { error: "Todos los campos son requeridos" },
      { status: 400 }
    )
  }

  if (!ALLOWED_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Plan no válido" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (authError) {
    const msg = authError.message.includes("already registered")
      ? "Ya existe una cuenta con ese correo electrónico"
      : authError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const authUser = authData.user
  if (!authUser) {
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
  }

  // 2. Crear clínica
  const slug = clinicName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .insert({ name: clinicName, slug: `${slug}-${Date.now().toString(36)}` })
    .select()
    .single()

  if (clinicError) {
    await supabase.auth.admin.deleteUser(authUser.id)
    return NextResponse.json({ error: "Error al crear la clínica" }, { status: 500 })
  }

  // 3. Crear perfil de usuario (admin de la clínica)
  const { error: profileError } = await supabase.from("users").insert({
    id: authUser.id,
    email,
    name,
    role: "admin",
    clinic_id: clinic.id,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.id)
    await supabase.from("clinics").delete().eq("id", clinic.id)
    return NextResponse.json({ error: "Error al crear el perfil de usuario" }, { status: 500 })
  }

  // 4. Crear suscripción en período de prueba (7 días)
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 7)

  await (supabase as any).from("subscriptions").insert({
    clinic_id: clinic.id,
    plan,
    status: "trialing",
    current_period_start: new Date().toISOString(),
    current_period_end: trialEnd.toISOString(),
  })

  return NextResponse.json({ ok: true, clinicId: clinic.id }, { status: 201 })
}
