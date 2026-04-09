import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { stripe, PRICE_IDS } from "@/lib/stripe"
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

  const { plan } = await request.json()
  const priceId = PRICE_IDS[plan]

  if (!priceId) {
    return NextResponse.json(
      { error: "Plan no válido o precio de Stripe no configurado" },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // Obtener o crear Stripe Customer
  const { data: sub } = await (supabase as any)
    .from("subscriptions")
    .select("stripe_customer_id, plan")
    .eq("clinic_id", profile.clinic_id)
    .single()

  let customerId: string = sub?.stripe_customer_id ?? ""

  if (!customerId) {
    const { data: clinic } = await supabase
      .from("clinics")
      .select("name")
      .eq("id", profile.clinic_id)
      .single()

    const customer = await stripe.customers.create({
      email: profile.email ?? undefined,
      name: clinic?.name ?? profile.name,
      metadata: { clinic_id: profile.clinic_id },
    })
    customerId = customer.id

    // Guardar el customer ID en la suscripción
    await (supabase as any)
      .from("subscriptions")
      .upsert(
        { clinic_id: profile.clinic_id, stripe_customer_id: customerId, plan },
        { onConflict: "clinic_id" }
      )
  }

  // Crear sesión de Stripe Checkout con prueba de 14 días
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { clinic_id: profile.clinic_id, plan },
    },
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/precios`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
