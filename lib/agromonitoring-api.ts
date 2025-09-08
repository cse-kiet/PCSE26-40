interface AgromonitoringConfig {
  apiKey: string
  baseUrl: string
}

interface AgromonitoringWeatherResponse {
  dt: number
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
    sea_level?: number
    grnd_level?: number
  }
  wind: {
    speed: number
    deg: number
    gust?: number
  }
  clouds: {
    all: number
  }
  rain?: {
    "3h": number
  }
  snow?: {
    "3h": number
  }
}

interface ProcessedWeatherData {
  current: {
    temp: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
    pressure: number
    cloudCover: number
    feelsLike: number
  }
  forecast: Array<{
    date: string
    high: number
    low: number
    description: string
    precipitation: number
  }>
}

interface NDVIHistoryResponse {
  dt: number
  source: string
  zoom: number
  dc: number
  cl: number
  data: {
    std: number
    p75: number
    min: number
    max: number
    median: number
    p25: number
    num: number
    mean: number
  }
}

interface ProcessedNDVIData {
  date: string
  timestamp: number
  satellite: string
  ndviMean: number
  ndviMedian: number
  ndviMin: number
  ndviMax: number
  cloudCover: number
  dataCoverage: number
  pixelCount: number
  standardDeviation: number
  quartiles: {
    q25: number
    q75: number
  }
}

// Polygon API interfaces
interface GeoJSONPolygon {
  type: "Feature"
  properties: Record<string, any>
  geometry: {
    type: "Polygon"
    coordinates: number[][][] // [lon, lat] format
  }
}

interface CreatePolygonRequest {
  name: string
  geo_json: GeoJSONPolygon
}

interface PolygonResponse {
  id: string
  geo_json: GeoJSONPolygon
  name: string
  center: [number, number] // [lon, lat]
  area: number // hectares
  user_id: string
}

// Soil data interfaces
interface SoilData {
  dt: number // unix timestamp
  t10: number // temperature at 10cm depth in Kelvin
  moisture: number // soil moisture m3/m3
  t0: number // surface temperature in Kelvin
}

// UVI data interfaces
interface UVIData {
  dt: number // unix timestamp
  uvi: number // UV index
}

// Weather forecast interface
interface WeatherForecastItem {
  dt: number
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    sea_level?: number
    grnd_level?: number
    humidity: number
    temp_kf?: number
  }
  wind: {
    speed: number
    deg: number
    gust?: number
  }
  clouds: {
    all: number
  }
  rain?: {
    "3h": number
  }
  snow?: {
    "3h": number
  }
}

// Processed data interfaces for easier use
interface ProcessedSoilData {
  date: string
  timestamp: number
  surfaceTemp: number // Celsius
  soilTemp: number // Celsius  
  moisture: number // percentage
}

interface ProcessedUVIData {
  date: string
  timestamp: number
  uvIndex: number
  riskLevel: string
}

interface PolygonData {
  id: string
  name: string
  coordinates: Array<{ lat: number; lng: number }>
  area?: number
  cropType?: string
}

