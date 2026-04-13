import { NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/api-auth"

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)
  } catch (response) {
    return response as Response
  }

  const isSandbox = process.env.DLOCAL_SANDBOX !== "false"

  return NextResponse.json({
    sandbox: isSandbox,
    api_key:              !!process.env.DLOCAL_API_KEY,
    secret_key:           !!process.env.DLOCAL_SECRET_KEY,
    plan_token_basico:    !!process.env.DLOCAL_PLAN_TOKEN_BASICO,
    plan_token_pro:       !!process.env.DLOCAL_PLAN_TOKEN_PRO,
    plan_token_empresarial: !!process.env.DLOCAL_PLAN_TOKEN_EMPRESARIAL,
  })
}
