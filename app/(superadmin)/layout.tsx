"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"

const SA_NAV = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/superadmin/clinics", label: "Clínicas", icon: Building2 },
  { href: "/superadmin/users", label: "Usuarios", icon: Users },
  { href: "/superadmin/billing", label: "Facturación", icon: CreditCard },
  { href: "/superadmin/settings", label: "Configuración", icon: Settings },
]

function SuperSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(href + "/")
  }

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-5">
        <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-bold leading-none">Super Admin</p>
          <p className="text-xs text-slate-400 mt-0.5">OdontoSoft</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {SA_NAV.map(({ href, label, icon: Icon, exact }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(href, exact)
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Back + logout */}
      <div className="border-t border-slate-700 p-3 space-y-1">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Volver a la clínica
        </Link>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading && user && user.role !== "superadmin") {
      router.push("/")
    }
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!user || user.role !== "superadmin") return null

  return (
    // -mt-14 counteracts the root layout's pt-14 (mobile hamburger space)
    <div className="flex min-h-screen -mt-14 lg:mt-0 bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col">
        <SuperSidebar />
      </aside>

      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 bg-slate-800 text-slate-100 hover:bg-slate-700"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-2 top-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 text-slate-400 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SuperSidebar onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
