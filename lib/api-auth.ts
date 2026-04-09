import { createServerClient } from "@/lib/supabase"

/**
 * Requires any authenticated user (admin, dentista, asistente…).
 * Returns id, email, name, role, clinic_id or throws a 401/403 Response.
 */
export async function requireAuth(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")

  if (!token) {
    throw new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, name, clinic_id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Response(JSON.stringify({ error: "Perfil no encontrado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  return {
    ...(profile as { id: string; role: string; name: string; clinic_id: string | null }),
    email: user.email ?? null,
  }
}

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

/**
 * Requires the request to carry a valid admin or superadmin session.
 * Returns the profile (with clinic_id) or throws a Response.
 */
export async function requireAdmin(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")

  if (!token) {
    throw new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, name, clinic_id")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "superadmin"].includes(profile.role ?? "")) {
    throw new Response(JSON.stringify({ error: "Acceso denegado — se requiere rol admin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  return profile as { id: string; role: string; name: string; clinic_id: string | null }
}