class AgromonitoringAPI {
  private config: AgromonitoringConfig

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: "https://api.agromonitoring.com/agro/1.0",
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`)
    
    // Add required parameters
    url.searchParams.append("appid", this.config.apiKey)
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    try {
      console.log(`[Agromonitoring] Making request to: ${endpoint}`)
      console.log(`[Agromonitoring] Request URL: ${url.toString().replace(this.config.apiKey, '***HIDDEN***')}`)
      console.log(`[Agromonitoring] Request params:`, params)
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        let errorText = ""
        let errorData = null
        
        try {
          errorText = await response.text()
          console.log(`[Agromonitoring] Error response text:`, errorText)
          // Try to parse as JSON for more detailed error info
          if (errorText) {
            try {
              errorData = JSON.parse(errorText)
              console.log(`[Agromonitoring] Error response JSON:`, errorData)
            } catch {
              // Not JSON, use text as is
              console.log(`[Agromonitoring] Error response is not JSON`)
            }
          }
        } catch (e) {
          errorText = "Unable to read error response"
          console.log(`[Agromonitoring] Failed to read error response:`, e)
        }

        const errorDetails = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          errorText,
          errorData,
          url: url.toString().replace(this.config.apiKey, '***HIDDEN***'), // Hide API key in logs
          params
        }
        
        console.error(`[Agromonitoring] API Error for ${endpoint}:`, errorDetails)
        
        // Check for specific error conditions
        if (response.status === 401) {
          throw new Error(`❌ Invalid Agromonitoring API key. Please check your API key at https://agromonitoring.com/api`)
        }
        
        if (response.status === 403) {
          throw new Error(`❌ Access forbidden for ${endpoint}. This endpoint may require a higher subscription plan.`)
        }
        
        if (response.status === 404) {
          throw new Error(`❌ Endpoint not found: ${endpoint}. Please check if the resource exists.`)
        }
        
        if (response.status === 429) {
          throw new Error(`❌ Rate limit exceeded. Please wait before making more requests.`)
        }
        
        // Provide more context based on endpoint
        let contextualMessage = ""
        if (endpoint.includes('/soil')) {
          contextualMessage = " (Note: Soil data may require a paid subscription plan)"
        } else if (endpoint.includes('/uvi')) {
          contextualMessage = " (Note: UVI data may require a paid subscription plan)"
        }
        
        // Generic error with more context
        const errorMessage = errorData?.message || errorText || `${response.status} ${response.statusText}`
        throw new Error(`API request failed for ${endpoint}: ${errorMessage}${contextualMessage}`)
      }

      const data = await response.json()
      console.log(`[Agromonitoring] Success for ${endpoint}:`, Array.isArray(data) ? `${data.length} items` : 'OK')
      return data
    } catch (error) {
      // Only log if it's not already a formatted error
      if (error instanceof Error && !error.message.includes('❌')) {
        console.error(`[Agromonitoring] Request failed for ${endpoint}:`, error)
      }
      throw error
    }
  }

  async getCurrentWeather(lat: number, lon: number, units: string = "metric"): Promise<AgromonitoringWeatherResponse> {
    return this.makeRequest<AgromonitoringWeatherResponse>("/weather", {
      lat,
      lon,
      units,
    })
  }

  async getNDVIHistory(
    polygonId: string, 
    startDate: number, 
    endDate: number, 
    options?: {
      type?: 'l8' | 's2' // Landsat-8 or Sentinel-2
      zoom?: number
      coverage_max?: number
      coverage_min?: number
      clouds_max?: number
      clouds_min?: number
    }
  ): Promise<NDVIHistoryResponse[]> {
    const params = {
      polyid: polygonId,
      start: startDate,
      end: endDate,
      ...options
    }
    
    return this.makeRequest<NDVIHistoryResponse[]>("/ndvi/history", params)
  }

  // =============================================================================
  // POLYGON MANAGEMENT APIS
  // =============================================================================

  async createPolygon(name: string, coordinates: Array<{ lat: number; lng: number }>): Promise<PolygonResponse> {
    // Convert coordinates to GeoJSON format [lon, lat]
    const geoJsonCoords = coordinates.map(coord => [coord.lng, coord.lat])
    // Ensure polygon is closed (first and last points must be identical)
    if (geoJsonCoords.length > 0) {
      const first = geoJsonCoords[0]
      const last = geoJsonCoords[geoJsonCoords.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) {
        geoJsonCoords.push([first[0], first[1]]) // Close the polygon
      }
    }

    const polygonData: CreatePolygonRequest = {
      name,
      geo_json: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [geoJsonCoords]
        }
      }
    }

    const url = new URL(`${this.config.baseUrl}/polygons`)
    url.searchParams.append("appid", this.config.apiKey)

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(polygonData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create polygon: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  }

  async getPolygons(): Promise<PolygonResponse[]> {
    return this.makeRequest<PolygonResponse[]>("/polygons", {})
  }

  async getPolygon(polygonId: string): Promise<PolygonResponse> {
    return this.makeRequest<PolygonResponse>(`/polygons/${polygonId}`, {})
  }

  async updatePolygon(polygonId: string, name: string): Promise<PolygonResponse> {
    const url = new URL(`${this.config.baseUrl}/polygons/${polygonId}`)
    url.searchParams.append("appid", this.config.apiKey)

    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update polygon: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  }

  async deletePolygon(polygonId: string): Promise<void> {
    const url = new URL(`${this.config.baseUrl}/polygons/${polygonId}`)
    url.searchParams.append("appid", this.config.apiKey)

    const response = await fetch(url.toString(), {
      method: "DELETE"
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete polygon: ${response.status} ${response.statusText} - ${errorText}`)
    }
  }

  // =============================================================================
  // WEATHER APIS
  // =============================================================================

  async getWeatherForecast(lat: number, lon: number, units: string = "metric"): Promise<WeatherForecastItem[]> {
    return this.makeRequest<WeatherForecastItem[]>("/weather/forecast", {
      lat,
      lon,
      units,
    })
  }

  // =============================================================================
  // SOIL DATA APIS
  // =============================================================================

  async getCurrentSoilData(polygonId: string): Promise<SoilData> {
    return this.makeRequest<SoilData>("/soil", {
      polyid: polygonId
    })
  }

  async getSoilHistory(
    polygonId: string, 
    startDate: number, 
    endDate: number
  ): Promise<SoilData[]> {
    // Validate inputs
    if (!polygonId || polygonId.trim() === '') {
      throw new Error('Polygon ID is required for soil history')
    }
    if (!startDate || !endDate) {
      throw new Error('Start and end dates are required for soil history')
    }
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date')
    }
    
    console.log(`[Agromonitoring] Fetching soil history for polygon ${polygonId} from ${new Date(startDate * 1000).toISOString()} to ${new Date(endDate * 1000).toISOString()}`)
    
    return this.makeRequest<SoilData[]>("/soil/history", {
      polyid: polygonId,
      start: startDate,
      end: endDate
    })
  }

  // =============================================================================
  // UVI DATA APIS
  // =============================================================================

  async getCurrentUVI(polygonId: string): Promise<UVIData> {
    return this.makeRequest<UVIData>("/uvi", {
      polyid: polygonId
    })
  }

  async getUVIForecast(polygonId: string, days: number = 7): Promise<UVIData[]> {
    // Validate inputs
    if (!polygonId || polygonId.trim() === '') {
      throw new Error('Polygon ID is required for UVI forecast')
    }
    if (days <= 0 || days > 30) {
      throw new Error('Days must be between 1 and 30 for UVI forecast')
    }
    
    console.log(`[Agromonitoring] Fetching UVI forecast for polygon ${polygonId} for ${days} days`)
    
    return this.makeRequest<UVIData[]>("/uvi/forecast", {
      polyid: polygonId,
      cnt: days
    })
  }

  async getUVIHistory(
    polygonId: string, 
    startDate: number, 
    endDate: number
  ): Promise<UVIData[]> {
    return this.makeRequest<UVIData[]>("/uvi/history", {
      polyid: polygonId,
      start: startDate,
      end: endDate
    })
  }

  processWeatherData(rawData: AgromonitoringWeatherResponse): ProcessedWeatherData {
    return {
      current: {
        temp: Math.round(rawData.main.temp),
        humidity: rawData.main.humidity,
        windSpeed: Math.round(rawData.wind.speed * 3.6), // Convert m/s to km/h
        description: rawData.weather[0]?.description || "Unknown",
        icon: rawData.weather[0]?.icon || "01d",
        pressure: rawData.main.pressure,
        cloudCover: rawData.clouds.all,
        feelsLike: Math.round(rawData.main.feels_like),
      },
      forecast: [], // Agromonitoring current weather endpoint doesn't provide forecast
    }
  }

  processNDVIData(rawData: NDVIHistoryResponse[]): ProcessedNDVIData[] {
    return rawData.map(item => ({
      date: new Date(item.dt * 1000).toISOString().split('T')[0], // Convert unix timestamp to date string
      timestamp: item.dt,
      satellite: item.source === 'l8' ? 'Landsat-8' : item.source === 's2' ? 'Sentinel-2' : item.source,
      ndviMean: Number(item.data.mean.toFixed(4)),
      ndviMedian: Number(item.data.median.toFixed(4)),
      ndviMin: Number(item.data.min.toFixed(4)),
      ndviMax: Number(item.data.max.toFixed(4)),
      cloudCover: Number((item.cl * 100).toFixed(1)), // Convert to percentage
      dataCoverage: Number(item.dc.toFixed(1)),
      pixelCount: item.data.num,
      standardDeviation: Number(item.data.std.toFixed(4)),
      quartiles: {
        q25: Number(item.data.p25.toFixed(4)),
        q75: Number(item.data.p75.toFixed(4))
      }
    })).sort((a, b) => a.timestamp - b.timestamp) // Sort by date ascending
  }

  // Utility method to convert dates to unix timestamps
  dateToUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000)
  }

  // =============================================================================
  // DATA PROCESSING UTILITIES
  // =============================================================================

  processWeatherForecast(rawData: WeatherForecastItem[]): ProcessedWeatherData {
    // Process forecast data into our format
    const forecast = rawData.slice(0, 7).map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString(),
      high: Math.round(item.main.temp_max),
      low: Math.round(item.main.temp_min),
      description: item.weather[0]?.description || "Unknown",
      precipitation: item.rain?.["3h"] || item.snow?.["3h"] || 0
    }))

    // Use first item as current weather if available
    const current = rawData[0] ? {
      temp: Math.round(rawData[0].main.temp),
      humidity: rawData[0].main.humidity,
      windSpeed: Math.round(rawData[0].wind.speed * 3.6), // Convert m/s to km/h
      description: rawData[0].weather[0]?.description || "Unknown",
      icon: rawData[0].weather[0]?.icon || "01d",
      pressure: rawData[0].main.pressure,
      cloudCover: rawData[0].clouds.all,
      feelsLike: Math.round(rawData[0].main.feels_like),
    } : {
      temp: 0, humidity: 0, windSpeed: 0, description: "No data", 
      icon: "01d", pressure: 0, cloudCover: 0, feelsLike: 0
    }

    return { current, forecast }
  }

  processSoilData(rawData: SoilData[]): ProcessedSoilData[] {
    return rawData.map(item => ({
      date: new Date(item.dt * 1000).toISOString().split('T')[0],
      timestamp: item.dt,
      surfaceTemp: Number((item.t0 - 273.15).toFixed(1)), // Convert Kelvin to Celsius
      soilTemp: Number((item.t10 - 273.15).toFixed(1)), // Convert Kelvin to Celsius
      moisture: Number((item.moisture * 100).toFixed(1)) // Convert to percentage
    })).sort((a, b) => a.timestamp - b.timestamp)
  }

  processUVIData(rawData: UVIData[]): ProcessedUVIData[] {
    return rawData.map(item => ({
      date: new Date(item.dt * 1000).toISOString().split('T')[0],
      timestamp: item.dt,
      uvIndex: Number(item.uvi.toFixed(1)),
      riskLevel: this.getUVIRiskLevel(item.uvi)
    })).sort((a, b) => a.timestamp - b.timestamp)
  }

  // Helper function to convert coordinates between formats
  convertCoordinatesToGeoJSON(coordinates: Array<{ lat: number; lng: number }>): number[][] {
    return coordinates.map(coord => [coord.lng, coord.lat]) // [lon, lat] format
  }

  convertGeoJSONToCoordinates(geoJson: GeoJSONPolygon): Array<{ lat: number; lng: number }> {
    if (geoJson.geometry.coordinates.length > 0) {
      return geoJson.geometry.coordinates[0].map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }))
    }
    return []
  }

  // Utility method to get NDVI status based on mean value
  getNDVIStatus(ndviMean: number): { status: string; color: string; description: string } {
    if (ndviMean >= 0.7) {
      return { 
        status: "Excellent", 
        color: "#10b981", 
        description: "Very healthy vegetation with dense canopy" 
      }
    } else if (ndviMean >= 0.5) {
      return { 
        status: "Good", 
        color: "#22c55e", 
        description: "Healthy vegetation with good canopy coverage" 
      }
    } else if (ndviMean >= 0.3) {
      return { 
        status: "Fair", 
        color: "#f59e0b", 
        description: "Moderate vegetation health, may need attention" 
      }
    } else if (ndviMean >= 0.1) {
      return { 
        status: "Poor", 
        color: "#ef4444", 
        description: "Stressed vegetation, requires immediate attention" 
      }
    } else {
      return { 
        status: "Very Poor", 
        color: "#dc2626", 
        description: "Severely stressed or sparse vegetation" 
      }
    }
  }

  // Utility method to get UVI risk level
  getUVIRiskLevel(uvi: number): string {
    if (uvi <= 2) return "Low"
    if (uvi <= 5) return "Moderate"
    if (uvi <= 7) return "High"
    if (uvi <= 10) return "Very High"
    return "Extreme"
  }

  // Utility method to validate polygon exists
  async validatePolygon(polygonId: string): Promise<boolean> {
    try {
      await this.getPolygon(polygonId)
      return true
    } catch (error) {
      console.warn(`[Agromonitoring] Polygon ${polygonId} validation failed:`, error instanceof Error ? error.message : error)
      return false
    }
  }

  // Utility method to get soil moisture status
  getSoilMoistureStatus(moisture: number): { status: string; color: string; description: string } {
    if (moisture >= 40) {
      return {
        status: "Optimal",
        color: "#10b981",
        description: "Excellent soil moisture for plant growth"
      }
    } else if (moisture >= 25) {
      return {
        status: "Good",
        color: "#22c55e", 
        description: "Good soil moisture levels"
      }
    } else if (moisture >= 15) {
      return {
        status: "Moderate",
        color: "#f59e0b",
        description: "Moderate soil moisture, may need irrigation"
      }
    } else if (moisture >= 10) {
      return {
        status: "Low",
        color: "#ef4444",
        description: "Low soil moisture, irrigation recommended"
      }
    } else {
      return {
        status: "Critical",
        color: "#dc2626",
        description: "Critical soil moisture levels, immediate irrigation needed"
      }
    }
  }
}

// Singleton instance
let agromonitoringAPI: AgromonitoringAPI | null = null

export function initializeAgromonitoringAPI(apiKey?: string) {
  // Use provided API key or get from environment variables
  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_AGROMONITORING_API_KEY
  
  if (!finalApiKey) {
    throw new Error("Agromonitoring API key not found. Please set NEXT_PUBLIC_AGROMONITORING_API_KEY in your environment variables.")
  }
  
  agromonitoringAPI = new AgromonitoringAPI(finalApiKey)
  return agromonitoringAPI
}

export function getAgromonitoringAPI(): AgromonitoringAPI {
  if (!agromonitoringAPI) {
    // Try to auto-initialize with environment variables
    try {
      agromonitoringAPI = initializeAgromonitoringAPI()
    } catch (error) {
      throw new Error("Agromonitoring API not initialized. Please set NEXT_PUBLIC_AGROMONITORING_API_KEY in your environment variables.")
    }
  }
  return agromonitoringAPI!
}

// Hook for React components
export function useAgromonitoringAPI() {
  return getAgromonitoringAPI()
}

export type { 
  AgromonitoringConfig, 
  AgromonitoringWeatherResponse, 
  ProcessedWeatherData,
  NDVIHistoryResponse,
  ProcessedNDVIData,
  PolygonData,
  PolygonResponse,
  CreatePolygonRequest,
  GeoJSONPolygon,
  SoilData,
  ProcessedSoilData,
  UVIData,
  ProcessedUVIData,
  WeatherForecastItem
}
