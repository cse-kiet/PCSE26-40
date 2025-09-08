"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  getAgromonitoringAPI, 
  type PolygonResponse, 
  type ProcessedWeatherData, 
  type ProcessedNDVIData,
  type ProcessedSoilData,
  type ProcessedUVIData
} from "@/lib/agromonitoring-api"

// Hook to fetch and manage all user polygons
export function useUserPolygons(enabled: boolean = true) {
  const [polygons, setPolygons] = useState<PolygonResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPolygons = useCallback(async () => {
    if (!enabled) return
    
    setLoading(true)
    setError(null)

    try {
      const api = getAgromonitoringAPI()
      const userPolygons = await api.getPolygons()
      setPolygons(userPolygons)
      console.log(`[Polygons] Fetched ${userPolygons.length} polygons`)
    } catch (err) {
      console.error("Failed to fetch polygons:", err)
      if (err instanceof Error && err.message.includes("not initialized")) {
        setError("Agromonitoring API not configured. Please configure your API key first.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch polygons")
      }
    } finally {
      setLoading(false)
    }
  }, [enabled])

  const createPolygon = useCallback(async (name: string, coordinates: Array<{ lat: number; lng: number }>) => {
    if (!enabled) throw new Error("API not configured")
    
    try {
      const api = getAgromonitoringAPI()
      const newPolygon = await api.createPolygon(name, coordinates)
      setPolygons(prev => [...prev, newPolygon])
      return newPolygon
    } catch (err) {
      console.error("Failed to create polygon:", err)
      throw err
    }
  }, [enabled])

  const updatePolygon = useCallback(async (polygonId: string, name: string) => {
    try {
      const api = getAgromonitoringAPI()
      const updatedPolygon = await api.updatePolygon(polygonId, name)
      setPolygons(prev => prev.map(p => p.id === polygonId ? updatedPolygon : p))
      return updatedPolygon
    } catch (err) {
      console.error("Failed to update polygon:", err)
      throw err
    }
  }, [])

  const deletePolygon = useCallback(async (polygonId: string) => {
    try {
      const api = getAgromonitoringAPI()
      await api.deletePolygon(polygonId)
      setPolygons(prev => prev.filter(p => p.id !== polygonId))
    } catch (err) {
      console.error("Failed to delete polygon:", err)
      throw err
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      fetchPolygons()
    }
  }, [fetchPolygons, enabled])

  return {
    polygons,
    loading,
    error,
    refetch: fetchPolygons,
    createPolygon,
    updatePolygon,
    deletePolygon
  }
}

