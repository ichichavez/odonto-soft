import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  let profile: Awaited<ReturnType<typeof requireAuth>>
  try {
    profile = await requireAuth(request)
  } catch (response) {
    return response as Response
  }

  if (!profile.clinic_id) {
    return NextResponse.json({ error: "No tenés clínica asignada" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: sub } = await (supabase as any)
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("clinic_id", profile.clinic_id)
    .single()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No tenés una suscripción activa en Stripe" },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
