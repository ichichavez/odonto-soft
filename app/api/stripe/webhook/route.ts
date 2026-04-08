import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabase"

// Next.js App Router reads raw body automatically — no bodyParser config needed
export async function POST(request: Request) {
  const rawBody = await request.text()
  const sig = request.headers.get("stripe-signature")

  const secret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret || secret === "sk_test_placeholder") {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 })
  }

  if (!webhookSecret || webhookSecret === "whsec_placeholder") {
    return NextResponse.json({ error: "Webhook secret no configurado" }, { status: 500 })
  }

  const stripe = new Stripe(secret)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = createServerClient()

  const PLAN_MAP: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY ?? ""]: "pro",
    [process.env.STRIPE_PRICE_PRO_ANNUAL ?? ""]: "pro",
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? ""]: "enterprise",
    [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ?? ""]: "enterprise",
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const clinicId = sub.metadata?.clinic_id

      if (!clinicId) break

      const priceId = sub.items.data[0]?.price?.id ?? ""
      const plan = PLAN_MAP[priceId] ?? "pro"

      await supabase.from("subscriptions").upsert(
        {
          clinic_id: clinicId,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          plan,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clinic_id" }
      )
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const clinicId = sub.metadata?.clinic_id
      if (!clinicId) break

      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("clinic_id", clinicId)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId)
      break
    }

    default:
      // Unhandled event type — return ok
      break
  }

  return NextResponse.json({ received: true })
}
