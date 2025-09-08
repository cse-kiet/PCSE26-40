"use client"

import { useState, useEffect, useCallback } from "react"
import { farmonautAPI, processNDVIData, processSoilData, processWeatherData } from "@/lib/farmonaut-api"

export function useFarmonautField(fieldId: string | null) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFieldData = useCallback(async () => {
    if (!fieldId) return

    setLoading(true)
    setError(null)

    try {
      const [satelliteData, analysisData] = await Promise.all([
        farmonautAPI.getSatelliteData(fieldId, "NDVI"),
        farmonautAPI.getFieldAnalysis(fieldId),
      ])

      setData({
        satellite: satelliteData,
        analysis: analysisData,
        ndvi: processNDVIData(satelliteData),
        soil: processSoilData(analysisData),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch field data")
    } finally {
      setLoading(false)
    }
  }, [fieldId])

  useEffect(() => {
    fetchFieldData()

    // Set up real-time updates every 5 minutes
    const interval = setInterval(fetchFieldData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchFieldData])

  return { data, loading, error, refetch: fetchFieldData }
}

export function useFarmonautWeather(latitude: number, longitude: number) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeatherData = useCallback(async () => {
    if (!latitude || !longitude) return

    setLoading(true)
    setError(null)

    try {
      const weatherData = await farmonautAPI.getWeatherData(latitude, longitude)
      setData(processWeatherData(weatherData))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data")
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

export function useFarmonautHistorical(fieldId: string | null, days = 30) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistoricalData = useCallback(async () => {
    if (!fieldId) return

    setLoading(true)
    setError(null)

    try {
      const endDate = new Date().toISOString().split("T")[0]
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      const historicalData = await farmonautAPI.getHistoricalData(fieldId, startDate, endDate)
      setData(historicalData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch historical data")
    } finally {
      setLoading(false)
    }
  }, [fieldId, days])

  useEffect(() => {
    fetchHistoricalData()
  }, [fetchHistoricalData])

  return { data, loading, error, refetch: fetchHistoricalData }
}
