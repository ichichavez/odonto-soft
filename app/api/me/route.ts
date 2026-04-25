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
  const { reminder_minutes } = body

  if (!Array.isArray(reminder_minutes)) {
    return NextResponse.json({ error: "reminder_minutes debe ser un array" }, { status: 400 })
  }

  for (const m of reminder_minutes) {
    if (!Number.isInteger(m) || m < 1 || m > 1440) {
      return NextResponse.json(
        { error: "Cada valor de reminder_minutes debe ser un entero entre 1 y 1440" },
        { status: 400 }
      )
    }
  }

  const supabase = createServerClient()
  const { error } = await (supabase as any)
    .from("users")
    .update({ reminder_minutes })
    .eq("id", profile.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
