import crypto from "crypto"

// ── Config ────────────────────────────────────────────────────────────────────

const isSandbox = process.env.DLOCAL_SANDBOX !== "false"

const DLOCAL_API_BASE = isSandbox
  ? "https://api-sbx.dlocalgo.com"
  : "https://api.dlocalgo.com"

const DLOCAL_CHECKOUT_BASE = isSandbox
  ? "https://checkout-sbx.dlocalgo.com"
  : "https://checkout.dlocalgo.com"

function getAuthHeader(): string {
  const key = process.env.DLOCAL_API_KEY
  const secret = process.env.DLOCAL_SECRET_KEY
  if (!key || !secret) throw new Error("DLOCAL_API_KEY / DLOCAL_SECRET_KEY no configuradas")
  return `Bearer ${key}:${secret}`
}

async function dlocalFetch<T = any>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${DLOCAL_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message ?? data?.error ?? `dLocalGo error ${res.status}`)
  }
  return data as T
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type DlocalPlan = {
  id: number
  name: string
  description: string
  plan_token: string
  subscribe_url: string
  amount: number
  currency: string
  frequency_type: string
  frequency_value: number
  active: boolean
  created_at: string
}

export type DlocalPayment = {
  id: string
  amount: number
  currency: string
  status: "PENDING" | "PAID" | "REJECTED" | "CANCELLED" | "EXPIRED" | string
  order_id: string
  external_id?: string
  description?: string
  payer?: { name?: string; email?: string; document?: string }
  created_date: string
}

// ── Subscription Plans ────────────────────────────────────────────────────────

export async function createSubscriptionPlan(plan: {
  name: string
  description: string
  amount: number
  currency: string
  notification_url: string
  success_url: string
  back_url: string
}): Promise<DlocalPlan> {
  return dlocalFetch<DlocalPlan>("/v1/subscription/plan", {
    method: "POST",
    body: {
      ...plan,
      frequency_type: "MONTHLY",
      frequency_value: 1,
    },
  })
}

export async function listSubscriptionPlans(): Promise<DlocalPlan[]> {
  const data = await dlocalFetch<DlocalPlan[] | { items: DlocalPlan[] }>("/v1/subscription/plan")
  return Array.isArray(data) ? data : (data as any).items ?? []
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function getPayment(paymentId: string): Promise<DlocalPayment> {
  return dlocalFetch<DlocalPayment>(`/v1/payments/${paymentId}`)
}

// ── Subscribe URL ─────────────────────────────────────────────────────────────

/**
 * Builds the hosted subscription checkout URL for a given plan token.
 * Appends clinicId as external_id so we can correlate webhooks back to the clinic.
 */
export function buildSubscribeUrl(planToken: string, clinicId: string, email?: string): string {
  const url = new URL(`${DLOCAL_CHECKOUT_BASE}/validate/subscription/${planToken}`)
  url.searchParams.set("external_id", clinicId)
  if (email) url.searchParams.set("email", email)
  return url.toString()
}

// ── Webhook signature verification ────────────────────────────────────────────

/**
 * Verifies the V2-HMAC-SHA256 signature sent by dLocalGo in the Authorization header.
 * Formula: HMAC-SHA256(key=SECRET_KEY, message=API_KEY + rawBody)
 */
export function verifyWebhookSignature(rawBody: string, authHeader: string): boolean {
  const apiKey = process.env.DLOCAL_API_KEY
  const secretKey = process.env.DLOCAL_SECRET_KEY
  if (!apiKey || !secretKey) return false

  const message = apiKey + rawBody
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex")

  // Header format: "V2-HMAC-SHA256, Signature: {hexdigest}"
  const match = authHeader.match(/Signature:\s*([a-f0-9]+)/i)
  if (!match) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(match[1], "hex")
    )
  } catch {
    return false
  }
}

// ── Plan token map ────────────────────────────────────────────────────────────

export const PLAN_TOKENS: Record<string, string | undefined> = {
  basico:      process.env.DLOCAL_PLAN_TOKEN_BASICO,
  pro:         process.env.DLOCAL_PLAN_TOKEN_PRO,
  empresarial: process.env.DLOCAL_PLAN_TOKEN_EMPRESARIAL,
}
