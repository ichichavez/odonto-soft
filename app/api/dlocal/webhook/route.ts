import { NextResponse } from "next/server"
import { verifyWebhookSignature, getPayment } from "@/lib/dlocal"
import { createServerClient } from "@/lib/supabase"

// dLocalGo envía POST a esta URL con {"payment_id": "DP-xxx"}
// Header: Authorization: V2-HMAC-SHA256, Signature: {hex}
// Verificamos la firma antes de procesar

export async function POST(request: Request) {
  const rawBody = await request.text()
  const authHeader = request.headers.get("authorization") ?? ""

  // Verificar firma HMAC (saltar en dev local si no hay credenciales configuradas)
  const apiKey = process.env.DLOCAL_API_KEY
  if (apiKey && !verifyWebhookSignature(rawBody, authHeader)) {
    console.error("[dlocal webhook] Firma HMAC inválida. Header:", authHeader)
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 })
  }

  let payload: { payment_id?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const paymentId = payload.payment_id
  if (!paymentId) {
    // Podría ser otro tipo de notificación (refund, etc.) — ignorar
    return NextResponse.json({ received: true })
  }

  // Obtener detalles del pago desde dLocalGo
  let payment
  try {
    payment = await getPayment(paymentId)
  } catch (err: any) {
    console.error("[dlocal webhook] Error al obtener pago:", err.message)
    return NextResponse.json({ error: "Error al obtener detalles del pago" }, { status: 500 })
  }

  // Obtener clinic_id desde external_id (seteado en la URL de suscripción) o order_id
  const clinicId = payment.external_id ?? payment.order_id
  if (!clinicId) {
    console.warn("[dlocal webhook] Sin clinic_id en pago", paymentId, JSON.stringify(payment))
    return NextResponse.json({ received: true })
  }

  const supabase = createServerClient()

  // Mapear estado de dLocalGo a estado interno
  const statusMap: Record<string, string> = {
    PAID:      "active",
    PENDING:   "trialing",
    REJECTED:  "past_due",
    CANCELLED: "canceled",
    EXPIRED:   "canceled",
  }
  const subscriptionStatus = statusMap[payment.status] ?? "past_due"

  // Actualizar tabla subscriptions
  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      clinic_id: clinicId,
      dlocal_order_id: payment.id,
      status: subscriptionStatus,
      current_period_start: payment.created_date
        ? new Date(payment.created_date).toISOString()
        : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clinic_id" }
  )

  if (subError) {
    console.error("[dlocal webhook] Error actualizando subscription:", subError.message)
  }

  // Sincronizar estado de la clínica
  const clinicStatus = subscriptionStatus === "active" ? "active" : "suspended"
  await supabase
    .from("clinics")
    .update({ status: clinicStatus } as any)
    .eq("id", clinicId)

  console.log(`[dlocal webhook] Pago ${paymentId} → clinic ${clinicId} → ${subscriptionStatus}`)

  return NextResponse.json({ received: true })
}
