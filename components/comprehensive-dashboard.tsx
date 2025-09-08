"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Cloud, 
  RefreshCw, 
  MapPin, 
  Activity,
  TreePine,
  Gauge
} from "lucide-react"
import { usePolygonData } from "@/hooks/use-agromonitoring-comprehensive"
import type { PolygonResponse } from "@/lib/agromonitoring-api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import MandiPrices from "./mandi-prices"
import VendorBids from "./vendor-bids"

interface ComprehensiveDashboardProps {
  selectedPolygon: PolygonResponse | null
  cropName?: string // Primary crop for market price lookup
  userId?: string // User ID for fetching profile data
}

export default function ComprehensiveDashboard({ selectedPolygon, cropName, userId }: ComprehensiveDashboardProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setLastUpdate(new Date())
  }, [])
  
  const {
    weatherData,
    ndviData,
    soilData,
    uviData,
    loading,
    error,
    refetch,
    currentNDVI,
    currentSoil,
    currentUVI,
    ndviStatus,
    soilStatus
  } = usePolygonData(selectedPolygon?.id || null)

  const handleRefresh = async () => {
    await refetch()
    setLastUpdate(new Date())
  }

  if (!selectedPolygon) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-lg font-medium">No Field Selected</p>
              <p className="text-sm text-muted-foreground">
                Create or select a field to view comprehensive monitoring data
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with field info and refresh */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{selectedPolygon.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedPolygon.area.toFixed(2)} ha • ID: {selectedPolygon.id.slice(-8)}...
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span suppressHydrationWarning>
                  Last updated: {isClient && lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
                </span>
              </div>
              <Button onClick={handleRefresh} disabled={loading} size="sm" variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Weather Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Weather</p>
                {weatherData ? (
                  <div>
                    <p className="text-2xl font-bold">{weatherData.current.temp}°C</p>
                    <p className="text-xs text-muted-foreground capitalize">{weatherData.current.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
              </div>
              <Cloud className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* NDVI Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">NDVI Health</p>
                {currentNDVI && ndviStatus ? (
                  <div>
                    <p className="text-2xl font-bold">{currentNDVI.ndviMean.toFixed(3)}</p>
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: ndviStatus.color + '20', color: ndviStatus.color }}
                    >
                      {ndviStatus.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
              </div>
              <TreePine className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Soil Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Soil Moisture</p>
                {currentSoil && soilStatus ? (
                  <div>
                    <p className="text-2xl font-bold">{currentSoil.moisture.toFixed(1)}%</p>
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: soilStatus.color + '20', color: soilStatus.color }}
                    >
                      {soilStatus.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
              </div>
              <Droplets className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* UV Index */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">UV Index</p>
                {currentUVI ? (
                  <div>
                    <p className="text-2xl font-bold">{currentUVI.uvIndex}</p>
                    <Badge variant={currentUVI.riskLevel === "Low" ? "secondary" : 
                                 currentUVI.riskLevel === "Moderate" ? "default" : "destructive"}>
                      {currentUVI.riskLevel}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
              </div>
              <Sun className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Tabs */}
      <Tabs defaultValue="weather" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="ndvi">NDVI Analysis</TabsTrigger>
          {/* <TabsTrigger value="soil">Soil Data</TabsTrigger>
          <TabsTrigger value="uvi">UV Monitoring</TabsTrigger> */}
          <TabsTrigger value="mandi">Market Prices</TabsTrigger>
          <TabsTrigger value="bids">Vendor Bids</TabsTrigger>
        </TabsList>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Current Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Temperature</span>
                      <span className="font-medium">{weatherData.current.temp}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feels Like</span>
                      <span className="font-medium">{weatherData.current.feelsLike}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Humidity</span>
                      <span className="font-medium">{weatherData.current.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wind Speed</span>
                      <span className="font-medium">{weatherData.current.windSpeed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pressure</span>
                      <span className="font-medium">{weatherData.current.pressure} hPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cloud Cover</span>
                      <span className="font-medium">{weatherData.current.cloudCover}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">Loading weather data...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  7-Day Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherData && weatherData.forecast.length > 0 ? (
                  <div className="space-y-2">
                    {weatherData.forecast.slice(0, 7).map((day, index) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-sm">{day.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{day.high}°</span>
                          <span className="text-sm text-muted-foreground">{day.low}°</span>
                          <span className="text-xs text-muted-foreground capitalize">{day.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No forecast data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NDVI Tab */}
        <TabsContent value="ndvi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5" />
                NDVI Historical Trends
              </CardTitle>
              <CardDescription>
                Vegetation health over the last 30 days from satellite imagery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ndviData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ndviData}>
                      <defs>
                        <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [value.toFixed(3), "NDVI"]}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload
                          return `${data?.date} (${data?.satellite})`
                        }}
                      />
                      <Area type="monotone" dataKey="ndviMean" stroke="#10b981" strokeWidth={2} fill="url(#ndviGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No NDVI data available for this field
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Soil Tab */}
        {/* <TabsContent value="soil" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  Soil Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                {soilData.length > 0 ? (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={soilData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="soilTemp" stroke="#ef4444" strokeWidth={2} name="Soil Temp (°C)" />
                        <Line type="monotone" dataKey="surfaceTemp" stroke="#f59e0b" strokeWidth={2} name="Surface Temp (°C)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No soil temperature data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  Soil Moisture
                </CardTitle>
              </CardHeader>
              <CardContent>
                {soilData.length > 0 ? (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={soilData}>
                        <defs>
                          <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Moisture"]} />
                        <Area type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={2} fill="url(#moistureGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {loading ? "Loading soil history..." : "No soil history data available"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent> */}

        {/* UVI Tab */}
        {/* <TabsContent value="uvi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                UV Index Forecast
              </CardTitle>
              <CardDescription>
                UV exposure forecast for field management and worker safety
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uviData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={uviData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        formatter={(value: number, name) => [value.toFixed(1), "UV Index"]}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload
                          return `${data?.date} - Risk: ${data?.riskLevel}`
                        }}
                      />
                      <Line type="monotone" dataKey="uvIndex" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {loading ? "Loading UV forecast..." : "No UV forecast data available"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Mandi Prices Tab */}
        <TabsContent value="mandi" className="space-y-4">
          <MandiPrices 
            location={selectedPolygon ? {
              lat: selectedPolygon.geo_json.geometry.coordinates[0][0][1],
              lng: selectedPolygon.geo_json.geometry.coordinates[0][0][0]
            } : undefined}
            crop={cropName}
            userId={userId}
          />
        </TabsContent>

        {/* Vendor Bids Tab */}
        <TabsContent value="bids" className="space-y-4">
          <VendorBids />
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
