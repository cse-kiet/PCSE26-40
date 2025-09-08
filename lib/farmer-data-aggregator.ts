import { PrismaClient } from '@prisma/client'
import { getAgromonitoringAPI } from './agromonitoring-api'
import type { FarmerData } from './gemini-ai'

interface AggregatedFarmerData extends FarmerData {
  lastUpdated: Date
  dataCompleteness: {
    profile: boolean
    weather: boolean
    ndvi: boolean
    soil: boolean
    forecast: boolean
  }
}

interface DataAggregationOptions {
  includeHistoricalData?: boolean
  maxHistoryDays?: number
  requireAllData?: boolean
}

class FarmerDataAggregator {
  private prisma: PrismaClient
  private agroAPI: any

  constructor() {
    this.prisma = new PrismaClient()
    this.agroAPI = getAgromonitoringAPI()
  }

  /**
   * Get comprehensive farmer data by user ID and optional context
   */
  async getFarmerData(
    userId: string, 
    options: DataAggregationOptions = {},
    context?: any
  ): Promise<AggregatedFarmerData> {
    const {
      includeHistoricalData = true,
      maxHistoryDays = 30,
      requireAllData = false
    } = options

    try {
      console.log('[Data Aggregator] Fetching comprehensive data for user:', userId)
      
      // Get user and farmer profile from database
      const userData = await this.getUserAndProfile(userId)
      
      if (!userData.farmerProfile?.isOnboardingComplete) {
        throw new Error('Farmer onboarding not completed. Please complete your profile first.')
      }

      // Initialize aggregated data
      const aggregatedData: AggregatedFarmerData = {
        name: userData.name || undefined,
        phone: userData.phone || undefined,
        location: userData.location || undefined,
        cropName: userData.farmerProfile.cropName,
        soilType: userData.farmerProfile.soilType,
        sowingDate: userData.farmerProfile.sowingDate.toISOString().split('T')[0],
        hasStorageCapacity: userData.farmerProfile.hasStorageCapacity,
        storageCapacity: userData.farmerProfile.storageCapacity || undefined,
        irrigationMethod: userData.farmerProfile.irrigationMethod,
        farmingExperience: userData.farmerProfile.farmingExperience || undefined,
        farmSize: userData.farmerProfile.farmSize || undefined,
        previousYield: userData.farmerProfile.previousYield || undefined,
        lastUpdated: new Date(),
        dataCompleteness: {
          profile: true,
          weather: false,
          ndvi: false,
          soil: false,
          forecast: false
        }
      }

      // Get coordinates for API calls (try location first, then field coordinates)
      const coordinates = await this.extractCoordinates(userData.location, userId)
      
      if (!coordinates && requireAllData) {
        throw new Error('Location coordinates are required for environmental data')
      }

      // Fetch environmental data in parallel if coordinates available
      if (coordinates) {
        // Check if we have a selected polygon ID from context
        const selectedPolygonId = context?.selectedField?.id
        
        const [weatherData, forecastData, ndviData, soilData] = await Promise.allSettled([
          this.getCurrentWeatherData(coordinates.lat, coordinates.lon),
          this.getWeatherForecastData(coordinates.lat, coordinates.lon),
          includeHistoricalData ? this.getNDVIData(userId, maxHistoryDays, selectedPolygonId) : Promise.resolve(null),
          includeHistoricalData ? this.getSoilData(userId, maxHistoryDays, selectedPolygonId) : Promise.resolve(null)
        ])

        // Process weather data
        if (weatherData.status === 'fulfilled' && weatherData.value) {
          aggregatedData.currentWeather = weatherData.value
          aggregatedData.dataCompleteness.weather = true
        }

        // Process forecast data
        if (forecastData.status === 'fulfilled' && forecastData.value) {
          aggregatedData.forecast = forecastData.value
          aggregatedData.dataCompleteness.forecast = true
        }

        // Process NDVI data
        if (ndviData.status === 'fulfilled' && ndviData.value) {
          aggregatedData.ndviData = ndviData.value
          aggregatedData.dataCompleteness.ndvi = true
        }

        // Process soil data
        if (soilData.status === 'fulfilled' && soilData.value) {
          aggregatedData.soilData = soilData.value
          aggregatedData.dataCompleteness.soil = true
        }

        // Get UV index
        try {
          const selectedPolygonId = context?.selectedField?.id
          const uvData = await this.getUVData(userId, selectedPolygonId)
          if (uvData !== null) {
            aggregatedData.uvIndex = uvData
            // Add UV data completeness flag
            ;(aggregatedData.dataCompleteness as any).uv = true
          }
        } catch (error) {
          console.warn('[Data Aggregator] UV data fetch failed:', error)
        }
      }

      console.log('[Data Aggregator] Data aggregation completed:', {
        userId,
        completeness: aggregatedData.dataCompleteness,
        hasWeather: !!aggregatedData.currentWeather,
        hasNDVI: !!aggregatedData.ndviData?.length,
        hasSoil: !!aggregatedData.soilData?.length,
        hasUV: aggregatedData.uvIndex !== undefined && aggregatedData.uvIndex !== null,
        ndviDataCount: aggregatedData.ndviData?.length || 0,
        soilDataCount: aggregatedData.soilData?.length || 0,
        uvIndexValue: aggregatedData.uvIndex,
        weatherTemp: aggregatedData.currentWeather?.temp,
        actualDataSample: {
          ndvi: aggregatedData.ndviData?.[0],
          soil: aggregatedData.soilData?.[0]
        }
      })

      return aggregatedData

    } catch (error) {
      console.error('[Data Aggregator] Error aggregating farmer data:', error)
      throw error
    }
  }

