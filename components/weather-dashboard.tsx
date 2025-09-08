"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Cloud,
  CloudRain,
  Sun,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Gauge,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface WeatherData {
  current: {
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: string
    pressure: number
    visibility: number
    uvIndex: number
    condition: string
    icon: string
    feelsLike: number
  }
  forecast: Array<{
    date: string
    day: string
    high: number
    low: number
    condition: string
    icon: string
    precipitation: number
    humidity: number
    windSpeed: number
  }>
  historical: Array<{
    date: string
    temperature: number
    rainfall: number
    humidity: number
  }>
  alerts: Array<{
    type: "warning" | "watch" | "advisory"
    title: string
    description: string
    severity: "low" | "medium" | "high"
  }>
}

export default function WeatherDashboard() {
  const [activeTab, setActiveTab] = useState("current")

  const weatherData: WeatherData = {
    current: {
      temperature: 28,
      humidity: 65,
      windSpeed: 8,
      windDirection: "NW",
      pressure: 1013,
      visibility: 10,
      uvIndex: 6,
      condition: "Partly Cloudy",
      icon: "partly-cloudy",
      feelsLike: 31,
    },
    forecast: [
      {
        date: "Aug 22",
        day: "Thu",
        high: 30,
        low: 22,
        condition: "Sunny",
        icon: "sunny",
        precipitation: 0,
        humidity: 58,
        windSpeed: 12,
      },
      {
        date: "Aug 23",
        day: "Fri",
        high: 32,
        low: 24,
        condition: "Partly Cloudy",
        icon: "partly-cloudy",
        precipitation: 10,
        humidity: 62,
        windSpeed: 10,
      },
      {
        date: "Aug 24",
        day: "Sat",
        high: 29,
        low: 21,
        condition: "Light Rain",
        icon: "rain",
        precipitation: 75,
        humidity: 78,
        windSpeed: 15,
      },
      {
        date: "Aug 25",
        day: "Sun",
        high: 26,
        low: 19,
        condition: "Heavy Rain",
        icon: "heavy-rain",
        precipitation: 85,
        humidity: 82,
        windSpeed: 18,
      },
      {
        date: "Aug 26",
        day: "Mon",
        high: 28,
        low: 20,
        condition: "Cloudy",
        icon: "cloudy",
        precipitation: 20,
        humidity: 70,
        windSpeed: 8,
      },
      {
        date: "Aug 27",
        day: "Tue",
        high: 31,
        low: 23,
        condition: "Sunny",
        icon: "sunny",
        precipitation: 5,
        humidity: 55,
        windSpeed: 6,
      },
      {
        date: "Aug 28",
        day: "Wed",
        high: 33,
        low: 25,
        condition: "Hot",
        icon: "sunny",
        precipitation: 0,
        humidity: 45,
        windSpeed: 4,
      },
    ],
    historical: [
      { date: "Aug 14", temperature: 27, rainfall: 2, humidity: 68 },
      { date: "Aug 15", temperature: 29, rainfall: 0, humidity: 62 },
      { date: "Aug 16", temperature: 31, rainfall: 5, humidity: 58 },
      { date: "Aug 17", temperature: 28, rainfall: 12, humidity: 75 },
      { date: "Aug 18", temperature: 26, rainfall: 18, humidity: 82 },
      { date: "Aug 19", temperature: 25, rainfall: 8, humidity: 78 },
      { date: "Aug 20", temperature: 27, rainfall: 3, humidity: 70 },
      { date: "Aug 21", temperature: 28, rainfall: 0, humidity: 65 },
    ],
    alerts: [
      {
        type: "warning",
        title: "Heavy Rain Expected",
        description: "Significant rainfall expected Aug 24-25. Consider postponing field operations.",
        severity: "high",
      },
      {
        type: "advisory",
        title: "High UV Index",
        description: "UV index will reach 8-9 this week. Protect workers during midday hours.",
        severity: "medium",
      },
    ],
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
      case "hot":
        return <Sun className="w-8 h-8 text-yellow-500" />
      case "partly-cloudy":
        return <Cloud className="w-8 h-8 text-gray-500" />
      case "cloudy":
        return <Cloud className="w-8 h-8 text-gray-600" />
      case "light-rain":
      case "rain":
        return <CloudRain className="w-8 h-8 text-blue-500" />
      case "heavy-rain":
        return <CloudRain className="w-8 h-8 text-blue-700" />
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 border-red-300 text-red-800"
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-800"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Weather Alerts */}
      {weatherData.alerts.length > 0 && (
        <div className="space-y-3">
          {weatherData.alerts.map((alert, index) => (
            <Card key={index} className={`border-l-4 ${getAlertColor(alert.severity)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <p className="text-sm mt-1">{alert.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="forecast">7-Day Forecast</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Current Weather Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Current Conditions
              </CardTitle>
              <CardDescription>Real-time weather data for your location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Weather Display */}
                <div className="flex items-center gap-4">
                  {getWeatherIcon(weatherData.current.icon)}
                  <div>
                    <div className="text-4xl font-bold">{weatherData.current.temperature}°C</div>
                    <div className="text-muted-foreground">{weatherData.current.condition}</div>
                    <div className="text-sm text-muted-foreground">Feels like {weatherData.current.feelsLike}°C</div>
                  </div>
                </div>

                {/* Weather Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Humidity</div>
                      <div className="font-semibold">{weatherData.current.humidity}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Wind</div>
                      <div className="font-semibold">
                        {weatherData.current.windSpeed} km/h {weatherData.current.windDirection}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Pressure</div>
                      <div className="font-semibold">{weatherData.current.pressure} hPa</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Visibility</div>
                      <div className="font-semibold">{weatherData.current.visibility} km</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UV Index */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">UV Index</span>
                  </div>
                  <Badge
                    variant={
                      weatherData.current.uvIndex > 7
                        ? "destructive"
                        : weatherData.current.uvIndex > 5
                          ? "secondary"
                          : "default"
                    }
                  >
                    {weatherData.current.uvIndex} -{" "}
                    {weatherData.current.uvIndex > 7
                      ? "Very High"
                      : weatherData.current.uvIndex > 5
                        ? "High"
                        : "Moderate"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          {/* 7-Day Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                7-Day Weather Forecast
              </CardTitle>
              <CardDescription>Plan your farming activities with detailed weather predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weatherData.forecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="font-medium">{day.day}</div>
                        <div className="text-sm text-muted-foreground">{day.date}</div>
                      </div>
                      {getWeatherIcon(day.icon)}
                      <div>
                        <div className="font-medium">{day.condition}</div>
                        <div className="text-sm text-muted-foreground">{day.precipitation}% chance of rain</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{day.high}°C</div>
                      <div className="text-sm text-muted-foreground">{day.low}°C</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Precipitation Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Precipitation Forecast</CardTitle>
              <CardDescription>Expected rainfall over the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weatherData.forecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value}%`, "Precipitation"]}
                    />
                    <Bar dataKey="precipitation" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          {/* Historical Weather Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Historical Weather Data
              </CardTitle>
              <CardDescription>Past week weather trends for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weatherData.historical}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                      name="Temperature (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="rainfall"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      name="Rainfall (mm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                  <span className="text-sm">Temperature (°C)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-chart-1 rounded-full"></div>
                  <span className="text-sm">Rainfall (mm)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
              <CardDescription>Key weather statistics for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-chart-2">29°C</div>
                  <div className="text-sm text-muted-foreground">Avg Temperature</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-chart-1">48mm</div>
                  <div className="text-sm text-muted-foreground">Total Rainfall</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-chart-3">68%</div>
                  <div className="text-sm text-muted-foreground">Avg Humidity</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-chart-4">4</div>
                  <div className="text-sm text-muted-foreground">Rainy Days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
