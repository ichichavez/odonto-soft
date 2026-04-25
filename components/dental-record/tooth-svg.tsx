"use client"

import React from "react"

// ─── Tooth type classification ────────────────────────────────────────────────

type ToothType = "incisor" | "canine" | "premolar" | "molar" | "wisdom"

function getToothType(n: number): ToothType {
  const d = n % 10
  if (d === 8) return "wisdom"
  if (d === 6 || d === 7) return "molar"
  if (d === 4 || d === 5) return "premolar"
  if (d === 3) return "canine"
  return "incisor" // 1, 2
}

// ─── SVG paths — viewBox "0 0 42 70" ─────────────────────────────────────────
//
//   Crown : y  0 – 30   (above the CEJ line)
//   CEJ   : y = 30      (cemento-enamel junction = gingival reference)
//   Root  : y 30 – 70   (below the CEJ line)
//
// Paths are closed shapes that cover the full tooth silhouette.
// The clipPath is built from the same shape so pocket-depth bars stay inside.

const TOOTH_PATH: Record<ToothType, string> = {
  // Incisors — rectangular crown, single conical root
  incisor:
    "M 10,30 C 9,16 11,3 21,1 C 31,3 33,16 32,30 Q 30,52 21,66 Q 12,52 10,30 Z",

  // Canine — pointed cusp, long single root
  canine:
    "M 10,30 C 9,14 13,2 21,0 C 29,2 33,14 32,30 Q 29,55 21,70 Q 13,55 10,30 Z",

  // Premolar — two cusps, narrower root
  premolar:
    "M 9,30 C 8,20 9,10 13,5 Q 17,1 21,5 Q 25,1 29,5 C 33,10 34,20 33,30 Q 31,52 21,66 Q 11,52 9,30 Z",

  // Molar — wide crown with buccal cusp humps, broader root
  molar:
    "M 4,30 C 3,20 4,10 9,4 Q 15,0 21,4 Q 27,0 33,4 C 38,10 39,20 38,30 Q 34,52 21,66 Q 8,52 4,30 Z",

  // Wisdom — compact molar-like shape
  wisdom:
    "M 6,30 C 5,22 7,10 12,5 Q 16,2 19,5 Q 23,2 26,5 C 33,10 36,22 36,30 Q 33,50 21,64 Q 9,50 6,30 Z",
}

// Dashed bifurcation line inside root (for multi-rooted teeth)
const ROOT_SEP: Record<ToothType, string | null> = {
  incisor:  null,
  canine:   null,
  premolar: "M 21,38 L 21,60",
  molar:    "M 21,36 L 21,62",
  wisdom:   null,
}

// ─── Color by PS depth ────────────────────────────────────────────────────────

function psColor(v: number): string {
  if (v >= 6) return "#ef4444"  // red    — severe
  if (v >= 4) return "#f97316"  // orange — moderate
  if (v >  0) return "#22c55e"  // green  — healthy/mild
  return "transparent"
}

// Root area height in SVG units = 70 - 30 = 40 units.
// We map a maximum clinical PS of 10 mm → 36 SVG units (leaving a small margin).
const SCALE = 3.6   // SVG units per mm
const CEJ_Y = 30    // Y of the cemento-enamel junction

// ─── Component ────────────────────────────────────────────────────────────────

export interface ToothSvgProps {
  /** Unique prefix used to build the clipPath id (must be unique per page) */
  clipPrefix: string
  toothNum: number
  mesial: string
  center: string
  distal: string
  /** Flip vertically — for Palatino / Lingual views (crown faces down) */
  inverted?: boolean
}

export function ToothSvg({
  clipPrefix,
  toothNum,
  mesial,
  center,
  distal,
  inverted = false,
}: ToothSvgProps) {
  const type  = getToothType(toothNum)
  const path  = TOOTH_PATH[type]
  const sep   = ROOT_SEP[type]
  const clipId = `${clipPrefix}${toothNum}`

  const mV = Math.min(parseInt(mesial) || 0, 10)
  const cV = Math.min(parseInt(center) || 0, 10)
  const dV = Math.min(parseInt(distal) || 0, 10)

  const mH = mV * SCALE
  const cH = cV * SCALE
  const dH = dV * SCALE

  // Bar x-positions:
  //   mesial  — left third  (x=5,  w=11)
  //   center  — middle      (x=17, w=8)
  //   distal  — right third (x=26, w=11)
  // Bars are clipped to the tooth outline, so narrower roots produce
  // naturally thinner bars — no per-tooth adjustment needed.

  return (
    <svg
      viewBox="0 0 42 70"
      width="100%"
      height="58"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", transform: inverted ? "scaleY(-1)" : undefined }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>

      {/* ── White fill (tooth background) ── */}
      <path d={path} fill="white" stroke="none" />

      {/* ── Pocket depth bars — clipped inside root area ── */}
      <g clipPath={`url(#${clipId})`}>
        {mH > 0 && (
          <rect x="5"  y={CEJ_Y} width="11" height={mH} fill={psColor(mV)} fillOpacity="0.45" />
        )}
        {cH > 0 && (
          <rect x="17" y={CEJ_Y} width="8"  height={cH} fill={psColor(cV)} fillOpacity="0.45" />
        )}
        {dH > 0 && (
          <rect x="26" y={CEJ_Y} width="11" height={dH} fill={psColor(dV)} fillOpacity="0.45" />
        )}
      </g>

      {/* ── Tooth outline (drawn on top of bars) ── */}
      <path
        d={path}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* ── Root bifurcation for multi-rooted teeth ── */}
      {sep && (
        <path
          d={sep}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="0.7"
          strokeDasharray="2 2"
        />
      )}

      {/* ── CEJ / gingival margin line (red) ── */}
      <line
        x1="0"
        y1={CEJ_Y}
        x2="42"
        y2={CEJ_Y}
        stroke="#dc2626"
        strokeWidth="1.5"
      />
    </svg>
  )
}
