/**
 * Converts a hex color string to HSL components as a space-separated string.
 * Example: "#10b981" → "160 84% 39%"
 */
export function hexToHsl(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / delta + 2) / 6
        break
      case b:
        h = ((r - g) / delta + 4) / 6
        break
    }
  }

  const hDeg = Math.round(h * 360)
  const sPct = Math.round(s * 100)
  const lPct = Math.round(l * 100)

  return `${hDeg} ${sPct}% ${lPct}%`
}

/**
 * Returns white or dark HSL string for text contrast on a given hex background.
 * Returns "0 0% 100%" (white) or "0 0% 9%" (dark).
 */
export function getContrastColor(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)

  // Perceived luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? "0 0% 9%" : "0 0% 100%"
}
