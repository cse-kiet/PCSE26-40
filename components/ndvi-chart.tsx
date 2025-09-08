"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, Calendar, RefreshCw, AlertTriangle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { useAgromonitoringNDVI } from "@/hooks/use-agromonitoring-data"
import { Button } from "@/components/ui/button"

interface NDVIChartProps {
  selectedField?: string | null
  polygonId?: string | null
}

export default function NDVIChart({ selectedField, polygonId }: NDVIChartProps) {
  // Use real NDVI data from Agromonitoring API
  const { 
    data: ndviData, 
    loading, 
    error, 
    refetch, 
    currentNDVI,
    ndviStatus 
  } = useAgromonitoringNDVI(polygonId, 90, { clouds_max: 30 })

  // Calculate statistics from real data
  const stats = ndviData.length > 0 ? {
    max: Math.max(...ndviData.map(d => d.ndviMax)),
    mean: ndviData.reduce((acc, d) => acc + d.ndviMean, 0) / ndviData.length,
    min: Math.min(...ndviData.map(d => d.ndviMin)),
    latest: currentNDVI?.ndviMean || 0
  } : { max: 0, mean: 0, min: 0, latest: 0 }

  // Calculate trend
  const trend = ndviData.length > 1 ? 
    (ndviData[ndviData.length - 1].ndviMean > ndviData[ndviData.length - 2].ndviMean ? "up" : "down") :
    "up"
  
  const trendPercentage = ndviData.length > 1 ? 
    Math.abs(((ndviData[ndviData.length - 1].ndviMean - ndviData[ndviData.length - 2].ndviMean) / ndviData[ndviData.length - 2].ndviMean) * 100).toFixed(1) :
    "0.0"

  // Format data for chart (convert date format for better display)
  const chartData = ndviData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: item.date,
    ndvi: item.ndviMean,
    satellite: item.satellite,
    cloudCover: item.cloudCover,
    dataCoverage: item.dataCoverage
  }))

  const getNDVIStatusColors = (status: string) => {
    switch (status) {
      case "Excellent": return { color: "bg-green-500", textColor: "text-green-600" }
      case "Good": return { color: "bg-green-400", textColor: "text-green-500" }
      case "Fair": return { color: "bg-yellow-500", textColor: "text-yellow-600" }
      case "Poor": return { color: "bg-orange-500", textColor: "text-orange-600" }
      case "Very Poor": return { color: "bg-red-500", textColor: "text-red-600" }
      default: return { color: "bg-gray-500", textColor: "text-gray-600" }
    }
  }

  const statusColors = ndviStatus ? getNDVIStatusColors(ndviStatus.status) : { color: "bg-gray-500", textColor: "text-gray-600" }

  return (
    <div className="space-y-6">
      {/* NDVI Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                NDVI Analysis
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                {selectedField ? `Field: ${selectedField}` : "Satellite-based vegetation monitoring"}
                {polygonId ? ` (ID: ${polygonId})` : " - Configure polygon for real data"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {ndviStatus && (
                <Badge className={`${statusColors.color} text-white`}>
                  {ndviStatus.status}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center py-8 text-center">
              <div className="space-y-2">
                <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={refetch}>
                  Retry
                </Button>
              </div>
            </div>
          ) : !polygonId ? (
            <div className="flex items-center justify-center py-8 text-center">
              <div className="space-y-2">
                <Activity className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Select a field to view NDVI data
                </p>
                <p className="text-xs text-muted-foreground">
                  NDVI analysis requires a polygon ID from Agromonitoring
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? "..." : stats.latest.toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">Current NDVI</div>
                  {!loading && ndviData.length > 1 && (
                    <div
                      className={`flex items-center justify-center gap-1 text-xs mt-1 ${
                        trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {trendPercentage}%
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? "..." : stats.max.toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">Max</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? "..." : stats.mean.toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">Mean</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? "..." : stats.min.toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">Min</div>
                </div>
              </div>

              {ndviStatus && (
                <div className="mb-6 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">{ndviStatus.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Based on latest NDVI reading of {currentNDVI?.ndviMean.toFixed(3)}
                  </div>
                </div>
              )}
            </>
          )}

          {/* NDVI Scale */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">NDVI Health Scale</div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1 h-4 bg-gradient-to-r from-chart-4 via-chart-2 to-chart-3 rounded-full"></div>
              <div className="flex justify-between w-full text-muted-foreground">
                <span>0.0</span>
                <span>0.5</span>
                <span>1.0</span>
              </div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-chart-4">Poor</span>
              <span className="text-chart-2">Healthy</span>
              <span className="text-chart-3">Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical NDVI Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Historical NDVI Trends
          </CardTitle>
          <CardDescription>
            Vegetation health over time from Landsat and Sentinel satellite data
            {chartData.length > 0 && ` (${chartData.length} data points)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!polygonId ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div className="space-y-2">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Historical data requires polygon selection
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Loading NDVI history...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div className="space-y-2">
                <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No NDVI data available for this polygon
                </p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting the date range or check polygon ID
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
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
                        return `${data?.fullDate} (${data?.satellite})`
                      }}
                    />
                    <Area type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={2} fill="url(#ndviGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Satellite Data Points */}
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Recent Acquisitions</div>
                <div className="flex flex-wrap gap-2">
                  {chartData.slice(-5).map((point, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {point.date} - {point.satellite} 
                      <span className="ml-1 text-muted-foreground">
                        ({point.cloudCover}% cloud, {point.dataCoverage}% coverage)
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Multi-Field Comparison - Future Feature */}
      <Card>
        <CardHeader>
          <CardTitle>Field Comparison</CardTitle>
          <CardDescription>Compare NDVI trends across multiple polygons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-center">
            <div className="space-y-2">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Multi-field comparison coming soon
              </p>
              <p className="text-xs text-muted-foreground">
                This feature will allow comparing NDVI trends across multiple polygons
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
