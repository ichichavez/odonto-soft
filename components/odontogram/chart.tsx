"use client"

import { useState, useCallback } from "react"
import { ToothSVG } from "./tooth-svg"
import {
  type Surface, type Condition, type OdontogramData, type ToothData,
  CONDITIONS, WHOLE_CONDITIONS, emptyTooth,
  PERM_UPPER_RIGHT, PERM_UPPER_LEFT, PERM_LOWER_RIGHT, PERM_LOWER_LEFT,
  PRIM_UPPER_RIGHT, PRIM_UPPER_LEFT, PRIM_LOWER_RIGHT, PRIM_LOWER_LEFT,
} from "./types"
import { cn } from "@/lib/utils"

// ── Constantes de layout ──────────────────────────────────────────────────────

const CELL = 38    // px — ancho de cada slot en la cuadrícula
const GAP  = 2     // px — separación entre dientes
// Los temporales (5 por lado) se alinean con los 5 dientes interiores de los permanentes (8 por lado).
// Espaciador = 3 dientes permanentes + sus gaps
const SPACER = 3 * CELL + 2 * GAP  // = 118px

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToothData(data: OdontogramData, dentition: "permanent" | "primary", num: number): ToothData {
  return data[dentition][String(num)] ?? emptyTooth()
}

// ── Componente de paleta de herramientas ─────────────────────────────────────

interface PaletteProps {
  active: Condition
  onChange: (c: Condition) => void
}

function ToolPalette({ active, onChange }: PaletteProps) {
  const conditions = Object.entries(CONDITIONS) as [Condition, (typeof CONDITIONS)[Condition]][]

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {conditions.map(([cond, cfg]) => (
        <button
          key={cond}
          onClick={() => onChange(cond)}
          title={cfg.description}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
            active === cond
              ? "ring-2 ring-offset-1 ring-primary scale-105 shadow-md"
              : "opacity-70 hover:opacity-100"
          )}
          style={{
            backgroundColor: cfg.color,
            borderColor: cfg.stroke,
            color: cfg.textColor,
          }}
        >
          {cfg.wholeOnly && <span className="text-[10px] opacity-70">●</span>}
          {cfg.label}
        </button>
      ))}
    </div>
  )
}

// ── Fila de dientes ───────────────────────────────────────────────────────────

interface ToothRowProps {
  teeth: number[]
  dentition: "permanent" | "primary"
  isPrimary?: boolean
  isLower?: boolean
  data: OdontogramData
  activeTool: Condition
  onSurfaceClick: (dentition: "permanent" | "primary", num: number, surface: Surface) => void
}

function ToothRowGroup({ teeth, dentition, isPrimary, isLower, data, activeTool, onSurfaceClick }: ToothRowProps) {
  return (
    <div className="flex" style={{ gap: GAP }}>
      {teeth.map((num) => (
        <div key={num} style={{ width: CELL }} className="flex items-center justify-center">
          <ToothSVG
            number={num}
            isPrimary={isPrimary}
            isLower={isLower}
            data={getToothData(data, dentition, num)}
            activeTool={activeTool}
            onSurfaceClick={(surface) => onSurfaceClick(dentition, num, surface)}
          />
        </div>
      ))}
    </div>
  )
}

// ── Leyenda ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {(Object.entries(CONDITIONS) as [Condition, (typeof CONDITIONS)[Condition]][]).map(([cond, cfg]) => (
        <div key={cond} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border"
            style={{ backgroundColor: cfg.color, borderColor: cfg.stroke }}
          />
          {cfg.label}
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface OdontogramChartProps {
  initialData: OdontogramData
  onChange: (data: OdontogramData) => void
  readOnly?: boolean
}

