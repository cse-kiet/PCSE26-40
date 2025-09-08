"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFarmonautField, useFarmonautHistorical } from "@/hooks/use-farmonaut-data"
import { useAgromonitoringWeather, useAgromonitoringNDVI } from "@/hooks/use-agromonitoring-data"
import { farmonautAPI } from "@/lib/farmonaut-api"
import { Thermometer, Droplets, Sun, Cloud, RefreshCw, MapPin } from "lucide-react"

interface RealTimeDashboardProps {
  selectedField: any
  coordinates: { lat: number; lng: number }
}

export default function RealTimeDashboard({ selectedField, coordinates }: RealTimeDashboardProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setLastUpdate(new Date())
  }, [])

  const {
    data: fieldData,
    loading: fieldLoading,
    error: fieldError,
    refetch: refetchField,
  } = useFarmonautField(selectedField?.id)

  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather,
  } = useAgromonitoringWeather(coordinates.lat, coordinates.lng)

  const { data: historicalData, loading: historicalLoading } = useFarmonautHistorical(selectedField?.id)

  // Add NDVI data from Agromonitoring
  const { 
    data: ndviData, 
    loading: ndviLoading, 
    error: ndviError, 
    currentNDVI,
    ndviStatus 
  } = useAgromonitoringNDVI(selectedField?.agromonitoringId || null, 30) // Last 30 days for quick overview

  const handleRefresh = async () => {
    await Promise.all([refetchField(), refetchWeather()])
    setLastUpdate(new Date())
  }

  const submitNewField = async (fieldName: string, points: any) => {
    try {
      await farmonautAPI.submitField({
        UID: "farmer_dashboard_user",
        CropCode: "1r", // Default to rice, can be made dynamic
        FieldName: fieldName,
        PaymentType: "6",
        Points: points,
      })
    } catch (error) {
      console.error("Failed to submit field:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground" suppressHydrationWarning>
            Live Data • Last updated: {isClient && lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          </span>
        </div>
        <Button onClick={handleRefresh} disabled={fieldLoading || weatherLoading} size="sm" variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${fieldLoading || weatherLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ndvi">NDVI Analysis</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="soil">Soil Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NDVI Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">NDVI Status</CardTitle>
              </CardHeader>
              <CardContent>
                {fieldLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ) : fieldData ? (
                  <div>
                    <div className="text-2xl font-bold" style={{ color: fieldData.ndvi.color }}>
                      {fieldData.ndvi.value.toFixed(2)}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {fieldData.ndvi.status}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Temperature */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  </div>
                ) : weatherData ? (
                  <div className="text-2xl font-bold">{weatherData.current.temp.toFixed(1)}°C</div>
                ) : (
                  <div className="text-sm text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>

            {/* Soil Moisture */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Soil Moisture
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fieldLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  </div>
                ) : fieldData ? (
                  <div className="text-2xl font-bold">{fieldData.soil.moisture.toFixed(1)}%</div>
                ) : (
                  <div className="text-sm text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>

            {/* UV Index */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  UV Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  </div>
                ) : weatherData ? (
                  <div>
                    <div className="text-2xl font-bold">N/A</div>
                    <Badge variant="secondary">Not Available</Badge>
                    <div className="text-xs text-muted-foreground mt-1">UV data not provided by Agromonitoring</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Field Coordinates Display */}
          {selectedField && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Field Location Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Center Coordinates</p>
                    <p className="text-sm text-muted-foreground">
                      {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Field Area</p>
                    <p className="text-sm text-muted-foreground">{selectedField.area} hectares</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ndvi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NDVI Analysis</CardTitle>
              <CardDescription>Vegetation health and vigor assessment</CardDescription>
            </CardHeader>
            <CardContent>
              {ndviLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading NDVI data...</p>
                  </div>
                </div>
              ) : ndviError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600 mb-2">{ndviError}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedField?.agromonitoringId ? 
                      "Failed to load NDVI data from Agromonitoring" : 
                      "Configure polygon ID in settings to view NDVI data"
                    }
                  </p>
                </div>
              ) : currentNDVI && ndviStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Current NDVI</p>
                      <p className="text-2xl font-bold" style={{ color: ndviStatus.color }}>
                        {currentNDVI.ndviMean.toFixed(3)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentNDVI.date} ({currentNDVI.satellite})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Health Status</p>
                      <Badge 
                        variant="secondary" 
                        className="mt-1" 
                        style={{ backgroundColor: ndviStatus.color + '20', color: ndviStatus.color }}
                      >
                        {ndviStatus.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ndviData.length} data points (30 days)
                      </p>
                    </div>
                  </div>

                  {/* NDVI Statistics */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-lg font-semibold">{currentNDVI.ndviMin.toFixed(3)}</p>
                      <p className="text-xs text-muted-foreground">Min</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-lg font-semibold">{currentNDVI.ndviMedian.toFixed(3)}</p>
                      <p className="text-xs text-muted-foreground">Median</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-lg font-semibold">{currentNDVI.ndviMax.toFixed(3)}</p>
                      <p className="text-xs text-muted-foreground">Max</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cloud Cover:</span>
                      <span className="font-medium">{currentNDVI.cloudCover.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Coverage:</span>
                      <span className="font-medium">{currentNDVI.dataCoverage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pixel Count:</span>
                      <span className="font-medium">{currentNDVI.pixelCount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* NDVI Scale Reference */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">NDVI Health Scale</p>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Poor (0.0-0.3)</span>
                      <div className="w-4 h-4 bg-yellow-500 rounded ml-4"></div>
                      <span>Fair (0.3-0.5)</span>
                      <div className="w-4 h-4 bg-green-400 rounded ml-4"></div>
                      <span>Good (0.5-0.7)</span>
                      <div className="w-4 h-4 bg-green-700 rounded ml-4"></div>
                      <span>Excellent (0.7-1.0)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ndviStatus.description}
                    </p>
                  </div>
                </div>
              ) : selectedField ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm mb-2">No NDVI data available</p>
                  <p className="text-xs">
                    {selectedField.agromonitoringId ? 
                      "No recent satellite data found for this polygon" :
                      "Configure Agromonitoring polygon ID to view NDVI data"
                    }
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Select a field to view NDVI analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                      <span className="font-medium">{weatherData.current.temp.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feels Like</span>
                      <span className="font-medium">{weatherData.current.feelsLike.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Humidity</span>
                      <span className="font-medium">{weatherData.current.humidity.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wind Speed</span>
                      <span className="font-medium">{weatherData.current.windSpeed.toFixed(1)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pressure</span>
                      <span className="font-medium">{weatherData.current.pressure.toFixed(0)} hPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Description</span>
                      <span className="font-medium capitalize">{weatherData.current.description}</span>
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
                  <Droplets className="w-5 h-5" />
                  Precipitation & Moisture
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Cloud Cover</span>
                      <span className="font-medium">{weatherData.current.cloudCover.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precipitation</span>
                      <span className="font-medium text-muted-foreground">Not available</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Soil Moisture</span>
                      <span className="font-medium text-muted-foreground">Not available</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Evapotranspiration</span>
                      <span className="font-medium text-muted-foreground">Not available</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Note: Some data not provided by current Agromonitoring weather API
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">Loading moisture data...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="soil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Soil Analysis</CardTitle>
              <CardDescription>Real-time soil health indicators</CardDescription>
            </CardHeader>
            <CardContent>
              {fieldData ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Soil Moisture</p>
                      <p className="text-2xl font-bold">{fieldData.soil.moisture.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Organic Carbon</p>
                      <p className="text-2xl font-bold">{fieldData.soil.organicCarbon.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Soil Temperature</p>
                      <p className="text-2xl font-bold">{fieldData.soil.temperature.toFixed(1)}°C</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">pH Level</p>
                      <p className="text-2xl font-bold">{fieldData.soil.ph.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Select a field to view soil analysis</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {(fieldError || weatherError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{fieldError || weatherError}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
