"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppointmentReminders } from "@/components/appointment-reminders"

const NO_SIDEBAR_ROUTES = ["/login", "/registro", "/precios", "/billing/success"]

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname)

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
