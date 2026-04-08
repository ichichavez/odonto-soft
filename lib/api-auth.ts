import { createServerClient } from "@/lib/supabase"

/**
 * Verifies that the incoming request carries a valid superadmin session.
 * Returns the user object or throws a Response with an error status.
 */
export async function requireSuperAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!token) {
    throw new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const supabase = createServerClient()

  // Verify access token and get the user
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Look up role in public.users
  const { data: profile } = await supabase
    .from("users")
    .select("role, name, clinic_id")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") {
    throw new Response(JSON.stringify({ error: "Acceso denegado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  return { ...user, role: profile.role, name: profile.name }
}
