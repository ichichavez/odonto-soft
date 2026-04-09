import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { ClinicProvider } from "@/context/clinic-context"
import { NotificationProvider } from "@/context/notification-context"
import { ThemeInjector } from "@/components/theme-injector"
import { ErrorBoundary } from "@/components/error-boundary"
import { Shell } from "@/components/shell"
import { BranchProvider } from "@/context/branch-context"

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
              <BranchProvider>
              <NotificationProvider>
                <ThemeInjector />
                <Shell>{children}</Shell>
                <Toaster />
              </NotificationProvider>
              </BranchProvider>
            </ClinicProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
