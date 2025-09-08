import { NextRequest, NextResponse } from 'next/server'
import { getFarmerDataAggregator } from '@/lib/farmer-data-aggregator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId parameter is required' },
        { status: 400 }
      )
    }

    console.log('[Debug API] Fetching data for user:', userId)

    // Get comprehensive farmer data
    const dataAggregator = getFarmerDataAggregator()
    const farmerData = await dataAggregator.getFarmerData(userId, {
      includeHistoricalData: true,
      maxHistoryDays: 7,
      requireAllData: false
    })

    // Return detailed debugging information
    return NextResponse.json({
      userId,
      timestamp: new Date().toISOString(),
      profile: {
        cropName: farmerData.cropName,
        soilType: farmerData.soilType,
        sowingDate: farmerData.sowingDate,
        irrigationMethod: farmerData.irrigationMethod,
        farmSize: farmerData.farmSize
      },
      dataAvailability: {
        weather: !!farmerData.currentWeather,
        ndvi: !!(farmerData.ndviData && farmerData.ndviData.length > 0),
        soil: !!(farmerData.soilData && farmerData.soilData.length > 0),
        uv: farmerData.uvIndex !== undefined && farmerData.uvIndex !== null,
        forecast: !!(farmerData.forecast && farmerData.forecast.length > 0)
      },
      dataCounts: {
        ndviEntries: farmerData.ndviData?.length || 0,
        soilEntries: farmerData.soilData?.length || 0,
        forecastEntries: farmerData.forecast?.length || 0
      },
      actualData: {
        currentWeather: farmerData.currentWeather || null,
        latestNDVI: farmerData.ndviData?.[0] || null,
        latestSoil: farmerData.soilData?.[0] || null,
        uvIndex: farmerData.uvIndex,
        upcomingForecast: farmerData.forecast?.slice(0, 2) || null
      },
      dataCompleteness: farmerData.dataCompleteness,
      lastUpdated: farmerData.lastUpdated
    })

  } catch (error: any) {
    console.error('[Debug API] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
