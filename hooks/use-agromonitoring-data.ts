"use client"

import { useState, useEffect, useCallback } from "react"
import { getAgromonitoringAPI, type ProcessedWeatherData, type ProcessedNDVIData } from "@/lib/agromonitoring-api"

export function useAgromonitoringWeather(latitude: number, longitude: number) {
  const [data, setData] = useState<ProcessedWeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeatherData = useCallback(async () => {
    if (!latitude || !longitude) return

    setLoading(true)
    setError(null)

    try {
      const api = getAgromonitoringAPI()
      const rawWeatherData = await api.getCurrentWeather(latitude, longitude, "metric")
      const processedData = api.processWeatherData(rawWeatherData)
      setData(processedData)
    } catch (err) {
      console.error("Agromonitoring weather error:", err)
      if (err instanceof Error && err.message.includes("not initialized")) {
        setError("Agromonitoring API not configured. Please configure your API key first.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch weather data")
      }
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    fetchWeatherData()

    // Update weather data every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWeatherData])

  return { data, loading, error, refetch: fetchWeatherData }
}

export function useAgromonitoringNDVI(
  polygonId: string | null, 
  daysBack: number = 90,
  options?: {
    type?: 'l8' | 's2'
    zoom?: number
    clouds_max?: number
  }
) {
  const [data, setData] = useState<ProcessedNDVIData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNDVIData = useCallback(async () => {
    if (!polygonId) return

    setLoading(true)
    setError(null)

    try {
      const api = getAgromonitoringAPI()
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - daysBack)

      const startTimestamp = api.dateToUnixTimestamp(startDate)
      const endTimestamp = api.dateToUnixTimestamp(endDate)

      console.log(`[NDVI] Fetching data for polygon ${polygonId} from ${startDate.toISOString()} to ${endDate.toISOString()}`)

      const rawNDVIData = await api.getNDVIHistory(
        polygonId, 
        startTimestamp, 
        endTimestamp,
        options
      )
      
      const processedData = api.processNDVIData(rawNDVIData)
      setData(processedData)
      
      console.log(`[NDVI] Fetched ${processedData.length} data points`)
    } catch (err) {
      console.error("Agromonitoring NDVI error:", err)
      if (err instanceof Error && err.message.includes("not initialized")) {
        setError("Agromonitoring API not configured. Please configure your API key first.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch NDVI data")
      }
    } finally {
      setLoading(false)
    }
  }, [polygonId, daysBack, options])

  useEffect(() => {
    fetchNDVIData()
  }, [fetchNDVIData])

  // Calculate current NDVI status from latest data point
  const currentNDVI = data.length > 0 ? data[data.length - 1] : null
  const ndviStatus = currentNDVI ? 
    getAgromonitoringAPI().getNDVIStatus(currentNDVI.ndviMean) : null

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchNDVIData,
    currentNDVI,
    ndviStatus
  }
}
