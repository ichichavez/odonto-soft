"use client"

import { useEffect } from "react"
import { useClinic } from "@/context/clinic-context"
import { hexToHsl, getContrastColor } from "@/lib/color-utils"

export function ThemeInjector() {
  const { clinic } = useClinic()

  useEffect(() => {
    const color = clinic?.primary_color || "#a2d5e6"

    try {
      const hsl = hexToHsl(color)
      const contrast = getContrastColor(color)

      document.documentElement.style.setProperty("--primary", hsl)
      document.documentElement.style.setProperty("--primary-foreground", contrast)
      document.documentElement.style.setProperty("--ring", hsl)
    } catch {
      // Invalid color — leave defaults
    }
  }, [clinic?.primary_color])

  return null
}
