"use client"

import { type Surface, type Condition, type ToothData, CONDITIONS, WHOLE_CONDITIONS } from "./types"

// ── Geometría del diente (viewBox 40×40) ─────────────────────────────────────
//
//   ┌─────────────┐
//   │  Vestibular  │   ← V: trapecio superior
//   │  ┌───────┐  │
//   │M │   O   │D │   ← M: trapecio izq · O: cuadrado central · D: trapecio der
//   │  └───────┘  │
//   │   Lingual   │   ← L: trapecio inferior
//   └─────────────┘

const SURFACES_POLY: Record<Surface, string> = {
  V: "0,0 40,0 30,11 10,11",
  L: "10,29 30,29 40,40 0,40",
  M: "0,0 10,11 10,29 0,40",
  D: "30,11 40,0 40,40 30,29",
  O: "",   // rect, handled separately
}

// Línea diagonal de fractura por superficie
const FRACTURA_LINE: Record<Surface, [number, number, number, number]> = {
  V: [2, 2, 38, 9],
  L: [2, 31, 38, 38],
  M: [2, 2, 9, 38],
  D: [31, 2, 38, 38],
  O: [12, 12, 28, 28],
}

function getSurfaceFill(surface: Surface, data: ToothData): string {
  if (data.whole) {
    const color = CONDITIONS[data.whole]?.color ?? "#ffffff"
    if (data.whole === "extraido" || data.whole === "ausente") return CONDITIONS[data.whole].color
    return color
  }
  const cond = data.surfaces[surface]
  return cond ? CONDITIONS[cond].color : "#ffffff"
}

function getSurfaceStroke(surface: Surface, data: ToothData): string {
  if (data.whole) return CONDITIONS[data.whole]?.stroke ?? "#9ca3af"
  const cond = data.surfaces[surface]
  return cond ? CONDITIONS[cond].stroke : "#9ca3af"
}

function isFractura(surface: Surface, data: ToothData): boolean {
  if (data.whole) return false
  return data.surfaces[surface] === "fractura"
}

interface ToothSVGProps {
  number: number
  data: ToothData
  activeTool: Condition
  /** True para dientes temporales (más pequeños) */
  isPrimary?: boolean
  /** True para fila inferior (gira 180° para que vestibular quede abajo) */
  isLower?: boolean
  onSurfaceClick: (surface: Surface) => void
}

export function ToothSVG({ number, data, activeTool, isPrimary = false, isLower = false, onSurfaceClick }: ToothSVGProps) {
  const svgSize = isPrimary ? 28 : 36
  const isExtracted = data.whole === "extraido"
  const isAbsent    = data.whole === "ausente"
  const isWhole     = !!data.whole

  // Para dientes inferiores giramos el SVG verticalmente (vestibular queda abajo)
  const transform = isLower ? "scale(1,-1) translate(0,-40)" : undefined

  const handleClick = (surface: Surface) => {
    onSurfaceClick(surface)
  }

  const surfaces: Surface[] = ["V", "L", "M", "D", "O"]

  return (
    <div className={`flex flex-col items-center gap-0 select-none ${isLower ? "flex-col-reverse" : ""}`}>
      {/* Número del diente */}
      <span className={`leading-none text-muted-foreground ${isPrimary ? "text-[8px]" : "text-[9px]"}`}>
        {number}
      </span>

      <svg
        viewBox="0 0 40 40"
        width={svgSize}
        height={svgSize}
        className="cursor-pointer shrink-0"
        style={{ display: "block" }}
        aria-label={`Diente ${number}`}
      >
        <g transform={transform}>
          {/* ── Superficie Vestibular (V) ── */}
          <polygon
            points={SURFACES_POLY.V}
            fill={getSurfaceFill("V", data)}
            stroke={getSurfaceStroke("V", data)}
            strokeWidth="0.6"
            onClick={() => handleClick("V")}
            className="hover:opacity-75 transition-opacity"
          />
          {isFractura("V", data) && (
            <line {...fracLine("V")} stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: "none" }} />
          )}

          {/* ── Superficie Lingual (L) ── */}
          <polygon
            points={SURFACES_POLY.L}
            fill={getSurfaceFill("L", data)}
            stroke={getSurfaceStroke("L", data)}
            strokeWidth="0.6"
            onClick={() => handleClick("L")}
            className="hover:opacity-75 transition-opacity"
          />
          {isFractura("L", data) && (
            <line {...fracLine("L")} stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: "none" }} />
          )}

          {/* ── Superficie Mesial (M) ── */}
          <polygon
            points={SURFACES_POLY.M}
            fill={getSurfaceFill("M", data)}
            stroke={getSurfaceStroke("M", data)}
            strokeWidth="0.6"
            onClick={() => handleClick("M")}
            className="hover:opacity-75 transition-opacity"
          />
          {isFractura("M", data) && (
            <line {...fracLine("M")} stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: "none" }} />
          )}

          {/* ── Superficie Distal (D) ── */}
          <polygon
            points={SURFACES_POLY.D}
            fill={getSurfaceFill("D", data)}
            stroke={getSurfaceStroke("D", data)}
            strokeWidth="0.6"
            onClick={() => handleClick("D")}
            className="hover:opacity-75 transition-opacity"
          />
          {isFractura("D", data) && (
            <line {...fracLine("D")} stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: "none" }} />
          )}

          {/* ── Superficie Oclusal (O) — centro ── */}
          <rect
            x="10" y="11" width="20" height="18"
            fill={getSurfaceFill("O", data)}
            stroke={getSurfaceStroke("O", data)}
            strokeWidth="0.6"
            onClick={() => handleClick("O")}
            className="hover:opacity-75 transition-opacity"
          />
          {isFractura("O", data) && (
            <line {...fracLine("O")} stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: "none" }} />
          )}

          {/* ── Overlays para condiciones de diente completo ── */}

          {/* Extraído → X */}
          {isExtracted && (
            <>
              <line x1="5" y1="5" x2="35" y2="35" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" style={{ pointerEvents: "none" }} />
              <line x1="35" y1="5" x2="5" y2="35" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" style={{ pointerEvents: "none" }} />
            </>
          )}

          {/* Endodoncia → punto central */}
          {data.whole === "endodoncia" && (
            <circle cx="20" cy="20" r="4" fill="white" opacity={0.5} style={{ pointerEvents: "none" }} />
          )}

          {/* Corona → borde dorado grueso */}
          {data.whole === "corona" && (
            <rect x="1" y="1" width="38" height="38" fill="none" stroke="#92400e" strokeWidth="2" rx="2" style={{ pointerEvents: "none" }} />
          )}

          {/* Implante → líneas verticales punteadas */}
          {data.whole === "implante" && (
            <>
              <line x1="14" y1="4" x2="14" y2="36" stroke="white" strokeWidth="1" strokeDasharray="3,3" opacity={0.6} style={{ pointerEvents: "none" }} />
              <line x1="26" y1="4" x2="26" y2="36" stroke="white" strokeWidth="1" strokeDasharray="3,3" opacity={0.6} style={{ pointerEvents: "none" }} />
            </>
          )}

          {/* Ausente → borde punteado gris */}
          {isAbsent && (
            <rect x="1" y="1" width="38" height="38" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4,3" rx="2" style={{ pointerEvents: "none" }} />
          )}
        </g>
      </svg>
    </div>
  )
}

function fracLine(surface: Surface) {
  const [x1, y1, x2, y2] = FRACTURA_LINE[surface]
  return { x1, y1, x2, y2 }
}
