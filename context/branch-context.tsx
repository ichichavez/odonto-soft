"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/context/auth-context"
import { branchService, type Branch } from "@/services/branches"

export type { Branch }

interface BranchContextValue {
  branches: Branch[]
  activeBranch: Branch | null
  setActiveBranch: (b: Branch | null) => void
  loading: boolean
}

const BranchContext = createContext<BranchContextValue | undefined>(undefined)

const STORAGE_KEY = "activeBranchId"

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.clinic_id) {
      setBranches([])
      setActiveBranchState(null)
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const data = await branchService.getByClinic(user.clinic_id!)
        const active = data.filter((b) => b.is_active)
        setBranches(active)

        if (user.role === "admin") {
          // Admin: restaurar desde localStorage
          const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
          if (savedId) {
            const saved = active.find((b) => b.id === savedId) ?? null
            setActiveBranchState(saved)
          } else {
            setActiveBranchState(null) // null = "Todas"
          }
        } else {
          // No-admin: fijar automáticamente desde su branch_id
          if (user.branch_id) {
            const branch = active.find((b) => b.id === user.branch_id) ?? null
            setActiveBranchState(branch)
          } else {
            setActiveBranchState(null)
          }
        }
      } catch (err) {
        console.error("[branch] Error cargando sucursales:", err)
        setBranches([])
        setActiveBranchState(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.clinic_id, user?.role, user?.branch_id])

  const setActiveBranch = (b: Branch | null) => {
    setActiveBranchState(b)
    if (typeof window !== "undefined") {
      if (b) {
        localStorage.setItem(STORAGE_KEY, b.id)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  return (
    <BranchContext.Provider value={{ branches, activeBranch, setActiveBranch, loading }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error("useBranch debe ser usado dentro de un BranchProvider")
  }
  return context
}
