import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { ClinicProvider } from "@/context/clinic-context"
import { NotificationProvider } from "@/context/notification-context"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeInjector } from "@/components/theme-injector"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "OdontoSoft",
  description: "Plataforma de gestión para consultorios odontológicos",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <ClinicProvider>
              <NotificationProvider>
                <ThemeInjector />
                <div className="flex min-h-screen">
                  <AppSidebar />
                  <main className="flex-1 min-w-0 pt-14 lg:pt-0">
                    {children}
                  </main>
                </div>
                <Toaster />
              </NotificationProvider>
            </ClinicProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