// Comprehensive hook to fetch all data for a polygon
export function usePolygonData(polygonId: string | null, daysBack: number = 30) {
  const [weatherData, setWeatherData] = useState<ProcessedWeatherData | null>(null)
  const [ndviData, setNdviData] = useState<ProcessedNDVIData[]>([])
  const [soilData, setSoilData] = useState<ProcessedSoilData[]>([])
  const [uviData, setUviData] = useState<ProcessedUVIData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = useCallback(async () => {
    if (!polygonId) return

    setLoading(true)
    setError(null)
    
    try {
      // Check if API is initialized
      getAgromonitoringAPI()
    } catch (err) {
      setError("Agromonitoring API not configured. Please configure your API key first.")
      setLoading(false)
      return
    }

    try {
      const api = getAgromonitoringAPI()
      
      // Get polygon details first to get coordinates
      const polygon = await api.getPolygon(polygonId)
      const center = polygon.center // [lon, lat]
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - daysBack)
      
      const startTimestamp = api.dateToUnixTimestamp(startDate)
      const endTimestamp = api.dateToUnixTimestamp(endDate)

      console.log(`[PolygonData] Fetching all data for polygon ${polygonId}`)

      // Fetch all data in parallel
      console.log(`[PolygonData] Fetching available data for polygon`)
      
      const [
        currentWeather,
        weatherForecast,
        ndviHistory,
        currentSoil,
        currentUVI
      ] = await Promise.allSettled([
        api.getCurrentWeather(center[1], center[0]), // lat, lon
        api.getWeatherForecast(center[1], center[0]),
        api.getNDVIHistory(polygonId, startTimestamp, endTimestamp),
        api.getCurrentSoilData(polygonId),
        api.getCurrentUVI(polygonId)
      ])

      // Track which data sources are available
      const dataStatus = {
        weather: false,
        ndvi: false, 
        soil: false,
        uvi: false
      }

      // Process weather data (combine current + forecast)
      let processedWeather: ProcessedWeatherData | null = null
      if (currentWeather.status === "fulfilled" || weatherForecast.status === "fulfilled") {
        if (weatherForecast.status === "fulfilled") {
          processedWeather = api.processWeatherForecast(weatherForecast.value)
          dataStatus.weather = true
        } else if (currentWeather.status === "fulfilled") {
          processedWeather = api.processWeatherData(currentWeather.value)
          dataStatus.weather = true
        }
      } else {
        // Log weather errors (usually these work, so worth noting)
        if (currentWeather.status === "rejected") {
          console.warn(`[PolygonData] Current weather failed:`, currentWeather.reason?.message || currentWeather.reason)
        }
        if (weatherForecast.status === "rejected") {
          console.warn(`[PolygonData] Weather forecast failed:`, weatherForecast.reason?.message || weatherForecast.reason)
        }
      }

      // Process NDVI data
      let processedNDVI: ProcessedNDVIData[] = []
      if (ndviHistory.status === "fulfilled") {
        processedNDVI = api.processNDVIData(ndviHistory.value)
        dataStatus.ndvi = true
        console.log(`[PolygonData] NDVI: ${processedNDVI.length} data points`)
      } else {
        const error = ndviHistory.reason
        if (error?.message?.includes('forbidden') || error?.message?.includes('subscription')) {
          console.info(`[PolygonData] NDVI data unavailable - may require higher subscription plan`)
        } else {
          console.warn(`[PolygonData] NDVI history failed:`, error?.message || error)
        }
      }

      // Process soil data (current data only)
      let processedSoil: ProcessedSoilData[] = []
      if (currentSoil.status === "fulfilled") {
        processedSoil = api.processSoilData([currentSoil.value])
        dataStatus.soil = true
        console.log(`[PolygonData] Soil: current data only`)
      } else {
        // Log soil errors with context
        if (currentSoil.status === "rejected") {
          const error = currentSoil.reason
          if (error?.message?.includes('forbidden') || error?.message?.includes('subscription')) {
            console.info(`[PolygonData] Current soil data unavailable - may require higher subscription plan`)
          } else {
            console.warn(`[PolygonData] Current soil failed:`, error?.message || error)
          }
        }
      }

      // Process UVI data (current data only)
      let processedUVI: ProcessedUVIData[] = []
      if (currentUVI.status === "fulfilled") {
        processedUVI = api.processUVIData([currentUVI.value])
        dataStatus.uvi = true
        console.log(`[PolygonData] UVI: current data only`)
      } else {
        // Log UVI errors with context
        if (currentUVI.status === "rejected") {
          const error = currentUVI.reason
          if (error?.message?.includes('forbidden') || error?.message?.includes('subscription')) {
            console.info(`[PolygonData] Current UVI unavailable - may require higher subscription plan`)
          } else {
            console.warn(`[PolygonData] Current UVI failed:`, error?.message || error)
          }
        }
      }

      // Update state
      setWeatherData(processedWeather)
      setNdviData(processedNDVI)
      setSoilData(processedSoil)
      setUviData(processedUVI)

      console.log(`[PolygonData] Data fetch summary:`, {
        ...dataStatus,
        counts: {
          ndvi: processedNDVI.length,
          soil: processedSoil.length,
          uvi: processedUVI.length
        }
      })

      // Show a user-friendly summary
      const availableData = Object.entries(dataStatus).filter(([_, available]) => available).map(([type]) => type)
      if (availableData.length === 0) {
        console.warn(`[PolygonData] No data successfully fetched - this may indicate subscription limitations`)
      } else {
        console.info(`[PolygonData] Successfully fetched: ${availableData.join(', ')}`)
      }

    } catch (err) {
      console.error("Failed to fetch polygon data:", err)
      if (err instanceof Error && err.message.includes("not initialized")) {
        setError("Agromonitoring API not configured.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      }
    } finally {
      setLoading(false)
    }
  }, [polygonId, daysBack])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Clear previous data immediately when switching fields to avoid showing stale info
  useEffect(() => {
    setWeatherData(null)
    setNdviData([])
    setSoilData([])
    setUviData([])
    setError(null)
  }, [polygonId])

  // Calculate current status from latest data
  const currentNDVI = ndviData.length > 0 ? ndviData[ndviData.length - 1] : null
  const currentSoil = soilData.length > 0 ? soilData[soilData.length - 1] : null
  const currentUVI = uviData.length > 0 ? uviData[uviData.length - 1] : null

  const ndviStatus = currentNDVI ? 
    getAgromonitoringAPI().getNDVIStatus(currentNDVI.ndviMean) : null
  
  const soilStatus = currentSoil ?
    getAgromonitoringAPI().getSoilMoistureStatus(currentSoil.moisture) : null

  return {
    weatherData,
    ndviData,
    soilData,
    uviData,
    loading,
    error,
    refetch: fetchAllData,
    // Current status
    currentNDVI,
    currentSoil,
    currentUVI,
    ndviStatus,
    soilStatus
  }
}

// Hook for weather forecast specifically
export function useWeatherForecast(lat: number, lon: number) {
  const [forecast, setForecast] = useState<ProcessedWeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchForecast = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const api = getAgromonitoringAPI()
      const rawForecast = await api.getWeatherForecast(lat, lon)
      const processedForecast = api.processWeatherForecast(rawForecast)
      setForecast(processedForecast)
    } catch (err) {
      console.error("Failed to fetch weather forecast:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch forecast")
    } finally {
      setLoading(false)
    }
  }, [lat, lon])

  useEffect(() => {
    fetchForecast()
  }, [fetchForecast])

  return { forecast, loading, error, refetch: fetchForecast }
}
