"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppointmentReminders } from "@/components/appointment-reminders"
import { ClinicSuspendedScreen } from "@/components/clinic-suspended"
import { useClinic } from "@/context/clinic-context"

const NO_SIDEBAR_ROUTES = ["/login", "/registro", "/precios", "/billing/success", "/recuperar-contrasena", "/nueva-contrasena"]

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { clinic } = useClinic()
  // El panel /superadmin tiene su propio layout y sidebar — no mostrar el de clínica
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname) && !pathname?.startsWith("/superadmin")

  if (showSidebar && clinic?.status === "suspended") {
    return <ClinicSuspendedScreen />
  }

  return (
    <div className="flex min-h-screen">
      {showSidebar && <AppSidebar />}
      {showSidebar && <AppointmentReminders />}
      <main className={showSidebar ? "flex-1 min-w-0 pt-14 lg:pt-0" : "flex-1 min-w-0"}>
        {children}
      </main>
    </div>
  )
}
