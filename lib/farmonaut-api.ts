interface FarmonautConfig {
  apiKey: string
  baseUrl: string
}

interface FieldData {
  UID: string
  CropCode: string
  FieldName: string
  PaymentType: string
  Points: Record<string, { Latitude: number; Longitude: number }>
}

interface SatelliteImageResponse {
  imageUrl: string
  imageType: string
  date: string
  cloudCover: number
  ndviValue: number
  ndwiValue: number
  eviValue: number
  saviValue: number
  ndreValue: number
  socValue: number
  rviValue: number
}

interface WeatherData {
  temperature: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  cloudCover: number
  precipitation: number
  uvIndex: number
  soilMoisture: number
  evapotranspiration: number
  date: string
}

class FarmonautAPI {
  private config: FarmonautConfig

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: "https://us-central1-farmbase-b2f7e.cloudfunctions.net",
    }
  }

  private async makeRequest(endpoint: string, data: any) {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async submitField(fieldData: FieldData) {
    return this.makeRequest("/submitField", fieldData)
  }

  async getSatelliteData(fieldId: string, imageType = "NDVI") {
    return this.makeRequest("/getSatelliteData", {
      fieldId,
      imageType,
    })
  }

  async getWeatherData(latitude: number, longitude: number) {
    return this.makeRequest("/getWeatherData", {
      latitude,
      longitude,
    })
  }

  async getFieldAnalysis(fieldId: string) {
    return this.makeRequest("/getFieldAnalysis", {
      fieldId,
    })
  }

  async getHistoricalData(fieldId: string, startDate: string, endDate: string) {
    return this.makeRequest("/getHistoricalData", {
      fieldId,
      startDate,
      endDate,
    })
  }
}

export const farmonautAPI = new FarmonautAPI("7b4722e257372781f63a9c31cab00077")

// Utility functions for data processing
export const processNDVIData = (rawData: any) => {
  return {
    value: rawData.ndviValue || 0,
    status:
      rawData.ndviValue > 0.7
        ? "Excellent"
        : rawData.ndviValue > 0.5
          ? "Good"
          : rawData.ndviValue > 0.3
            ? "Fair"
            : "Poor",
    color:
      rawData.ndviValue > 0.7
        ? "#06653d"
        : rawData.ndviValue > 0.5
          ? "#11a75f"
          : rawData.ndviValue > 0.3
            ? "#fbc07e"
            : "#ea4f3b",
  }
}

export const processSoilData = (rawData: any) => {
  return {
    moisture: rawData.soilMoisture || 0,
    organicCarbon: rawData.socValue || 0,
    temperature: rawData.soilTemperature || 0,
    ph: rawData.soilPH || 7.0,
  }
}

export const processWeatherData = (rawData: any): WeatherData => {
  return {
    temperature: rawData.temperature || 0,
    humidity: rawData.humidity || 0,
    pressure: rawData.pressure || 0,
    windSpeed: rawData.windSpeed || 0,
    windDirection: rawData.windDirection || 0,
    cloudCover: rawData.cloudCover || 0,
    precipitation: rawData.precipitation || 0,
    uvIndex: rawData.uvIndex || 0,
    soilMoisture: rawData.soilMoisture || 0,
    evapotranspiration: rawData.evapotranspiration || 0,
    date: rawData.date || new Date().toISOString(),
  }
}
