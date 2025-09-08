"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Trash2, Satellite, PentagonIcon as PolygonIcon } from "lucide-react"
import { googleMapsLoader } from "@/lib/google-maps-loader"

interface FarmField {
  id: string
  name: string
  coordinates: string // GeoJSON polygon
  area: number
  cropType?: string
}

interface SimpleFieldCreatorProps {
  onFieldsCreated: (fields: FarmField[]) => void
  initialCenter?: { lat: number; lng: number }
}

declare global {
  interface Window {
    google: typeof google
    initMap?: () => void
  }
}

export function SimpleFieldCreator({ onFieldsCreated, initialCenter }: SimpleFieldCreatorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const polygonRefs = useRef<google.maps.Polygon[]>([])
  const previousFieldsRef = useRef<FarmField[]>([])
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [fieldName, setFieldName] = useState("")
  const [drawnCoordinates, setDrawnCoordinates] = useState<Array<{ lat: number; lng: number }>>([])
  const [fields, setFields] = useState<FarmField[]>([])
  const [mapType, setMapType] = useState<"satellite" | "hybrid">("satellite")

  // Load Google Maps API
  useEffect(() => {
    if (googleMapsLoader.isGoogleMapsLoaded()) {
      setIsLoaded(true)
      return
    }

    googleMapsLoader.load({ libraries: ['drawing', 'geometry'] })
      .then(() => {
        setIsLoaded(true)
      })
      .catch((err) => {
        setError(err.message || "Failed to load Google Maps API. Please check your API key configuration.")
      })
  }, [])

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap()
    }
  }, [isLoaded])

  // Update fields in parent component whenever fields change
  useEffect(() => {
    // Only call onFieldsCreated if fields actually changed
    const fieldsChanged = JSON.stringify(fields) !== JSON.stringify(previousFieldsRef.current)
    if (fieldsChanged) {
      previousFieldsRef.current = fields
      onFieldsCreated(fields)
    }
  }, [fields]) // Removed onFieldsCreated from dependency array to prevent infinite loops

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const center = initialCenter || { lat: 20.5937, lng: 78.9629 } // Default to India center

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: initialCenter ? 15 : 6,
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
      const coordinates: Array<{ lat: number; lng: number }> = []

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i)
        coordinates.push({ lat: point.lat(), lng: point.lng() })
      }

      setDrawnCoordinates(coordinates)
      setShowNameDialog(true)
      
      // Stop drawing mode
      drawingManagerInstance.setDrawingMode(null)
      setIsDrawing(false)
      
      // Store reference to polygon for potential deletion
      polygonRefs.current.push(polygon)
    })

    mapInstanceRef.current = mapInstance
    drawingManagerRef.current = drawingManagerInstance

    // Get user location if available and no initial center provided
    if (!initialCenter && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          mapInstance.setCenter(userLocation)
          mapInstance.setZoom(15)
        },
        (error) => {
          console.log("Could not get user location:", error)
        }
      )
    }
  }

  const convertToGeoJSON = (coordinates: Array<{ lat: number; lng: number }>): string => {
    // Close the polygon by adding the first point at the end
    const closedCoordinates = [...coordinates, coordinates[0]]
    
    return JSON.stringify({
      type: "Polygon",
      coordinates: [closedCoordinates.map(coord => [coord.lng, coord.lat])]
    })
  }

  const calculateArea = (coordinates: Array<{ lat: number; lng: number }>): number => {
    if (!window.google || coordinates.length < 3) return 0

    const path = coordinates.map(coord => new window.google.maps.LatLng(coord.lat, coord.lng))
    const polygon = new window.google.maps.Polygon({ paths: path })
    const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath()) / 10000 // Convert to hectares
    
    return Math.round(area * 100) / 100
  }

  const handleCreateField = () => {
    if (!fieldName.trim() || drawnCoordinates.length < 3) return

    const area = calculateArea(drawnCoordinates)
    const geoJSON = convertToGeoJSON(drawnCoordinates)

    const newField: FarmField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: fieldName.trim(),
      coordinates: geoJSON,
      area
    }

    setFields(prev => [...prev, newField])
    
    // Reset state
    setFieldName("")
    setDrawnCoordinates([])
    setShowNameDialog(false)
  }

  const cancelFieldCreation = () => {
    // Remove the last drawn polygon
    const lastPolygon = polygonRefs.current.pop()
    if (lastPolygon) {
      lastPolygon.setMap(null)
    }
    
    setFieldName("")
    setDrawnCoordinates([])
    setShowNameDialog(false)
  }

  const startDrawing = () => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON)
      setIsDrawing(true)
    }
  }

  const cancelDrawing = () => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null)
    }
    setIsDrawing(false)
  }

  const deleteField = (fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId))
    
    // Remove polygon from map (this is simplified - in a full implementation, 
    // you'd want to track which polygon corresponds to which field)
    const polygonToRemove = polygonRefs.current.pop()
    if (polygonToRemove) {
      polygonToRemove.setMap(null)
    }
  }

  const toggleMapType = () => {
    if (mapInstanceRef.current) {
      const newType = mapType === "satellite" ? "hybrid" : "satellite"
      mapInstanceRef.current.setMapTypeId(
        newType === "satellite" 
          ? window.google.maps.MapTypeId.SATELLITE 
          : window.google.maps.MapTypeId.HYBRID
      )
      setMapType(newType)
    }
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">⚠️ Map Loading Error</div>
          <div className="text-sm text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading Google Maps...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Map Controls */}
      <div className="flex justify-between items-center p-3 bg-white border-b">
        <div className="flex gap-2">
          <Button
            onClick={startDrawing}
            disabled={isDrawing}
            variant={isDrawing ? "default" : "outline"}
            size="sm"
          >
            <PolygonIcon className="w-4 h-4 mr-2" />
            {isDrawing ? "Drawing..." : "Draw Field"}
          </Button>
          
          {isDrawing && (
            <Button onClick={cancelDrawing} variant="outline" size="sm">
              Cancel
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={toggleMapType} variant="outline" size="sm">
            <Satellite className="w-4 h-4 mr-2" />
            {mapType === "satellite" ? "Hybrid" : "Satellite"}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="flex-1 w-full" />

      {/* Fields List */}
      {fields.length > 0 && (
        <div className="p-3 bg-white border-t max-h-24 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {field.name} ({field.area} ha)
                <Button
                  onClick={() => deleteField(field.id)}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Field Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Field</DialogTitle>
            <DialogDescription>
              Give a name to the field you just drew ({drawnCoordinates.length > 0 ? `${calculateArea(drawnCoordinates)} hectares` : ''})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="e.g., North Field, Rice Field 1"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateField()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelFieldCreation}>
                Cancel
              </Button>
              <Button onClick={handleCreateField} disabled={!fieldName.trim()}>
                Create Field
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SimpleFieldCreator
