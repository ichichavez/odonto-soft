/**
 * Script para crear los 3 planes de suscripción en dLocalGo.
 * Correr UNA SOLA VEZ en sandbox y luego en producción.
 *
 * Uso:
 *   node scripts/dlocal-setup-plans.mjs
 *
 * Requiere en .env.local:
 *   DLOCAL_API_KEY=...
 *   DLOCAL_SECRET_KEY=...
 *   DLOCAL_SANDBOX=true
 *   NEXT_PUBLIC_APP_URL=https://...
 */

import { readFileSync } from "fs"
import { resolve } from "path"

// Cargar .env.local manualmente
const envPath = resolve(process.cwd(), ".env.local")
const envContent = readFileSync(envPath, "utf-8")
const env = {}
for (const line of envContent.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx < 0) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
  env[key] = val
}

const API_KEY = env.DLOCAL_API_KEY
const SECRET_KEY = env.DLOCAL_SECRET_KEY
const SANDBOX = env.DLOCAL_SANDBOX !== "false"
const APP_URL = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

if (!API_KEY || !SECRET_KEY) {
  console.error("❌ Faltan DLOCAL_API_KEY y/o DLOCAL_SECRET_KEY en .env.local")
  process.exit(1)
}

const BASE_URL = SANDBOX
  ? "https://api-sbx.dlocalgo.com"
  : "https://api.dlocalgo.com"

const AUTH_HEADER = `Bearer ${API_KEY}:${SECRET_KEY}`

const PLANS = [
  {
    key: "BASICO",
    name: "OdontoSoft Básico",
    description: "Plan básico para pequeños consultorios — hasta 3 usuarios, 200 pacientes",
    amount: 59,
    currency: "USD",
  },
  {
    key: "PRO",
    name: "OdontoSoft Pro",
    description: "Plan profesional para consultorios en crecimiento — hasta 10 usuarios, 1000 pacientes",
    amount: 99,
    currency: "USD",
  },
  {
    key: "EMPRESARIAL",
    name: "OdontoSoft Empresarial",
    description: "Plan empresarial para cadenas de clínicas — usuarios y pacientes ilimitados",
    amount: 179,
    currency: "USD",
  },
]

async function createPlan(plan) {
  const body = {
    name: plan.name,
    description: plan.description,
    amount: plan.amount,
    currency: plan.currency,
    frequency_type: "MONTHLY",
    frequency_value: 1,
    notification_url: `${APP_URL}/api/dlocal/webhook`,
    success_url: `${APP_URL}/billing?dlocal=success`,
    back_url: `${APP_URL}/precios`,
  }

  const res = await fetch(`${BASE_URL}/v1/subscription/plan`, {
    method: "POST",
    headers: {
      Authorization: AUTH_HEADER,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message ?? JSON.stringify(data))
  }
  return data
}

console.log(`\n🚀 Creando planes en dLocalGo (${SANDBOX ? "SANDBOX" : "PRODUCCIÓN"})...\n`)

const envLines = []

for (const plan of PLANS) {
  try {
    const created = await createPlan(plan)
    console.log(`✅ ${plan.name}`)
    console.log(`   ID:          ${created.id}`)
    console.log(`   Plan token:  ${created.plan_token}`)
    console.log(`   Subscribe:   ${created.subscribe_url}`)
    console.log()
    envLines.push(`DLOCAL_PLAN_TOKEN_${plan.key}=${created.plan_token}`)
  } catch (err) {
    console.error(`❌ Error creando "${plan.name}": ${err.message}`)
  }
}

if (envLines.length > 0) {
  console.log("─────────────────────────────────────────────────────────")
  console.log("Copiá estas líneas a .env.local y a las variables de Vercel:\n")
  for (const line of envLines) {
    console.log(line)
  }
  console.log()
}
