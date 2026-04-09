"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"

const NO_SIDEBAR_ROUTES = ["/login"]

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname)

  return (
    <div className="flex min-h-screen">
      {showSidebar && <AppSidebar />}
      <main className={showSidebar ? "flex-1 min-w-0 pt-14 lg:pt-0" : "flex-1 min-w-0"}>
        {children}
      </main>
    </div>
  )
}
