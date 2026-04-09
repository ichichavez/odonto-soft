import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { createServerClient } from "@/lib/supabase"

// PATCH — Actualiza preferencias propias del usuario autenticado
export async function PATCH(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAuth>>
  try {
    profile = await requireAuth(request)
  } catch (response) {
    return response as Response
  }

  const body = await request.json()
  const { notification_before_minutes } = body

  if (notification_before_minutes !== undefined) {
    const minutes = Number(notification_before_minutes)
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) {
      return NextResponse.json(
        { error: "notification_before_minutes debe ser un entero entre 1 y 120" },
        { status: 400 }
      )
    }
  } else {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from("users")
    .update({ notification_before_minutes })
    .eq("id", profile.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
