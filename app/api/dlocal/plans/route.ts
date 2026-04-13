import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/api-auth"
import { createSubscriptionPlan, listSubscriptionPlans } from "@/lib/dlocal"

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

// GET: listar planes existentes en dLocalGo
export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  try {
    const plans = await listSubscriptionPlans()
    return NextResponse.json(plans)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: crear los 3 planes de OdontoSoft en dLocalGo
export async function POST(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  const notificationUrl = `${APP_URL}/api/dlocal/webhook`
  const successUrl = `${APP_URL}/billing?dlocal=success`
  const backUrl = `${APP_URL}/precios`

  const plansToCreate = [
    {
      key: "basico",
      name: "OdontoSoft Básico",
      description: "Plan básico para pequeños consultorios — hasta 3 usuarios, 200 pacientes",
      amount: 64,
      currency: "USD",
    },
    {
      key: "pro",
      name: "OdontoSoft Pro",
      description: "Plan profesional para consultorios en crecimiento — hasta 10 usuarios, 1000 pacientes",
      amount: 99,
      currency: "USD",
    },
    {
      key: "empresarial",
      name: "OdontoSoft Empresarial",
      description: "Plan empresarial para cadenas de clínicas — usuarios y pacientes ilimitados",
      amount: 179,
      currency: "USD",
    },
  ]

  const results = []

  for (const p of plansToCreate) {
    try {
      const created = await createSubscriptionPlan({
        name: p.name,
        description: p.description,
        amount: p.amount,
        currency: p.currency,
        notification_url: notificationUrl,
        success_url: successUrl,
        back_url: backUrl,
      })
      results.push({
        ok: true,
        key: p.key,
        id: created.id,
        plan_token: created.plan_token,
        subscribe_url: created.subscribe_url,
        env_var: `DLOCAL_PLAN_TOKEN_${p.key.toUpperCase()}=${created.plan_token}`,
      })
    } catch (err: any) {
      results.push({ ok: false, key: p.key, error: err.message })
    }
  }

  return NextResponse.json({
    results,
    instructions:
      "Copiá los valores 'env_var' y agregalos a .env.local y a las variables de entorno de Vercel.",
  })
}
