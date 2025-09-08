"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BoldIcon as Polygon, Trash2, Save, RotateCcw } from "lucide-react"

interface Point {
  x: number
  y: number
}

interface PolygonData {
  id: string
  name: string
  points: Point[]
  area: number
  ndvi: number
  status: "excellent" | "healthy" | "poor"
}

interface InteractiveMapProps {
  onPolygonSelect?: (polygon: PolygonData | null) => void
  selectedPolygon?: string | null
}

export default function InteractiveMap({ onPolygonSelect, selectedPolygon }: InteractiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingMode, setDrawingMode] = useState<"none" | "polygon">("none")
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([])
  const [polygons, setPolygons] = useState<PolygonData[]>([
    {
      id: "hwi",
      name: "hwi",
      points: [
        { x: 150, y: 100 },
        { x: 250, y: 80 },
        { x: 280, y: 150 },
        { x: 200, y: 180 },
        { x: 120, y: 160 },
      ],
      area: 1.8,
      ndvi: 0.65,
      status: "healthy",
    },
    {
      id: "iowa-demo",
      name: "Iowa Demo Field",
      points: [
        { x: 350, y: 120 },
        { x: 480, y: 100 },
        { x: 500, y: 200 },
        { x: 380, y: 220 },
        { x: 320, y: 180 },
      ],
      area: 203.0,
      ndvi: 0.72,
      status: "excellent",
    },
  ])

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw satellite imagery background (simulated with gradient)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#4ade80")
    gradient.addColorStop(0.3, "#22c55e")
    gradient.addColorStop(0.6, "#16a34a")
    gradient.addColorStop(1, "#15803d")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add some texture patterns to simulate satellite imagery
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = Math.random() * 30 + 10
      ctx.fillRect(x, y, size, size)
    }

    // Draw existing polygons
    polygons.forEach((polygon) => {
      if (polygon.points.length < 3) return

      ctx.beginPath()
      ctx.moveTo(polygon.points[0].x, polygon.points[0].y)
      polygon.points.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.closePath()

      // Fill based on NDVI status
      const isSelected = selectedPolygon === polygon.id
      if (polygon.status === "excellent") {
        ctx.fillStyle = isSelected ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)"
        ctx.strokeStyle = isSelected ? "#10b981" : "#059669"
      } else if (polygon.status === "healthy") {
        ctx.fillStyle = isSelected ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 0.2)"
        ctx.strokeStyle = isSelected ? "#f59e0b" : "#d97706"
      } else {
        ctx.fillStyle = isSelected ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.2)"
        ctx.strokeStyle = isSelected ? "#ef4444" : "#dc2626"
      }

      ctx.lineWidth = isSelected ? 3 : 2
      ctx.fill()
      ctx.stroke()

      // Draw polygon label
      const centerX = polygon.points.reduce((sum, p) => sum + p.x, 0) / polygon.points.length
      const centerY = polygon.points.reduce((sum, p) => sum + p.y, 0) / polygon.points.length

      ctx.fillStyle = "#ffffff"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(polygon.name, centerX, centerY)
    })

    // Draw current polygon being drawn
    if (currentPolygon.length > 0) {
      ctx.beginPath()
      ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y)
      currentPolygon.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y)
        }
      })

      if (currentPolygon.length > 2) {
        ctx.closePath()
        ctx.fillStyle = "rgba(22, 78, 99, 0.2)"
        ctx.fill()
      }

      ctx.strokeStyle = "#164e63"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw points
      currentPolygon.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = "#164e63"
        ctx.fill()
      })
    }
  }, [polygons, currentPolygon, selectedPolygon])

  useEffect(() => {
    drawMap()
  }, [drawMap])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (drawingMode === "polygon") {
      setCurrentPolygon((prev) => [...prev, { x, y }])
    } else {
      // Check if clicking on existing polygon
      const clickedPolygon = polygons.find((polygon) => {
        return isPointInPolygon({ x, y }, polygon.points)
      })

      if (clickedPolygon && onPolygonSelect) {
        onPolygonSelect(clickedPolygon)
      }
    }
  }

  const isPointInPolygon = (point: Point, polygonPoints: Point[]): boolean => {
    let inside = false
    for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
      if (
        polygonPoints[i].y > point.y !== polygonPoints[j].y > point.y &&
        point.x <
          ((polygonPoints[j].x - polygonPoints[i].x) * (point.y - polygonPoints[i].y)) /
            (polygonPoints[j].y - polygonPoints[i].y) +
            polygonPoints[i].x
      ) {
        inside = !inside
      }
    }
    return inside
  }

  const calculateArea = (points: Point[]): number => {
    if (points.length < 3) return 0
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    return Math.abs(area) / 2 / 1000 // Convert to approximate hectares
  }

  const savePolygon = () => {
    if (currentPolygon.length < 3) return

    const area = calculateArea(currentPolygon)
    const newPolygon: PolygonData = {
      id: `field-${Date.now()}`,
      name: `Field ${polygons.length + 1}`,
      points: [...currentPolygon],
      area: Math.round(area * 10) / 10,
      ndvi: Math.random() * 0.4 + 0.4, // Random NDVI between 0.4-0.8
      status: Math.random() > 0.5 ? "healthy" : "excellent",
    }

    setPolygons((prev) => [...prev, newPolygon])
    setCurrentPolygon([])
    setDrawingMode("none")
  }

  const cancelDrawing = () => {
    setCurrentPolygon([])
    setDrawingMode("none")
  }

  const deleteSelectedPolygon = () => {
    if (!selectedPolygon) return
    setPolygons((prev) => prev.filter((p) => p.id !== selectedPolygon))
    if (onPolygonSelect) {
      onPolygonSelect(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={drawingMode === "polygon" ? "default" : "outline"}
          size="sm"
          onClick={() => setDrawingMode(drawingMode === "polygon" ? "none" : "polygon")}
          className="flex items-center gap-2"
        >
          <Polygon className="w-4 h-4" />
          {drawingMode === "polygon" ? "Stop Drawing" : "Draw Field"}
        </Button>

        {currentPolygon.length > 2 && (
          <>
            <Button size="sm" onClick={savePolygon} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Field
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cancelDrawing}
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCcw className="w-4 h-4" />
              Cancel
            </Button>
          </>
        )}

        {selectedPolygon && (
          <Button variant="destructive" size="sm" onClick={deleteSelectedPolygon} className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Field
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
            Excellent
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
            Healthy
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 bg-chart-4 rounded-full"></div>
            Poor
          </Badge>
        </div>
      </div>

      {/* Map Canvas */}
      <Card>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full h-auto border rounded-lg cursor-crosshair"
            onClick={handleCanvasClick}
          />
        </CardContent>
      </Card>

      {/* Drawing Instructions */}
      {drawingMode === "polygon" && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <p className="font-medium mb-1">Drawing Mode Active</p>
          <p>Click on the map to add points to your field boundary. You need at least 3 points to create a field.</p>
        </div>
      )}
    </div>
  )
}