  /**
   * Get user and farmer profile from database
   */
  private async getUserAndProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        farms: {
          include: {
            fields: true
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  /**
   * Extract coordinates from location string or field data
   */
  private async extractCoordinates(location?: string, userId?: string): Promise<{ lat: number; lon: number } | null> {
    // First try to parse from location string
    if (location) {
      // Try to parse as coordinates first (lat,lon format)
      const coordMatch = location.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/)
      if (coordMatch) {
        return {
          lat: parseFloat(coordMatch[1]),
          lon: parseFloat(coordMatch[2])
        }
      }
    }

    // If no coordinates in location, try to get from user's fields
    if (userId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            farms: {
              include: {
                fields: true
              }
            }
          }
        })

        if (user?.farms.length && user.farms[0].fields.length) {
          const field = user.farms[0].fields[0]
          
          // Try to extract center coordinates from field GeoJSON
          if (field.coordinates) {
            try {
              const coordsData = JSON.parse(field.coordinates)
              if (coordsData.type === 'Polygon' && coordsData.coordinates[0]) {
                const points = coordsData.coordinates[0]
                
                // Calculate center point
                let latSum = 0
                let lonSum = 0
                let validPoints = 0
                
                for (const coord of points) {
                  if (Array.isArray(coord) && coord.length >= 2) {
                    lonSum += coord[0] // longitude first in GeoJSON
                    latSum += coord[1] // latitude second in GeoJSON
                    validPoints++
                  }
                }
                
                if (validPoints > 0) {
                  const centerLat = latSum / validPoints
                  const centerLon = lonSum / validPoints
                  
                  console.log(`[Data Aggregator] Using field center coordinates: ${centerLat}, ${centerLon}`)
                  return {
                    lat: centerLat,
                    lon: centerLon
                  }
                }
              }
            } catch (parseError) {
              console.warn('[Data Aggregator] Could not parse field coordinates:', parseError)
            }
          }
        }
      } catch (error) {
        console.warn('[Data Aggregator] Error getting field coordinates:', error)
      }
    }

    console.warn('[Data Aggregator] Could not extract coordinates from location or fields')
    return null
  }

  /**
   * Get current weather data
   */
  private async getCurrentWeatherData(lat: number, lon: number) {
    try {
      console.log(`[Data Aggregator] Fetching weather data for coordinates: ${lat}, ${lon}`)
      const rawWeather = await this.agroAPI.getCurrentWeather(lat, lon, "metric")
      const processedWeather = this.agroAPI.processWeatherData(rawWeather)
      console.log('[Data Aggregator] Weather data fetched successfully:', processedWeather.current)
      return processedWeather.current
    } catch (error) {
      console.warn('[Data Aggregator] Weather data fetch failed:', error)
      return null
    }
  }

  /**
   * Get weather forecast data
   */
  private async getWeatherForecastData(lat: number, lon: number) {
    try {
      const rawForecast = await this.agroAPI.getWeatherForecast(lat, lon)
      const processedForecast = this.agroAPI.processWeatherForecast(rawForecast)
      return processedForecast.forecast
    } catch (error) {
      console.warn('[Data Aggregator] Forecast data fetch failed:', error)
      return null
    }
  }

  /**
   * Get NDVI data for user's fields
   */
  private async getNDVIData(userId: string, maxHistoryDays: number, selectedPolygonId?: string) {
    try {
      console.log(`[Data Aggregator] Fetching NDVI data for user: ${userId}`)
      
      // Get user's polygons/fields  
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          farms: {
            include: {
              fields: true
            }
          }
        }
      })

      if (!user?.farms.length || !user.farms[0].fields.length) {
        console.warn('[Data Aggregator] No fields found for NDVI data')
        return null
      }

      let polygonId = selectedPolygonId
      
      // If no selectedPolygonId provided, try to find/create one (fallback logic)
      if (!polygonId) {
        console.log('[Data Aggregator] No selectedPolygonId provided, trying to find/create polygon...')
        
        // Use the first field for NDVI data
        const field = user.farms[0].fields[0]
        
        // Try to get or create polygon for the field
        try {
          const existingPolygons = await this.agroAPI.getPolygons()
          
          // Find polygon that matches this field (by name or coordinates)
          const matchingPolygon = existingPolygons.find((p: any) => 
            p.name.includes(field.name) || p.name.includes(user.name || 'Farm')
          )
          
          if (matchingPolygon) {
            polygonId = matchingPolygon.id
            console.log(`[Data Aggregator] Using existing polygon: ${polygonId}`)
          } else {
            // Create polygon from field coordinates if needed
            if (field.coordinates) {
              try {
                const coordsData = JSON.parse(field.coordinates)
                if (coordsData.type === 'Polygon' && coordsData.coordinates[0]) {
                  const points = coordsData.coordinates[0].map((coord: number[]) => ({
                    lat: coord[1],
                    lng: coord[0]
                  }))
                  
                  const newPolygon = await this.agroAPI.createPolygon(field.name, points)
                  polygonId = newPolygon.id
                  console.log(`[Data Aggregator] Created new polygon: ${polygonId}`)
                }
              } catch (parseError) {
                console.warn('[Data Aggregator] Could not parse field coordinates:', parseError)
              }
            }
          }
        } catch (polygonError) {
          console.warn('[Data Aggregator] Error with polygons:', polygonError)
        }
      } else {
        console.log(`[Data Aggregator] Using selectedPolygonId: ${polygonId}`)
      }

      if (!polygonId) {
        console.warn('[Data Aggregator] No polygon available for NDVI data')
        return null
      }

      // Fetch real NDVI data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - maxHistoryDays)

      const startTimestamp = this.agroAPI.dateToUnixTimestamp(startDate)
      const endTimestamp = this.agroAPI.dateToUnixTimestamp(endDate)

      console.log(`[Data Aggregator] Fetching NDVI history for polygon ${polygonId}`)
      const rawNDVIData = await this.agroAPI.getNDVIHistory(polygonId, startTimestamp, endTimestamp)
      const processedNDVIData = this.agroAPI.processNDVIData(rawNDVIData)

      // Convert to format expected by AI
      const formattedData = processedNDVIData.map((item: any) => ({
        date: item.date,
        ndviMean: item.ndviMean,
        ndviStatus: item.ndviStatus,
        description: item.description
      }))

      console.log(`[Data Aggregator] Successfully fetched ${formattedData.length} NDVI data points`)
      return formattedData
    } catch (error) {
      console.warn('[Data Aggregator] NDVI data fetch failed:', error)
      return null
    }
  }

  /**
   * Get soil data for user's fields
   */
  private async getSoilData(userId: string, maxHistoryDays: number, selectedPolygonId?: string) {
    try {
      console.log(`[Data Aggregator] Fetching soil data for user: ${userId}`)
      
      // Get user's polygons/fields (similar to NDVI)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          farms: {
            include: {
              fields: true
            }
          }
        }
      })

      if (!user?.farms.length || !user.farms[0].fields.length) {
        console.warn('[Data Aggregator] No fields found for soil data')
        return null
      }

      let polygonId = selectedPolygonId
      
      // If no selectedPolygonId provided, try to find one (fallback logic)
      if (!polygonId) {
        console.log('[Data Aggregator] No selectedPolygonId provided for soil data, trying to find polygon...')
        
        const field = user.farms[0].fields[0]
        
        try {
          const existingPolygons = await this.agroAPI.getPolygons()
          const matchingPolygon = existingPolygons.find((p: any) => 
            p.name.includes(field.name) || p.name.includes(user.name || 'Farm')
          )
          
          if (matchingPolygon) {
            polygonId = matchingPolygon.id
            console.log(`[Data Aggregator] Using existing polygon for soil data: ${polygonId}`)
          }
        } catch (polygonError) {
          console.warn('[Data Aggregator] Error getting polygons for soil data:', polygonError)
        }
      } else {
        console.log(`[Data Aggregator] Using selectedPolygonId for soil data: ${polygonId}`)
      }

      if (!polygonId) {
        console.warn('[Data Aggregator] No polygon available for soil data')
        return null
      }

      // Fetch real soil data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - maxHistoryDays)

      const startTimestamp = this.agroAPI.dateToUnixTimestamp(startDate)
      const endTimestamp = this.agroAPI.dateToUnixTimestamp(endDate)

      console.log(`[Data Aggregator] Fetching soil history for polygon ${polygonId}`)
      
      // Get current soil data only (historical data removed)
      let rawSoilData
      try {
        // Use current soil data only
        const currentSoilData = await this.agroAPI.getCurrentSoilData(polygonId)
        rawSoilData = [currentSoilData] // Wrap in array for consistent processing
      } catch (currentError: any) {
        console.warn(`[Data Aggregator] Current soil data failed:`, currentError.message)
        throw currentError
      }
      
      const processedSoilData = this.agroAPI.processSoilData(rawSoilData)

      // Convert to format expected by AI
      const formattedData = processedSoilData.map((item: any) => ({
        date: item.date,
        surfaceTemp: item.surfaceTemp,
        soilTemp: item.soilTemp,
        moisture: item.moisture,
        moistureStatus: item.moistureStatus
      }))

      console.log(`[Data Aggregator] Successfully fetched ${formattedData.length} soil data points`)
      return formattedData
    } catch (error) {
      console.warn('[Data Aggregator] Soil data fetch failed:', error)
      return null
    }
  }

  /**
   * Get UV index data
   */
  private async getUVData(userId: string, selectedPolygonId?: string): Promise<number | null> {
    try {
      console.log(`[Data Aggregator] Fetching UV data for user: ${userId}`)
      
      // Get user's polygons/fields (similar to NDVI and soil)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          farms: {
            include: {
              fields: true
            }
          }
        }
      })

      if (!user?.farms.length || !user.farms[0].fields.length) {
        console.warn('[Data Aggregator] No fields found for UV data')
        return null
      }

      let polygonId = selectedPolygonId
      
      // If no selectedPolygonId provided, try to find one (fallback logic)
      if (!polygonId) {
        console.log('[Data Aggregator] No selectedPolygonId provided for UV data, trying to find polygon...')
        
        const field = user.farms[0].fields[0]
        
        try {
          const existingPolygons = await this.agroAPI.getPolygons()
          const matchingPolygon = existingPolygons.find((p: any) => 
            p.name.includes(field.name) || p.name.includes(user.name || 'Farm')
          )
          
          if (matchingPolygon) {
            polygonId = matchingPolygon.id
            console.log(`[Data Aggregator] Using existing polygon for UV data: ${polygonId}`)
          }
        } catch (polygonError) {
          console.warn('[Data Aggregator] Error getting polygons for UV data:', polygonError)
        }
      } else {
        console.log(`[Data Aggregator] Using selectedPolygonId for UV data: ${polygonId}`)
      }

      if (!polygonId) {
        console.warn('[Data Aggregator] No polygon available for UV data')
        return null
      }

      // Fetch real UV data
      console.log(`[Data Aggregator] Fetching current UVI for polygon ${polygonId}`)
      
      let rawUVData
      try {
        rawUVData = await this.agroAPI.getCurrentUVI(polygonId)
        console.log(`[Data Aggregator] Successfully fetched UV index: ${rawUVData.uvi}`)
        return rawUVData.uvi
      } catch (uvError: any) {
        console.warn(`[Data Aggregator] UV data fetch failed:`, uvError.message)
        throw uvError
      }
    } catch (error) {
      console.warn('[Data Aggregator] UV data fetch failed:', error)
      return null
    }
  }

  /**
   * Update farmer profile data
   */
  async updateFarmerProfile(userId: string, profileData: any) {
    try {
      const updatedProfile = await this.prisma.farmerProfile.upsert({
        where: { userId },
        update: {
          ...profileData,
          updatedAt: new Date()
        },
        create: {
          ...profileData,
          userId,
          isOnboardingComplete: true
        }
      })

      console.log('[Data Aggregator] Farmer profile updated:', userId)
      return updatedProfile
    } catch (error) {
      console.error('[Data Aggregator] Error updating farmer profile:', error)
      throw error
    }
  }

  /**
   * Check if farmer has completed onboarding
   */
  async isOnboardingComplete(userId: string): Promise<boolean> {
    try {
      const farmerProfile = await this.prisma.farmerProfile.findUnique({
        where: { userId }
      })

      return farmerProfile?.isOnboardingComplete || false
    } catch (error) {
      console.error('[Data Aggregator] Error checking onboarding status:', error)
      return false
    }
  }

  /**
   * Get data completeness summary
   */
  async getDataCompletenessSummary(userId: string) {
    try {
      const data = await this.getFarmerData(userId, { requireAllData: false })
      
      const totalSources = Object.keys(data.dataCompleteness).length
      const completeSources = Object.values(data.dataCompleteness).filter(Boolean).length
      const completenessPercentage = Math.round((completeSources / totalSources) * 100)

      return {
        percentage: completenessPercentage,
        details: data.dataCompleteness,
        missingData: Object.entries(data.dataCompleteness)
          .filter(([_, complete]) => !complete)
          .map(([source]) => source),
        lastUpdated: data.lastUpdated
      }
    } catch (error) {
      console.error('[Data Aggregator] Error getting completeness summary:', error)
      throw error
    }
  }

  /**
   * Cleanup resources
   */
  async disconnect() {
    await this.prisma.$disconnect()
  }
}

// Singleton instance
let farmerDataAggregator: FarmerDataAggregator | null = null

export function getFarmerDataAggregator(): FarmerDataAggregator {
  if (!farmerDataAggregator) {
    farmerDataAggregator = new FarmerDataAggregator()
  }
  return farmerDataAggregator
}

export type { AggregatedFarmerData, DataAggregationOptions }
export default FarmerDataAggregator
