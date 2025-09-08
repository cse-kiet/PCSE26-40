"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, MapPin, Trash2, Layers, Satellite, PentagonIcon as PolygonIcon } from "lucide-react"
import { getAgromonitoringAPI } from "@/lib/agromonitoring-api"
import type { PolygonResponse } from "@/lib/agromonitoring-api"
import { googleMapsLoader } from "@/lib/google-maps-loader"
import type { GeocodingResult } from "@/lib/geocoding-api"

interface GoogleMapsFieldCreatorProps {
  onPolygonCreated?: (polygon: PolygonResponse) => void
  onPolygonSelected?: (polygon: PolygonResponse) => void
  existingPolygons?: PolygonResponse[]
  selectedPolygon?: PolygonResponse | null
  initialLocation?: GeocodingResult | null
}

declare global {
  interface Window {
    google: typeof google
    initMap?: () => void
  }
}

export default function GoogleMapsFieldCreator({ 
  onPolygonCreated, 
  onPolygonSelected,
  existingPolygons = [], 
  selectedPolygon,
  initialLocation
}: GoogleMapsFieldCreatorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const polygonRefs = useRef<google.maps.Polygon[]>([])
  const hasCenteredOnPincode = useRef<boolean>(false) // Track if we've already centered on pincode
  const shouldPreventGeolocation = useRef<boolean>(false) // Prevent browser geolocation from overriding pincode
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [fieldName, setFieldName] = useState("")
  const [drawnCoordinates, setDrawnCoordinates] = useState<Array<{ lat: number; lng: number }>>([])
  const [isCreating, setIsCreating] = useState(false)
  const [mapType, setMapType] = useState<"satellite" | "hybrid">("satellite")
  const [selectedFieldForZoom, setSelectedFieldForZoom] = useState<string>("")

  // Load Google Maps API using shared loader
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

  // Update map center and zoom when initialLocation changes
  useEffect(() => {
    if (mapInstanceRef.current && initialLocation && !hasCenteredOnPincode.current) {
      console.log("[GoogleMapsFieldCreator] Updating map with pincode location:", initialLocation)
      const pincodeLocation = { lat: initialLocation.lat, lng: initialLocation.lng }
      mapInstanceRef.current.setCenter(pincodeLocation)
      mapInstanceRef.current.setZoom(18) // Higher zoom for better pinpointing near coordinates
      hasCenteredOnPincode.current = true // Mark that we've centered on pincode
      shouldPreventGeolocation.current = true // Prevent browser geolocation from overriding
      console.log("[GoogleMapsFieldCreator] Pincode location set with precise zoom, preventing further geolocation changes")
      
      // Add a slight delay to ensure the location sticks
      setTimeout(() => {
        if (mapInstanceRef.current && shouldPreventGeolocation.current) {
          mapInstanceRef.current.setCenter(pincodeLocation)
          mapInstanceRef.current.setZoom(18) // Maintain higher zoom for precision
          console.log("[GoogleMapsFieldCreator] Re-confirmed pincode location with precise zoom after timeout")
        }
      }, 3000) // Re-confirm after 3 seconds
    }
  }, [initialLocation])

  // Update existing polygons when they change
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      displayExistingPolygons()
    }
  }, [existingPolygons, selectedPolygon, isLoaded])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    // Determine initial center location
    const defaultCenter = { lat: 40.7128, lng: -74.006 } // NYC as fallback
    const initialCenter = initialLocation 
      ? { lat: initialLocation.lat, lng: initialLocation.lng }
      : defaultCenter

    console.log("[GoogleMapsFieldCreator] Initializing map with center:", initialCenter)
    console.log("[GoogleMapsFieldCreator] Initial zoom level:", initialLocation ? 18 : 13)

    // Create map
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: initialLocation ? 18 : 13, // Higher zoom for pincode location, lower for default
      center: initialCenter,
      mapTypeId: window.google.maps.MapTypeId.SATELLITE,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_CENTER,
      },
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    })

    mapInstanceRef.current = map

    // Initialize drawing manager
    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false, // We'll use custom controls
      polygonOptions: {
        strokeColor: "#10b981",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: "#10b981",
        fillOpacity: 0.25,
        editable: true,
        draggable: false,
      },
    })

    drawingManager.setMap(map)
    drawingManagerRef.current = drawingManager

    // Handle polygon completion
    drawingManager.addListener("polygoncomplete", (polygon: google.maps.Polygon) => {
      handlePolygonComplete(polygon)
    })

    // Only try browser geolocation if we don't have pincode location and haven't already set it
    if (!initialLocation && !shouldPreventGeolocation.current && navigator.geolocation) {
      console.log("[GoogleMapsFieldCreator] No pincode location, trying browser geolocation")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Double-check that we haven't set pincode location while waiting for geolocation
          if (!shouldPreventGeolocation.current) {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            map.setCenter(userLocation)
            map.setZoom(18) // Higher zoom for better pinpointing
            console.log("[GoogleMapsFieldCreator] Using browser geolocation with precise zoom:", userLocation)
          } else {
            console.log("[GoogleMapsFieldCreator] Browser geolocation ignored - pincode location already set")
          }
        },
        () => {
          console.log("Geolocation failed, using default/pincode location")
        }
      )
    } else if (initialLocation) {
      console.log("[GoogleMapsFieldCreator] Using provided initial location:", initialLocation)
      shouldPreventGeolocation.current = true // Prevent any later geolocation attempts
    }
  }

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    setIsDrawing(false)
    
    // Extract coordinates
    const path = polygon.getPath()
    const coordinates: Array<{ lat: number; lng: number }> = []
    
    for (let i = 0; i < path.getLength(); i++) {
      const latLng = path.getAt(i)
      coordinates.push({
        lat: latLng.lat(),
        lng: latLng.lng()
      })
    }

    // Calculate area using Google Maps geometry library
    const area = window.google.maps.geometry.spherical.computeArea(path) / 10000 // Convert to hectares

    console.log(`[GoogleMaps] Polygon drawn with ${coordinates.length} points, area: ${area.toFixed(2)} ha`)

    setDrawnCoordinates(coordinates)
    setShowNameDialog(true)

    // Temporarily hide the drawn polygon
    polygon.setMap(null)
    
    // Reset drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null)
    }
  }

  const displayExistingPolygons = () => {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing polygon overlays
    polygonRefs.current.forEach(polygon => polygon.setMap(null))
    polygonRefs.current = []

    // Add polygons to map
    existingPolygons.forEach((polygonData) => {
      const coordinates = polygonData.geo_json.geometry.coordinates[0].map(coord => ({
        lat: coord[1], // Convert [lng, lat] to {lat, lng}
        lng: coord[0]
      }))

      const isSelected = selectedPolygon?.id === polygonData.id

      const polygon = new window.google.maps.Polygon({
        paths: coordinates,
        strokeColor: isSelected ? "#ef4444" : "#10b981",
        strokeOpacity: 0.8,
        strokeWeight: isSelected ? 4 : 2,
        fillColor: isSelected ? "#ef4444" : "#10b981",
        fillOpacity: isSelected ? 0.4 : 0.25,
        clickable: true
      })

      polygon.setMap(mapInstanceRef.current)
      polygonRefs.current.push(polygon)

      // Add click listener
      polygon.addListener("click", () => {
        onPolygonSelected?.(polygonData)
        
        // Only center map on polygon when user explicitly clicks on it
        const bounds = new window.google.maps.LatLngBounds()
        coordinates.forEach(coord => bounds.extend(coord))
        mapInstanceRef.current?.fitBounds(bounds)
      })

      // Add info window on hover
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${polygonData.name}</h3>
            <p style="margin: 4px 0; font-size: 13px; color: #666;">
              Area: ${polygonData.area.toFixed(2)} hectares
            </p>
            <p style="margin: 4px 0; font-size: 11px; color: #888;">
              ID: ${polygonData.id.slice(-8)}...
            </p>
            ${isSelected ? '<p style="margin: 4px 0; font-size: 11px; color: #ef4444; font-weight: bold;">Currently Selected</p>' : ''}
            <p style="margin: 4px 0; font-size: 11px; color: #666;">
              Click to select this field
            </p>
          </div>
        `,
      })

      polygon.addListener("mouseover", (e: google.maps.PolyMouseEvent) => {
        if (e.latLng && mapInstanceRef.current) {
          infoWindow.setPosition(e.latLng)
          infoWindow.open(mapInstanceRef.current)
        }
      })

      polygon.addListener("mouseout", () => {
        infoWindow.close()
      })
    })

    // REMOVED: Automatic fitBounds that was causing unwanted zoom-out
    // The map will now preserve the user's current zoom level and position
    // Only zoom when user explicitly clicks on a polygon
  }

  const handleCreateField = async () => {
    if (!fieldName.trim() || drawnCoordinates.length < 3) return

    setIsCreating(true)
    try {
      console.log(`[GoogleMaps] Creating field "${fieldName}" with coordinates:`, drawnCoordinates)
      
      const api = getAgromonitoringAPI()
      const newPolygon = await api.createPolygon(fieldName.trim(), drawnCoordinates)
      
      console.log("[GoogleMaps] Successfully created polygon in Agromonitoring:", newPolygon)
      
      // Notify parent component
      onPolygonCreated?.(newPolygon)
      
      // Reset state
      setFieldName("")
      setDrawnCoordinates([])
      setShowNameDialog(false)
      setSelectedFieldForZoom("") // Reset field selector
      
      // The parent will update existingPolygons, which will trigger displayExistingPolygons
      
    } catch (err) {
      console.error("Failed to create polygon in Agromonitoring:", err)
      setError(`Failed to create field: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
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

  const zoomToSelectedField = (fieldId: string) => {
    if (!mapInstanceRef.current || !fieldId) return
    
    const field = existingPolygons.find(p => p.id === fieldId)
    if (!field) return
    
    const coordinates = field.geo_json.geometry.coordinates[0].map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }))
    
    const bounds = new window.google.maps.LatLngBounds()
    coordinates.forEach(coord => bounds.extend(coord))
    mapInstanceRef.current.fitBounds(bounds)
    
    // Also select the field
    onPolygonSelected?.(field)
  }

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6)
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Map Error
          </CardTitle>
          <CardDescription>Unable to load Google Maps</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading Google Maps...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={isDrawing ? "default" : "outline"}
          size="sm"
          onClick={isDrawing ? cancelDrawing : startDrawing}
          className="flex items-center gap-2"
        >
          <PolygonIcon className="w-4 h-4" />
          {isDrawing ? "Cancel Drawing" : "Draw New Field"}
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleMapType} 
          className="flex items-center gap-2"
        >
          {mapType === "satellite" ? <Layers className="w-4 h-4" /> : <Satellite className="w-4 h-4" />}
          {mapType === "satellite" ? "Hybrid View" : "Satellite View"}
        </Button>

        {existingPolygons.length > 0 && (
          <Select 
            value={selectedFieldForZoom} 
            onValueChange={(value) => {
              setSelectedFieldForZoom(value)
              zoomToSelectedField(value)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select field to zoom to" />
            </SelectTrigger>
            <SelectContent>
              {existingPolygons.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {field.name} ({field.area.toFixed(1)} ha)
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          Fields: {existingPolygons.length}
          {selectedPolygon && (
            <Badge variant="default" className="ml-2">
              Selected: {selectedPolygon.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <div ref={mapRef} className="w-full h-96 rounded-lg" />
            
            {isDrawing && (
              <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
                <p className="text-sm font-medium text-green-600 mb-1">✏️ Drawing Mode Active</p>
                <p className="text-xs text-gray-600">
                  Click on the map to place boundary points. Click the first point again to complete the field boundary.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Field Coordinates */}
      {selectedPolygon && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800">
                Selected Field: {selectedPolygon.name}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-700">Area: {selectedPolygon.area.toFixed(2)} hectares</p>
                <p className="text-blue-600">Center: {formatCoordinate(selectedPolygon.center[1])}, {formatCoordinate(selectedPolygon.center[0])}</p>
              </div>
              <div>
                <p className="font-medium text-blue-700">Polygon ID: {selectedPolygon.id.slice(-12)}...</p>
                <p className="text-blue-600">Points: {selectedPolygon.geo_json.geometry.coordinates[0].length - 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Field</DialogTitle>
            <DialogDescription>
              Give your newly drawn field a name. This will create a monitoring polygon in Agromonitoring.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">Field Name</Label>
              <Input
                id="field-name"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g., North Field, Corn Plot A, Rice Paddy 1"
                autoFocus
              />
            </div>
            
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">Field Details:</p>
              <p>• Boundary points: {drawnCoordinates.length}</p>
              <p>• Will be created in Agromonitoring for satellite monitoring</p>
              <p>• You'll be able to track NDVI, soil, weather, and UV data</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNameDialog(false)
                setFieldName("")
                setDrawnCoordinates([])
                setSelectedFieldForZoom("") // Reset field selector
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateField}
              disabled={!fieldName.trim() || isCreating}
            >
              {isCreating ? "Creating in Agromonitoring..." : "Create Field"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drawing Instructions */}
      {existingPolygons.length === 0 && !isDrawing && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-green-800 mb-2">Get Started</h3>
            <p className="text-sm text-green-600 mb-3">
              Draw your first field boundary to start monitoring with satellite data
            </p>
            <Button onClick={startDrawing} size="sm">
              <PolygonIcon className="w-4 h-4 mr-2" />
              Draw Your First Field
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
