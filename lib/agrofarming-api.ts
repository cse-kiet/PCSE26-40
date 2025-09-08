interface AgroFarmingConfig {
  baseUrl: string
  apiKey: string
  endpoints: {
    weather: string
    ndvi: string
    satellite: string
    fields: string
  }
}

interface WeatherData {
  current: {
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: number
    pressure: number
    uvIndex: number
    visibility: number
    cloudCover: number
    condition: string
    icon: string
  }
  forecast: Array<{
    date: string
    high: number
    low: number
    condition: string
    icon: string
    precipitation: number
    humidity: number
    windSpeed: number
  }>
  alerts: Array<{
    type: string
    severity: string
    title: string
    description: string
    startTime: string
    endTime: string
  }>
}

interface NDVIData {
  fieldId: string
  date: string
  ndviValue: number
  cloudCover: number
  satellite: string
  statistics: {
    max: number
    mean: number
    median: number
    min: number
    deviation: number
    count: number
  }
}

interface FieldData {
  id: string
  name: string
  coordinates: Array<{ lat: number; lng: number }>
  area: number
  cropType: string
  plantingDate: string
  currentNDVI: number
  status: "excellent" | "good" | "fair" | "poor"
  lastUpdated: string
}

class AgroFarmingAPI {
  private config: AgroFarmingConfig

  constructor(config: AgroFarmingConfig) {
    this.config = config
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`)

    // Add API key to headers or params based on API requirements
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      // Alternative: 'X-API-Key': this.config.apiKey,
    }

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[v0] AgroFarming API Error:`, error)
      throw error
    }
  }

  async getWeatherData(lat: number, lng: number): Promise<WeatherData> {
    return this.makeRequest<WeatherData>(this.config.endpoints.weather, {
      lat,
      lng,
      units: "metric",
      include: "current,forecast,alerts",
    })
  }

  async getNDVIData(fieldId: string, startDate?: string, endDate?: string): Promise<NDVIData[]> {
    return this.makeRequest<NDVIData[]>(this.config.endpoints.ndvi, {
      fieldId,
      startDate,
      endDate,
      includeStats: true,
    })
  }

  async getSatelliteImagery(lat: number, lng: number, zoom = 14): Promise<string> {
    const response = await this.makeRequest<{ imageUrl: string }>(this.config.endpoints.satellite, {
      lat,
      lng,
      zoom,
      layers: "ndvi,rgb",
    })
    return response.imageUrl
  }

  async getFieldData(userId: string): Promise<FieldData[]> {
    return this.makeRequest<FieldData[]>(this.config.endpoints.fields, {
      userId,
      includeStats: true,
    })
  }

  async updateFieldData(fieldData: Partial<FieldData>): Promise<FieldData> {
    const url = `${this.config.baseUrl}${this.config.endpoints.fields}/${fieldData.id}`

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(fieldData),
    })

    if (!response.ok) {
      throw new Error(`Failed to update field: ${response.status}`)
    }

    return await response.json()
  }
}

// Singleton instance - will be configured when API details are provided
let agroAPI: AgroFarmingAPI | null = null

export function initializeAgroAPI(config: AgroFarmingConfig) {
  agroAPI = new AgroFarmingAPI(config)
  return agroAPI
}

export function getAgroAPI(): AgroFarmingAPI {
  if (!agroAPI) {
    throw new Error("AgroFarming API not initialized. Call initializeAgroAPI first.")
  }
  return agroAPI
}

// Hook for React components
export function useAgroAPI() {
  return getAgroAPI()
}

export type { AgroFarmingConfig, WeatherData, NDVIData, FieldData }
