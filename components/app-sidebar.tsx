"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  Receipt,
  Package,
  ShoppingCart,
  ShoppingBag,
  BarChart3,
  Bell,
  Settings,
  UserCog,
  SmileIcon as Tooth,
  Menu,
  X,
  TrendingDown,
  ShieldCheck,
  Building2,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: Home, exact: true },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/citas", label: "Citas", icon: Calendar },
  { href: "/tratamientos", label: "Tratamientos", icon: Stethoscope },
  { href: "/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/facturas", label: "Facturas", icon: Receipt },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/ventas-materiales", label: "Ventas", icon: ShoppingCart },
  { href: "/compras", label: "Compras", icon: ShoppingBag },
  { href: "/gastos", label: "Gastos", icon: TrendingDown },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
]

const ADMIN_ITEMS = [
  { href: "/settings", label: "Configuración", icon: Settings },
]

const SUPERADMIN_ITEMS = [
  { href: "/superadmin", label: "Panel", icon: ShieldCheck },
  { href: "/superadmin/clinics", label: "Clínicas", icon: Building2 },
  { href: "/superadmin/users", label: "Usuarios", icon: Users },
  { href: "/superadmin/billing", label: "Facturación", icon: CreditCard },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user, isSuperAdmin } = useAuth()
  const { clinic } = useClinic()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(href + "/")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo / Clinic Name */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        {clinic?.logo_url ? (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md">
            <Image
              src={clinic.logo_url}
              alt={clinic.name}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary">
            <Tooth className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        <span className="truncate text-sm font-semibold">
          {clinic?.name ?? "OdontoSoft"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href, exact)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Admin section */}
        {user?.role === "admin" && (
          <>
            <div className="mt-4 mb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Administración
              </p>
            </div>
            <ul className="space-y-0.5">
              {ADMIN_ITEMS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Super Admin section */}
        {isSuperAdmin && (
          <>
            <div className="mt-4 mb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500/80">
                Super Admin
              </p>
            </div>
            <ul className="space-y-0.5">
              {SUPERADMIN_ITEMS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(href)
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* User section at bottom */}
      <div className="border-t p-3">
        <UserNav />
      </div>
    </div>
  )
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Superadmin pages have their own full layout
  if (pathname?.startsWith("/superadmin")) return null

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-background">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-2 top-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  )
}
