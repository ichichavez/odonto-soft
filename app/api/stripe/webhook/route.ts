import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret no configurado" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error("[stripe webhook] Firma inválida:", err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = createServerClient()

  // ── Helper: sync subscription row ────────────────────────────────────────

  async function syncSubscription(sub: Stripe.Subscription) {
    const clinicId = sub.metadata?.clinic_id
    const plan = sub.metadata?.plan ?? "basico"
    if (!clinicId) return

    await (supabase as any).from("subscriptions").upsert(
      {
        clinic_id: clinicId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id: sub.items.data[0]?.price?.id ?? null,
        plan,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clinic_id" }
    )

    // Sincronizar status de la clínica
    const clinicStatus =
      sub.status === "active" || sub.status === "trialing" ? "active" : "suspended"
    await supabase.from("clinics").update({ status: clinicStatus } as any).eq("id", clinicId)
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.CheckoutSession
      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        await syncSubscription(subscription)
      }
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await syncSubscription(event.data.object as Stripe.Subscription)
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const clinicId = sub.metadata?.clinic_id
      if (!clinicId) break

      await (supabase as any)
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("clinic_id", clinicId)

      await supabase.from("clinics").update({ status: "suspended" } as any).eq("id", clinicId)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await (supabase as any)
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
