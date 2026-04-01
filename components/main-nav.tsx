"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link
        href="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-primary" : "text-muted-foreground",
        )}
      >
        Inicio
      </Link>
      <Link
        href="/citas"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/citas" || pathname?.startsWith("/citas/") ? "text-primary" : "text-muted-foreground",
        )}
      >
        Citas
      </Link>
      <Link
        href="/pacientes"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/pacientes" || pathname?.startsWith("/pacientes/") ? "text-primary" : "text-muted-foreground",
        )}
      >
        Pacientes
      </Link>
      <Link
        href="/tratamientos"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/tratamientos" || pathname?.startsWith("/tratamientos/")
            ? "text-primary"
            : "text-muted-foreground",
        )}
      >
        Tratamientos
      </Link>
      <Link
        href="/presupuestos"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/presupuestos" || pathname?.startsWith("/presupuestos/")
            ? "text-primary"
            : "text-muted-foreground",
        )}
      >
        Presupuestos
      </Link>
      <Link
        href="/facturas"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/facturas" || pathname?.startsWith("/facturas/") ? "text-primary" : "text-muted-foreground",
        )}
      >
        Facturas
      </Link>
      <Link
        href="/inventario"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/inventario" || pathname?.startsWith("/inventario/") ? "text-primary" : "text-muted-foreground",
        )}
      >
        Inventario
      </Link>
      <Link
        href="/ventas-materiales"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/ventas-materiales" || pathname?.startsWith("/ventas-materiales/")
            ? "text-primary"
            : "text-muted-foreground",
        )}
      >
        Venta Materiales
      </Link>
      <Link
        href="/notificaciones"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/notificaciones" ? "text-primary" : "text-muted-foreground",
        )}
      >
        Notificaciones
      </Link>
    </nav>
  )
}