export function OdontogramChart({ initialData, onChange, readOnly = false }: OdontogramChartProps) {
  const [data, setData] = useState<OdontogramData>(initialData)
  const [activeTool, setActiveTool] = useState<Condition>("caries")

  const handleSurfaceClick = useCallback((
    dentition: "permanent" | "primary",
    num: number,
    surface: Surface,
  ) => {
    if (readOnly) return

    setData((prev) => {
      const key = String(num)
      const tooth = prev[dentition][key] ?? emptyTooth()
      let updated: ToothData

      if (activeTool === "sano") {
        // Borrar: si tiene condición de diente completo → limpiar todo; si no → limpiar esa superficie
        if (tooth.whole) {
          updated = emptyTooth()
        } else {
          const newSurfaces = { ...tooth.surfaces }
          delete newSurfaces[surface]
          updated = { ...tooth, surfaces: newSurfaces }
        }
      } else if (WHOLE_CONDITIONS.includes(activeTool)) {
        // Condición de diente completo
        updated = { surfaces: {}, whole: activeTool as ToothData["whole"] }
      } else {
        // Condición de superficie individual — si había whole, se reemplaza
        updated = {
          surfaces: { ...tooth.surfaces, [surface]: activeTool },
          whole: undefined,
        }
      }

      const next: OdontogramData = {
        ...prev,
        [dentition]: { ...prev[dentition], [key]: updated },
      }
      onChange(next)
      return next
    })
  }, [activeTool, readOnly, onChange])

  const midlineW = CELL * 16 + GAP * 15 + 16  // approx total chart width + midline gap

  return (
    <div className="space-y-4">
      {/* Paleta */}
      {!readOnly && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground text-center">
            Selecciona una condición y haz click en la superficie del diente.
            <span className="ml-1 text-muted-foreground/60">● = aplica al diente completo</span>
          </p>
          <ToolPalette active={activeTool} onChange={setActiveTool} />
        </div>
      )}

      {/* Cuadrícula */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-max">
          {/* Etiquetas de cuadrante */}
          <div className="flex justify-center mb-1">
            <div style={{ width: CELL * 8 + GAP * 7 }} className="text-center text-[9px] text-muted-foreground font-medium">
              Superior Derecha (D)
            </div>
            <div style={{ width: 16 }} />
            <div style={{ width: CELL * 8 + GAP * 7 }} className="text-center text-[9px] text-muted-foreground font-medium">
              Superior Izquierda (I)
            </div>
          </div>

          {/* ─── Fila permanentes superiores ─── */}
          <div className="flex justify-center" style={{ gap: 16 }}>
            <ToothRowGroup
              teeth={PERM_UPPER_RIGHT} dentition="permanent"
              isLower={false} data={data} activeTool={activeTool}
              onSurfaceClick={handleSurfaceClick}
            />
            <ToothRowGroup
              teeth={PERM_UPPER_LEFT} dentition="permanent"
              isLower={false} data={data} activeTool={activeTool}
              onSurfaceClick={handleSurfaceClick}
            />
          </div>

          {/* ─── Fila temporales superiores (alineados con interiores) ─── */}
          <div className="flex justify-center mt-0.5" style={{ gap: 16 }}>
            {/* Derecha: espaciador + 55 54 53 52 51 */}
            <div className="flex" style={{ gap: GAP }}>
              <div style={{ width: SPACER }} />
              <ToothRowGroup
                teeth={PRIM_UPPER_RIGHT} dentition="primary" isPrimary
                isLower={false} data={data} activeTool={activeTool}
                onSurfaceClick={handleSurfaceClick}
              />
            </div>
            {/* Izquierda: 61 62 63 64 65 + espaciador */}
            <div className="flex" style={{ gap: GAP }}>
              <ToothRowGroup
                teeth={PRIM_UPPER_LEFT} dentition="primary" isPrimary
                isLower={false} data={data} activeTool={activeTool}
                onSurfaceClick={handleSurfaceClick}
              />
              <div style={{ width: SPACER }} />
            </div>
          </div>

          {/* ─── Línea de la línea media ─── */}
          <div className="my-2 flex justify-center">
            <div
              className="border-t-2 border-gray-400"
              style={{ width: CELL * 16 + GAP * 15 + 16 }}
            />
          </div>

          {/* ─── Fila temporales inferiores ─── */}
          <div className="flex justify-center mb-0.5" style={{ gap: 16 }}>
            <div className="flex" style={{ gap: GAP }}>
              <div style={{ width: SPACER }} />
              <ToothRowGroup
                teeth={PRIM_LOWER_RIGHT} dentition="primary" isPrimary
                isLower={true} data={data} activeTool={activeTool}
                onSurfaceClick={handleSurfaceClick}
              />
            </div>
            <div className="flex" style={{ gap: GAP }}>
              <ToothRowGroup
                teeth={PRIM_LOWER_LEFT} dentition="primary" isPrimary
                isLower={true} data={data} activeTool={activeTool}
                onSurfaceClick={handleSurfaceClick}
              />
              <div style={{ width: SPACER }} />
            </div>
          </div>

          {/* ─── Fila permanentes inferiores ─── */}
          <div className="flex justify-center" style={{ gap: 16 }}>
            <ToothRowGroup
              teeth={PERM_LOWER_RIGHT} dentition="permanent"
              isLower={true} data={data} activeTool={activeTool}
              onSurfaceClick={handleSurfaceClick}
            />
            <ToothRowGroup
              teeth={PERM_LOWER_LEFT} dentition="permanent"
              isLower={true} data={data} activeTool={activeTool}
              onSurfaceClick={handleSurfaceClick}
            />
          </div>

          {/* Etiquetas inferiores */}
          <div className="flex justify-center mt-1">
            <div style={{ width: CELL * 8 + GAP * 7 }} className="text-center text-[9px] text-muted-foreground font-medium">
              Inferior Derecha (D)
            </div>
            <div style={{ width: 16 }} />
            <div style={{ width: CELL * 8 + GAP * 7 }} className="text-center text-[9px] text-muted-foreground font-medium">
              Inferior Izquierda (I)
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="border rounded-lg p-3 bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Leyenda</p>
        <Legend />
        <p className="text-xs text-muted-foreground mt-2 opacity-70">
          Numeración FDI • Dientes permanentes: 11–48 • Temporales: 51–85
        </p>
      </div>
    </div>
  )
}
