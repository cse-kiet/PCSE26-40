"use client"

import { useState, useEffect } from "react"
import { getAgromonitoringAPI, type ProcessedWeatherData } from "@/lib/agromonitoring-api"

interface WeatherData {
  current: {
    temp: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
    pressure?: number
    cloudCover?: number
    feelsLike?: number
  }
  forecast: Array<{
    date: string
    high: number
    low: number
    description: string
    precipitation: number
  }>
}

export function useWeatherData(lat?: number, lng?: number) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      if (!lat || !lng) {
        // Use default location if coordinates not provided
        const defaultLat = 40.7128
        const defaultLng = -74.006
        await fetchWeatherData(defaultLat, defaultLng)
      } else {
        await fetchWeatherData(lat, lng)
      }
    }

    const fetchWeatherData = async (latitude: number, longitude: number) => {
      try {
        setLoading(true)
        setError(null)

        // Try to get the Agromonitoring API instance
        const api = getAgromonitoringAPI()
        
        // Fetch current weather data from Agromonitoring API
        const rawWeatherData = await api.getCurrentWeather(latitude, longitude, "metric")
        
        // Process the data into our format
        const processedData = api.processWeatherData(rawWeatherData)
        
        // Create weather data in our component's expected format
        const weatherData: WeatherData = {
          current: {
            temp: processedData.current.temp,
            humidity: processedData.current.humidity,
            windSpeed: processedData.current.windSpeed,
            description: processedData.current.description,
            icon: processedData.current.icon,
            pressure: processedData.current.pressure,
            cloudCover: processedData.current.cloudCover,
            feelsLike: processedData.current.feelsLike,
          },
          forecast: processedData.forecast, // Will be empty for now as Agromonitoring current weather doesn't include forecast
        }

        setWeather(weatherData)
        setError(null)
      } catch (err) {
        console.error("Weather API error:", err)
        
        // Check if it's an API initialization error
        if (err instanceof Error && err.message.includes("not initialized")) {
          setError("Agromonitoring API not configured. Please configure your API key first.")
        } else {
          setError(`Failed to fetch weather data: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [lat, lng])

  return { weather, loading, error }
}
