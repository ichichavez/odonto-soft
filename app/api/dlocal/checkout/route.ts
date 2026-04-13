import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { buildSubscribeUrl, PLAN_TOKENS } from "@/lib/dlocal"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAuth>>
  try {
    profile = await requireAuth(request)
  } catch (response) {
    return response as Response
  }

  const body = await request.json()

  // Superadmin puede pasar cualquier clinicId; usuario normal usa el suyo
  const clinicId: string | null = body.clinicId ?? profile.clinic_id
  const plan: string = body.plan ?? "basico"

  if (!clinicId) {
    return NextResponse.json({ error: "clinicId requerido" }, { status: 400 })
  }

  // Sólo superadmin puede crear checkout para otra clínica
  if (body.clinicId && profile.role !== "superadmin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const planToken = PLAN_TOKENS[plan]
  if (!planToken) {
    return NextResponse.json(
      { error: `Plan "${plan}" no configurado. Ejecutá primero POST /api/dlocal/plans.` },
      { status: 400 }
    )
  }

  // Obtener email del usuario para pre-rellenar el formulario
  const supabase = createServerClient()
  let email: string | undefined
  try {
    const { data } = await supabase.auth.admin.getUserById(profile.id)
    email = data.user?.email ?? undefined
  } catch {}

  const url = buildSubscribeUrl(planToken, clinicId, email)

  // Registrar intento de suscripción en la tabla (si no existe ya)
  await supabase.from("subscriptions").upsert(
    {
      clinic_id: clinicId,
      plan,
      status: "trialing",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clinic_id", ignoreDuplicates: true }
  )

  return NextResponse.json({ url })
}
