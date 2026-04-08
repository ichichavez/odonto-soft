import { NextResponse } from "next/server"
import Stripe from "stripe"
import { requireSuperAdmin } from "@/lib/api-auth"
import { createServerClient } from "@/lib/supabase"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === "sk_test_placeholder") {
    throw new Error("STRIPE_SECRET_KEY no configurada")
  }
  return new Stripe(key)
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  const { clinicId, priceId } = await request.json()

  if (!clinicId || !priceId) {
    return NextResponse.json({ error: "clinicId y priceId son requeridos" }, { status: 400 })
  }

  let stripe: Stripe
  try {
    stripe = getStripe()
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  const supabase = createServerClient()

  // Get or create Stripe customer for this clinic
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("clinic_id", clinicId)
    .single()

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name")
    .eq("id", clinicId)
    .single()

  let customerId = sub?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: clinic?.name ?? clinicId,
      metadata: { clinic_id: clinicId },
    })
    customerId = customer.id

    // Save customer id
    await supabase
      .from("subscriptions")
      .upsert(
        { clinic_id: clinicId, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
        { onConflict: "clinic_id" }
      )
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/superadmin/billing?success=1&clinic=${clinicId}`,
    cancel_url: `${origin}/superadmin/billing?canceled=1`,
    metadata: { clinic_id: clinicId },
  })

  return NextResponse.json({ url: session.url })
}
