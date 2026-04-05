"use client"

import { Component, type ReactNode } from "react"

interface Props { children: ReactNode }
interface State { hasError: boolean; error: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: "" }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  handleReset = () => {
    // Limpiar localStorage de Supabase para forzar re-login limpio
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") || key.startsWith("dental_images_")) {
          localStorage.removeItem(key)
        }
      })
    } catch {}
    window.location.href = "/login"
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h2 className="text-xl font-semibold">Algo salió mal</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Ocurrió un error inesperado. Esto puede deberse a una sesión expirada o datos en caché obsoletos.
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Restablecer y volver al inicio
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
