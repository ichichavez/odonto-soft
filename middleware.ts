import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Soft verification: just pass through.
  // Real role check (superadmin) is enforced client-side in the layout
  // and server-side in each API route via the Authorization header.
  return NextResponse.next()
}

export const config = {
  matcher: ["/superadmin/:path*", "/api/superadmin/:path*"],
}
