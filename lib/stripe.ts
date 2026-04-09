import Stripe from "stripe"

let _stripe: Stripe | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY no está configurada")
    _stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" as any })
  }
  return _stripe
}

/** @deprecated use getStripe() */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

/**
 * Stripe Price IDs por plan (configurar en .env.local)
 * Crear los productos en Stripe Dashboard → Products → Add product
 * Tipo: Recurring · Billing: Monthly
 */
export const PRICE_IDS: Record<string, string> = {
  basico:      process.env.STRIPE_PRICE_BASICO      ?? "",
  pro:         process.env.STRIPE_PRICE_PRO          ?? "",
  empresarial: process.env.STRIPE_PRICE_EMPRESARIAL  ?? "",
}
