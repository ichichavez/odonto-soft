"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Save } from "lucide-react"

interface SignaturePadProps {
  onSave: (blob: Blob) => void
  saving?: boolean
}

export function SignaturePad({ onSave, saving }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#111827"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.fillStyle = "#111827"
  }, [])

  useEffect(() => {
    initCanvas()
  }, [initCanvas])

  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = (x: number, y: number) => {
    isDrawing.current = true
    setIsEmpty(false)
    lastPoint.current = { x, y }
    const ctx = canvasRef.current?.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      ctx.arc(x, y, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const continueDraw = (x: number, y: number) => {
    if (!isDrawing.current || !lastPoint.current) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastPoint.current = { x, y }
  }

  const stopDraw = () => {
    isDrawing.current = false
    lastPoint.current = null
  }

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(e.nativeEvent, canvas)
    startDraw(pos.x, pos.y)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(e.nativeEvent, canvas)
    continueDraw(pos.x, pos.y)
  }

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(e.touches[0], canvas)
    startDraw(pos.x, pos.y)
  }

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(e.touches[0], canvas)
    continueDraw(pos.x, pos.y)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    initCanvas()
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) onSave(blob)
    }, "image/png")
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="w-full border-2 border-dashed rounded-lg bg-white cursor-crosshair touch-none"
        style={{ maxHeight: 180 }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={stopDraw}
      />
      <p className="text-xs text-muted-foreground">
        Firme en el recuadro con el mouse o con el dedo en pantalla táctil
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty}
          type="button"
          className="gap-2"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpiar
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isEmpty || saving}
          type="button"
          className="gap-2"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Guardando..." : "Guardar firma"}
        </Button>
      </div>
    </div>
  )
}
