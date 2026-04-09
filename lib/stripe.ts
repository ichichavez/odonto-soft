import Stripe from "stripe"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-12-18.acacia" as any,
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
