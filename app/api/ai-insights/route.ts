import { NextRequest, NextResponse } from 'next/server'
import { getGeminiAI } from '@/lib/gemini-ai'
import { getFarmerDataAggregator } from '@/lib/farmer-data-aggregator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, question, includeHistoricalData = true } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    console.log('[AI Insights API] Processing question for user:', userId)
    console.log('[AI Insights API] Question:', question)

    // Get comprehensive farmer data
    const dataAggregator = getFarmerDataAggregator()
    
    try {
      const farmerData = await dataAggregator.getFarmerData(userId, {
        includeHistoricalData,
        maxHistoryDays: 30,
        requireAllData: false
      })

      // Generate AI insights
      const geminiAI = getGeminiAI()
      const insights = await geminiAI.generateInsight(farmerData, question)

      // Add metadata about data sources and completeness
      const response = {
        ...insights,
        metadata: {
          userId,
          question,
          timestamp: new Date().toISOString(),
          dataCompleteness: farmerData.dataCompleteness,
          dataLastUpdated: farmerData.lastUpdated
        }
      }

      console.log('[AI Insights API] Insights generated successfully')
      
      return NextResponse.json(response)

    } catch (dataError: any) {
      console.error('[AI Insights API] Data aggregation error:', dataError)
      
      // Check if it's an onboarding issue
      if (dataError.message?.includes('onboarding not completed')) {
        return NextResponse.json(
          { 
            error: 'Please complete your farmer profile first',
            requiresOnboarding: true 
          },
          { status: 400 }
        )
      }

      // For other data errors, still try to provide basic AI response
      console.log('[AI Insights API] Attempting to provide basic response without complete data')
      
      try {
        const geminiAI = getGeminiAI()
        const basicInsights = await geminiAI.generateInsight({
          cropName: 'Unknown',
          soilType: 'Unknown', 
          sowingDate: new Date().toISOString().split('T')[0],
          hasStorageCapacity: false,
          irrigationMethod: 'Unknown'
        }, question)

        return NextResponse.json({
          ...basicInsights,
          warning: 'Limited data available. Please complete your profile for better insights.',
          metadata: {
            userId,
            question,
            timestamp: new Date().toISOString(),
            dataCompleteness: {
              profile: false,
              weather: false,
              ndvi: false,
              soil: false,
              forecast: false
            }
          }
        })
      } catch (aiError) {
        console.error('[AI Insights API] AI generation also failed:', aiError)
        throw dataError // Throw original error
      }
    }

  } catch (error: any) {
    console.error('[AI Insights API] Error processing request:', error)

    // Handle specific error types
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate insights. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint for predefined insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'general'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('[AI Insights API] Generating predefined insights:', type)

    // Get comprehensive farmer data
    const dataAggregator = getFarmerDataAggregator()
    const farmerData = await dataAggregator.getFarmerData(userId, {
      includeHistoricalData: true,
      maxHistoryDays: 30,
      requireAllData: false
    })

    // Generate specific type of insights
    const geminiAI = getGeminiAI()
    let insights

    switch (type) {
      case 'crop':
        insights = await geminiAI.generateCropInsights(farmerData)
        break
      case 'weather':
        insights = await geminiAI.generateWeatherBasedRecommendations(farmerData)
        break
      case 'irrigation':
        insights = await geminiAI.generateIrrigationRecommendations(farmerData)
        break
      default:
        insights = await geminiAI.generateCropInsights(farmerData)
    }

    const response = {
      ...insights,
      type,
      metadata: {
        userId,
        timestamp: new Date().toISOString(),
        dataCompleteness: farmerData.dataCompleteness,
        dataLastUpdated: farmerData.lastUpdated
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[AI Insights API] Error generating predefined insights:', error)

    if (error.message?.includes('onboarding not completed')) {
      return NextResponse.json(
        { 
          error: 'Please complete your farmer profile first',
          requiresOnboarding: true 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate insights. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
