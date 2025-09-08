"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PentagonIcon as PolygonIcon, Trash2, Layers, Satellite, MapPin } from "lucide-react"
import type { google } from "google-maps"
import { googleMapsLoader } from "@/lib/google-maps-loader"

interface PolygonData {
  id: string
  name: string
  coordinates: google.maps.LatLng[]
  area: number
  ndvi: number
  status: "excellent" | "healthy" | "poor"
}

interface GoogleMapsIntegrationProps {
  onPolygonSelect?: (polygon: PolygonData | null) => void
  selectedPolygon?: string | null
}

declare global {
  interface Window {
    initMap: () => void
  }
}

export default function GoogleMapsIntegration({ onPolygonSelect, selectedPolygon }: GoogleMapsIntegrationProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null)
  const [polygons, setPolygons] = useState<PolygonData[]>([])
  const [mapPolygons, setMapPolygons] = useState<google.maps.Polygon[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [mapType, setMapType] = useState<"satellite" | "hybrid">("satellite")
  const [selectedPolygonCoords, setSelectedPolygonCoords] = useState<google.maps.LatLng[] | null>(null)

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -74.006 }, // Default to NYC, will be updated with user location
      zoom: 15,
      mapTypeId: window.google.maps.MapTypeId.SATELLITE,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    })

    const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: "#10b981",
        fillOpacity: 0.3,
        strokeColor: "#059669",
        strokeWeight: 2,
        clickable: true,
        editable: true,
      },
    })

    drawingManagerInstance.setMap(mapInstance)

    drawingManagerInstance.addListener("polygoncomplete", (polygon: google.maps.Polygon) => {
      const path = polygon.getPath()
      const coordinates: google.maps.LatLng[] = []

      for (let i = 0; i < path.getLength(); i++) {
        coordinates.push(path.getAt(i))
      }

      const area = window.google.maps.geometry.spherical.computeArea(path) / 10000 // Convert to hectares
      const newPolygonData: PolygonData = {
        id: `field-${Date.now()}`,
        name: `Field ${polygons.length + 1}`,
        coordinates,
        area: Math.round(area * 100) / 100,
        ndvi: Math.random() * 0.4 + 0.4,
        status: Math.random() > 0.5 ? "healthy" : "excellent",
      }

      setPolygons((prev) => [...prev, newPolygonData])
      setMapPolygons((prev) => [...prev, polygon])

      polygon.addListener("click", () => {
        if (onPolygonSelect) {
          onPolygonSelect(newPolygonData)
          setSelectedPolygonCoords(coordinates)
        }
      })

      drawingManagerInstance.setDrawingMode(null)
      setIsDrawing(false)
    })

    setMap(mapInstance)
    setDrawingManager(drawingManagerInstance)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          mapInstance.setCenter(userLocation)
          mapInstance.setZoom(16)
        },
        () => {
          console.log("Geolocation failed, using default location")
        }
      )
    }
  }, [polygons.length, onPolygonSelect])

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        if (googleMapsLoader.isGoogleMapsLoaded()) {
          initializeMap()
          return
        }

        await googleMapsLoader.load({ libraries: ['drawing', 'geometry'] })
        initializeMap()
      } catch (error) {
        console.error('Failed to load Google Maps:', error)
      }
    }

    loadGoogleMaps()
  }, [initializeMap])

  const startDrawing = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON)
      setIsDrawing(true)
    }
  }

  const stopDrawing = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(null)
      setIsDrawing(false)
    }
  }

  const deleteSelectedPolygon = () => {
    if (!selectedPolygon) return

    const polygonIndex = polygons.findIndex((p) => p.id === selectedPolygon)
    if (polygonIndex !== -1) {
      if (mapPolygons[polygonIndex]) {
        mapPolygons[polygonIndex].setMap(null)
      }

      setPolygons((prev) => prev.filter((p) => p.id !== selectedPolygon))
      setMapPolygons((prev) => prev.filter((_, index) => index !== polygonIndex))

      if (onPolygonSelect) {
        onPolygonSelect(null)
        setSelectedPolygonCoords(null)
      }
    }
  }

  const toggleMapType = () => {
    if (map) {
      const newType = mapType === "satellite" ? "hybrid" : "satellite"
      map.setMapTypeId(
        newType === "satellite" ? window.google.maps.MapTypeId.SATELLITE : window.google.maps.MapTypeId.HYBRID
      )
      setMapType(newType)
    }
  }

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6)
  }

  const getPolygonCenter = (coordinates: google.maps.LatLng[]) => {
    if (coordinates.length === 0) return null

    let lat = 0
    let lng = 0
    coordinates.forEach((coord) => {
      lat += coord.lat()
      lng += coord.lng()
    })

    return {
      lat: lat / coordinates.length,
      lng: lng / coordinates.length,
    }
  }

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={isDrawing ? "default" : "outline"}
          size="sm"
          onClick={isDrawing ? stopDrawing : startDrawing}
          className="flex items-center gap-2"
        >
          <PolygonIcon className="w-4 h-4" />
          {isDrawing ? "Stop Drawing" : "Draw Field"}
        </Button>

        <Button variant="outline" size="sm" onClick={toggleMapType} className="flex items-center gap-2 bg-transparent">
          {mapType === "satellite" ? <Layers className="w-4 h-4" /> : <Satellite className="w-4 h-4" />}
          {mapType === "satellite" ? "Hybrid View" : "Satellite View"}
        </Button>

        {selectedPolygon && (
          <Button variant="destructive" size="sm" onClick={deleteSelectedPolygon} className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Field
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Excellent
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            Healthy
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            Poor
          </Badge>
        </div>
      </div>

      {/* Selected Polygon Coordinates Display */}
      {selectedPolygonCoords && (
        <Card className="bg-cyan-50 border-cyan-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-cyan-600" />
              <h3 className="font-semibold text-cyan-800">Selected Field Coordinates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-cyan-700 mb-2">Boundary Points</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedPolygonCoords.map((coord, index) => (
                    <div key={index} className="text-xs font-mono bg-white p-2 rounded border">
                      Point {index + 1}: {formatCoordinate(coord.lat())}, {formatCoordinate(coord.lng())}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-cyan-700 mb-2">Field Center</h4>
                {(() => {
                  const center = getPolygonCenter(selectedPolygonCoords)
                  return center ? (
                    <div className="text-xs font-mono bg-white p-2 rounded border">
                      Center: {formatCoordinate(center.lat)}, {formatCoordinate(center.lng)}
                    </div>
                  ) : null
                })()}
                <h4 className="text-sm font-medium text-cyan-700 mt-3 mb-2">Total Points</h4>
                <div className="text-xs font-mono bg-white p-2 rounded border">
                  {selectedPolygonCoords.length} boundary points
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Maps Container */}
      <Card>
        <CardContent className="p-0">
          <div ref={mapRef} className="w-full h-96 rounded-lg" style={{ minHeight: "400px" }} />
        </CardContent>
      </Card>

      {/* Drawing Instructions */}
      {isDrawing && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <p className="font-medium mb-1">Drawing Mode Active</p>
          <p>
            Click on the map to add points to your field boundary. Click the first point again to complete the polygon.
          </p>
        </div>
      )}

      {/* Field List */}
      {polygons.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Your Fields</h3>
            <div className="space-y-2">
              {polygons.map((polygon) => (
                <div
                  key={polygon.id}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedPolygon === polygon.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    onPolygonSelect?.(polygon)
                    setSelectedPolygonCoords(polygon.coordinates)
                  }}
                >
                  <div>
                    <p className="font-medium">{polygon.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {polygon.area} ha • NDVI: {polygon.ndvi.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant={polygon.status === "excellent" ? "default" : "secondary"}>{polygon.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
