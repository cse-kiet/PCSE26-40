"use client"

import { useState, useEffect, useCallback } from "react"
import { getAgroAPI, type WeatherData, type NDVIData, type FieldData } from "@/lib/agrofarming-api"

export function useWeatherData(lat: number, lng: number, refreshInterval = 300000) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const api = getAgroAPI()
      const data = await api.getWeatherData(lat, lng)
      setWeatherData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data")
      console.error("[v0] Weather data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [lat, lng])

  useEffect(() => {
    fetchWeatherData()

    // Set up automatic refresh
    const interval = setInterval(fetchWeatherData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchWeatherData, refreshInterval])

  return { weatherData, loading, error, refetch: fetchWeatherData }
}

export function useNDVIData(fieldId: string, refreshInterval = 86400000) {
  const [ndviData, setNdviData] = useState<NDVIData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNDVIData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const api = getAgroAPI()
      const data = await api.getNDVIData(fieldId)
      setNdviData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch NDVI data")
      console.error("[v0] NDVI data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [fieldId])

  useEffect(() => {
    if (fieldId) {
      fetchNDVIData()

      // Set up automatic refresh (daily for satellite data)
      const interval = setInterval(fetchNDVIData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchNDVIData, refreshInterval])

  return { ndviData, loading, error, refetch: fetchNDVIData }
}

export function useFieldData(userId: string, refreshInterval = 600000) {
  const [fieldData, setFieldData] = useState<FieldData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFieldData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const api = getAgroAPI()
      const data = await api.getFieldData(userId)
      setFieldData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch field data")
      console.error("[v0] Field data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateField = useCallback(async (fieldUpdate: Partial<FieldData>) => {
    try {
      const api = getAgroAPI()
      const updatedField = await api.updateFieldData(fieldUpdate)

      // Update local state
      setFieldData((prev) => prev.map((field) => (field.id === updatedField.id ? updatedField : field)))

      return updatedField
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update field")
      throw err
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchFieldData()

      // Set up automatic refresh
      const interval = setInterval(fetchFieldData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchFieldData, refreshInterval])

  return { fieldData, loading, error, refetch: fetchFieldData, updateField }
}
