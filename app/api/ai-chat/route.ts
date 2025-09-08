import { NextRequest, NextResponse } from 'next/server'
import { getGeminiAI } from '@/lib/gemini-ai'
import { getFarmerDataAggregator } from '@/lib/farmer-data-aggregator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userId, context } = body

    console.log('[AI Chat API] Request summary:', { 
      messageLength: message.length, 
      hasUserId: !!userId, 
      userId: userId ? `${userId.substring(0, 8)}...` : null,
      contextKeys: context ? Object.keys(context) : null,
      selectedPolygonId: context?.selectedField?.id ? `${context.selectedField.id.substring(0, 8)}...` : null,
      selectedFieldName: context?.selectedField?.name
    })

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('[AI Chat API] Processing message for user:', userId)
    console.log('[AI Chat API] Message:', message)

    // Get comprehensive farmer data if userId is provided
    let farmerData = null
    let dataCompleteness = null

    if (userId) {
      try {
        console.log('[AI Chat API] Fetching comprehensive farmer data for user:', userId)
        const dataAggregator = getFarmerDataAggregator()
        farmerData = await dataAggregator.getFarmerData(userId, {
          includeHistoricalData: true,
          maxHistoryDays: 7, // Get recent data for context
          requireAllData: false
        }, context)
        dataCompleteness = farmerData.dataCompleteness
        console.log('[AI Chat API] Farmer data fetched successfully')
        console.log('[AI Chat API] Data completeness:', dataCompleteness)
      } catch (dataError: any) {
        console.warn('[AI Chat API] Could not fetch comprehensive data:', dataError.message)
        // Continue with basic context if available
      }
    }

    // Generate AI response using Gemini with real data
    const geminiAI = getGeminiAI()
    
    try {
      let insights
      
      if (farmerData) {
        // Use comprehensive real data for AI insights
        console.log('[AI Chat API] Using comprehensive farmer data for AI analysis')
        console.log('[AI Chat API] Data available for Gemini AI:', {
          weather: !!farmerData.currentWeather,
          ndvi: farmerData.ndviData?.length || 0,
          soil: farmerData.soilData?.length || 0,
          uv: farmerData.uvIndex !== undefined ? farmerData.uvIndex : 'none',
          weatherDetails: farmerData.currentWeather ? `${farmerData.currentWeather.temp}°C, ${farmerData.currentWeather.humidity}%` : 'none',
          ndviSample: farmerData.ndviData?.[0] || 'none',
          soilSample: farmerData.soilData?.[0] || 'none',
          cropName: farmerData.cropName,
          totalDataElements: {
            ndviEntries: farmerData.ndviData?.length || 0,
            soilEntries: farmerData.soilData?.length || 0,
            forecastEntries: farmerData.forecast?.length || 0
          }
        })
        insights = await geminiAI.generateInsight(farmerData, message.trim())
      } else {
        // Fallback to basic context if no comprehensive data available
        console.log('[AI Chat API] Using basic context data for AI analysis')
        const basicFarmerData = {
          cropName: context?.userData?.cropName || context?.selectedField?.cropType || 'Mixed crops',
          soilType: context?.userData?.soilType || 'General soil',
          sowingDate: context?.userData?.sowingDate || new Date().toISOString().split('T')[0],
          hasStorageCapacity: context?.userData?.hasStorageCapacity || false,
          irrigationMethod: context?.userData?.irrigationMethod || 'Mixed methods',
          farmSize: context?.userData?.farmSize || context?.selectedField?.area || 1,
          location: context?.userLocation?.formatted_address || 'General location'
        }
        insights = await geminiAI.generateInsight(basicFarmerData, message.trim())
      }
      
      return NextResponse.json({
        response: insights.answer,
        recommendations: insights.recommendations || [],
        urgentAlerts: insights.urgentAlerts || [],
        confidence: insights.confidence || 0.8,
        sources: insights.sources || ['AI Analysis', 'Real-time Data'],
        dataUsed: {
          hasRealWeatherData: !!(farmerData?.currentWeather),
          hasNDVIData: !!(farmerData?.ndviData && farmerData.ndviData.length > 0),
          hasSoilData: !!(farmerData?.soilData && farmerData.soilData.length > 0),
          hasUVData: !!(farmerData?.uvIndex !== undefined && farmerData?.uvIndex !== null),
          dataCompleteness: dataCompleteness,
          debugInfo: {
            hadUserId: !!userId,
            hadFarmerData: !!farmerData,
            actualWeatherData: farmerData?.currentWeather ? 'available' : 'not available',
            actualNDVIData: farmerData?.ndviData ? `${farmerData.ndviData.length} records` : 'not available',
            actualSoilData: farmerData?.soilData ? `${farmerData.soilData.length} records` : 'not available',
            actualUVData: farmerData?.uvIndex !== undefined ? `${farmerData.uvIndex}` : 'not available'
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          messageLength: message.length,
          hasUserId: !!userId,
          hasComprehensiveData: !!farmerData,
          lastDataUpdate: farmerData?.lastUpdated
        }
      })
    } catch (geminiError) {
      console.error('[AI Chat API] Gemini AI error:', geminiError)
      
      // Enhanced fallback with real data if available
      let fallbackResponse
      if (farmerData) {
        fallbackResponse = generateDataDrivenFallback(message.trim(), farmerData)
      } else {
        fallbackResponse = generateFallbackResponse(message.trim())
      }
      
      return NextResponse.json({
        response: fallbackResponse.answer,
        recommendations: fallbackResponse.recommendations,
        urgentAlerts: fallbackResponse.urgentAlerts || [],
        confidence: 0.6,
        sources: ['Fallback Analysis', 'Historical Data'],
        warning: 'AI service temporarily unavailable. Using backup analysis with your data.',
        dataUsed: farmerData ? {
          hasRealWeatherData: !!(farmerData?.currentWeather),
          hasNDVIData: !!(farmerData?.ndviData && farmerData.ndviData.length > 0),
          hasSoilData: !!(farmerData?.soilData && farmerData.soilData.length > 0),
          hasUVData: !!(farmerData?.uvIndex !== undefined && farmerData?.uvIndex !== null),
          dataCompleteness: dataCompleteness,
          debugInfo: {
            hadUserId: !!userId,
            hadFarmerData: !!farmerData,
            actualWeatherData: farmerData?.currentWeather ? 'available' : 'not available',
            actualNDVIData: farmerData?.ndviData ? `${farmerData.ndviData.length} records` : 'not available',
            actualSoilData: farmerData?.soilData ? `${farmerData.soilData.length} records` : 'not available',
            actualUVData: farmerData?.uvIndex !== undefined ? `${farmerData.uvIndex}` : 'not available'
          }
        } : {
          hasRealWeatherData: false,
          hasNDVIData: false,
          hasSoilData: false,
          hasUVData: false,
          dataCompleteness: null,
          debugInfo: {
            hadUserId: !!userId,
            hadFarmerData: false,
            reason: 'No comprehensive farmer data available'
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          messageLength: message.length,
          hasUserId: !!userId,
          hasComprehensiveData: !!farmerData,
          fallbackUsed: true
        }
      })
    }

  } catch (error: any) {
    console.error('[AI Chat API] Error processing request:', error)

    return NextResponse.json(
      { 
        error: 'Failed to process your message. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

function generateDataDrivenFallback(message: string, farmerData: any): { answer: string; recommendations: string[]; urgentAlerts?: string[] } {
  const lowerMessage = message.toLowerCase()
  const urgentAlerts: string[] = []
  
  // Extract current conditions from real data
  const weather = farmerData.currentWeather
  const ndvi = farmerData.ndviData?.[0] // Most recent NDVI
  const soil = farmerData.soilData?.[0] // Most recent soil data
  const uvIndex = farmerData.uvIndex
  
  // Weather-based responses with real data
  if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('temperature')) {
    let answer = `Based on your current weather conditions: `
    const recommendations: string[] = []
    
    if (weather) {
      answer += `Temperature is ${weather.temp}°C with ${weather.humidity}% humidity. `
      
      if (weather.temp > 35) {
        urgentAlerts.push(`High temperature alert: ${weather.temp}°C - Protect crops and increase irrigation`)
        recommendations.push('Increase watering frequency due to high temperatures')
      } else if (weather.temp < 10) {
        urgentAlerts.push(`Low temperature alert: ${weather.temp}°C - Protect crops from cold`)
        recommendations.push('Protect crops from cold temperatures')
      }
      
      if (weather.humidity > 80) {
        recommendations.push('High humidity detected - monitor for fungal diseases')
      } else if (weather.humidity < 30) {
        recommendations.push('Low humidity - increase irrigation and consider mulching')
      }
      
      recommendations.push(`Current conditions: ${weather.description}`)
    } else {
      answer += `Monitor daily weather forecasts and plan activities accordingly.`
      recommendations.push('Check local weather forecasts daily')
    }
    
    return { answer, recommendations, urgentAlerts }
  }
  
  // Irrigation responses with soil moisture data
  if (lowerMessage.includes('irrigat') || lowerMessage.includes('water') || lowerMessage.includes('moisture')) {
    let answer = `Based on your soil conditions: `
    const recommendations: string[] = []
    
    if (soil) {
      answer += `Soil moisture is at ${soil.moisture}% with soil temperature ${soil.soilTemp}°C. `
      
      if (soil.moisture < 30) {
        urgentAlerts.push(`Low soil moisture: ${soil.moisture}% - Irrigation needed`)
        recommendations.push('Irrigate immediately - soil moisture is critically low')
      } else if (soil.moisture > 80) {
        urgentAlerts.push(`High soil moisture: ${soil.moisture}% - Risk of waterlogging`)
        recommendations.push('Reduce watering - soil moisture is high, check drainage')
      } else {
        recommendations.push(`Soil moisture is adequate at ${soil.moisture}%`)
      }
      
      recommendations.push(`Soil temperature: ${soil.soilTemp}°C - ${soil.soilTemp > 25 ? 'Consider evening watering' : 'Morning watering is fine'}`)
    } else {
      answer += `Regular soil moisture monitoring is essential.`
      recommendations.push('Check soil moisture by digging 2-3 inches down')
    }
    
    return { answer, recommendations, urgentAlerts }
  }
  
  // Crop health with NDVI data
  if (lowerMessage.includes('crop') || lowerMessage.includes('plant') || lowerMessage.includes('health') || lowerMessage.includes('ndvi')) {
    let answer = `Based on your crop monitoring: `
    const recommendations: string[] = []
    
    if (ndvi) {
      answer += `Your crop NDVI is ${ndvi.ndviMean.toFixed(3)} indicating ${ndvi.ndviStatus} condition. `
      
      if (ndvi.ndviMean < 0.3) {
        urgentAlerts.push(`Low NDVI detected: ${ndvi.ndviMean.toFixed(3)} - Crop stress indicated`)
        recommendations.push('Investigate crop stress - check for pests, diseases, or nutrient deficiency')
      } else if (ndvi.ndviMean > 0.7) {
        recommendations.push(`Excellent crop health with NDVI ${ndvi.ndviMean.toFixed(3)}`)
      }
      
      recommendations.push(`${ndvi.description}`)
    } else {
      answer += `Regular crop monitoring and satellite data can help track health.`
    }
    
    recommendations.push('Monitor crops weekly for early detection of issues')
    return { answer, recommendations, urgentAlerts }
  }
  
  // UV Index based responses
  if (lowerMessage.includes('uv') || lowerMessage.includes('sun') || lowerMessage.includes('radiation')) {
    let answer = `Current UV conditions: `
    const recommendations: string[] = []
    
    if (uvIndex !== undefined) {
      answer += `UV Index is ${uvIndex}. `
      
      if (uvIndex > 8) {
        urgentAlerts.push(`Very high UV index: ${uvIndex} - Protect crops and workers`)
        recommendations.push('Provide shade for sensitive crops during peak hours')
      } else if (uvIndex > 6) {
        recommendations.push('Moderate to high UV - consider protective measures')
      }
      
      recommendations.push(`Work during early morning or evening when UV is lower`)
    }
    
    return { answer, recommendations, urgentAlerts }
  }
  
  // Default response with available data summary
  let answer = `Based on your current farm data: `
  const recommendations: string[] = []
  
  if (weather) {
    answer += `Weather: ${weather.temp}°C, ${weather.humidity}% humidity. `
  }
  if (soil) {
    answer += `Soil: ${soil.moisture}% moisture, ${soil.soilTemp}°C. `
  }
  if (ndvi) {
    answer += `Crop health: NDVI ${ndvi.ndviMean.toFixed(3)} (${ndvi.ndviStatus}). `
  }
  
  recommendations.push('Continue monitoring weather and soil conditions')
  recommendations.push('Maintain regular irrigation schedule based on soil moisture')
  recommendations.push('Keep detailed records of farming activities')
  
  return { answer, recommendations, urgentAlerts }
}

function generateFallbackResponse(message: string): { answer: string; recommendations: string[]; urgentAlerts?: string[] } {
  const lowerMessage = message.toLowerCase()
  
  // Weather-related questions
  if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('temperature')) {
    return {
      answer: 'Weather monitoring is crucial for successful farming. Check local weather forecasts daily and plan your farming activities accordingly.',
      recommendations: [
        'Monitor daily weather forecasts and rainfall predictions',
        'Adjust irrigation schedules based on expected rainfall',
        'Protect crops during extreme weather events',
        'Use weather data to time planting and harvesting'
      ],
      urgentAlerts: []
    }
  }
  
  // Irrigation questions
  if (lowerMessage.includes('irrigat') || lowerMessage.includes('water') || lowerMessage.includes('moisture')) {
    return {
      answer: 'Proper irrigation timing and methods are essential for healthy crop growth. Monitor soil moisture and adjust watering based on crop needs and weather conditions.',
      recommendations: [
        'Check soil moisture before watering',
        'Water during early morning or evening to reduce evaporation',
        'Use drip irrigation for water efficiency where possible',
        'Adjust irrigation frequency based on weather and crop stage'
      ],
      urgentAlerts: []
    }
  }
  
  // Crop health questions
  if (lowerMessage.includes('crop') || lowerMessage.includes('plant') || lowerMessage.includes('health') || lowerMessage.includes('disease')) {
    return {
      answer: 'Regular crop monitoring and preventive care are key to maintaining healthy plants. Look for signs of disease, pests, or nutrient deficiencies.',
      recommendations: [
        'Inspect crops weekly for signs of disease or pests',
        'Maintain proper spacing between plants for air circulation',
        'Apply organic fertilizers based on soil testing',
        'Remove diseased plants promptly to prevent spread'
      ],
      urgentAlerts: []
    }
  }
  
  // Soil questions
  if (lowerMessage.includes('soil') || lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrient')) {
    return {
      answer: 'Healthy soil is the foundation of successful farming. Regular soil testing and proper nutrient management ensure optimal crop growth.',
      recommendations: [
        'Test soil pH and nutrient levels annually',
        'Add organic matter like compost to improve soil structure',
        'Rotate crops to maintain soil health',
        'Use appropriate fertilizers based on soil test results'
      ],
      urgentAlerts: []
    }
  }
  
  // General farming advice
  return {
    answer: 'Successful farming requires careful planning, regular monitoring, and adapting to changing conditions. Focus on soil health, proper irrigation, and crop care.',
    recommendations: [
      'Create a seasonal farming calendar',
      'Keep detailed records of farming activities',
      'Stay updated with local agricultural extension services',
      'Connect with other farmers in your area for knowledge sharing'
    ],
    urgentAlerts: []
  }
}
