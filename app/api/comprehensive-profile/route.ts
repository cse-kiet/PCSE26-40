import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getFarmerDataAggregator } from '@/lib/farmer-data-aggregator'
import { getGeminiAI } from '@/lib/gemini-ai'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      fullName,
      mobile,
      pincode,
      location,
      pincodeLocation,
      farmFields,
      primaryCrop,
      soilType,
      sowingDate,
      hasStorageCapacity,
      storageCapacity,
      irrigationMethod,
      farmingExperience,
      totalFarmSize,
      previousYield,
      preferredLanguage = 'en'
    } = body

    console.log('[Comprehensive Profile API] Creating complete profile for user:', userId)

    // Validate required fields
    if (!userId || !fullName || !mobile || !pincode || !primaryCrop || !soilType || !sowingDate || !irrigationMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!farmFields || farmFields.length === 0) {
      return NextResponse.json(
        { error: 'At least one farm field is required' },
        { status: 400 }
      )
    }

    // Create or update user
    const userData = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: fullName,
        phone: mobile,
        location: `${pincode}${location ? ` (${location.lat},${location.lng})` : ''}`
      },
      create: {
        id: userId,
        email: `${userId}@farmsat.temp`, // Temporary email
        name: fullName,
        phone: mobile,
        location: `${pincode}${location ? ` (${location.lat},${location.lng})` : ''}`
      }
    })

    // Create or update farmer profile
    const dataAggregator = getFarmerDataAggregator()
    const farmerProfile = await dataAggregator.updateFarmerProfile(userId, {
      cropName: primaryCrop,
      soilType,
      sowingDate: new Date(sowingDate),
      hasStorageCapacity: Boolean(hasStorageCapacity),
      storageCapacity: hasStorageCapacity && storageCapacity ? parseFloat(storageCapacity) : null,
      irrigationMethod,
      farmingExperience: farmingExperience ? parseInt(farmingExperience) : null,
      farmSize: totalFarmSize ? parseFloat(totalFarmSize) : null,
      previousYield: previousYield ? parseFloat(previousYield) : null,
      preferredLanguage,
      isOnboardingComplete: true
    })

    // Create farm and fields
    let farm
    if (farmFields.length > 0) {
      // Calculate total area from fields
      const totalArea = farmFields.reduce((sum: number, field: any) => sum + field.area, 0)
      
      // Create farm
      farm = await prisma.farm.create({
        data: {
          name: `${fullName}'s Farm`,
          description: `Farm with ${farmFields.length} field(s) growing ${primaryCrop}`,
          location: `${pincode}${location ? ` (${location.lat},${location.lng})` : ''}`,
          area: totalArea,
          userId
        }
      })

      // Create fields and polygons in agromonitoring
      try {
        const { getAgromonitoringAPI } = await import('@/lib/agromonitoring-api')
        const agroAPI = getAgromonitoringAPI()
        
        for (const field of farmFields) {
          // Create field in database
          const dbField = await prisma.field.create({
            data: {
              name: field.name,
              coordinates: field.coordinates, // GeoJSON polygon
              cropType: primaryCrop,
              area: field.area,
              farmId: farm.id
            }
          })

          // Create polygon in agromonitoring for satellite data
          try {
            const coordsData = JSON.parse(field.coordinates)
            if (coordsData.type === 'Polygon' && coordsData.coordinates[0]) {
              const points = coordsData.coordinates[0].map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
              }))
              
              const polygon = await agroAPI.createPolygon(field.name, points)
              console.log(`[Comprehensive Profile] Created agromonitoring polygon: ${polygon.id} for field: ${field.name}`)
            }
          } catch (polygonError) {
            console.warn(`[Comprehensive Profile] Could not create polygon for field ${field.name}:`, polygonError)
          }
        }
      } catch (agroError) {
        console.warn('[Comprehensive Profile] Agromonitoring polygon creation failed:', agroError)
      }
    }

    // Get weather and satellite data for the farm location
    let weatherData = null
    let satelliteInsights = null
    let aiInsights = null

    try {
      // Get location coordinates for weather data
      let coordinates = null
      if (location) {
        coordinates = { lat: location.lat, lng: location.lng }
      } else if (pincodeLocation) {
        coordinates = { lat: pincodeLocation.lat, lng: pincodeLocation.lng }
      }

      if (coordinates) {
        // Fetch weather data  
        weatherData = await fetch(`https://api.agromonitoring.com/agro/1.0/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${process.env.NEXT_PUBLIC_AGROMONITORING_API_KEY}`)
          .then(res => res.json())
          .catch(err => {
            console.warn('Weather API request failed:', err)
            return null
          })

        // Generate AI insights based on the complete profile
        const geminiAI = getGeminiAI()
        const profileContext = {
          farmer: {
            name: fullName,
            experience: farmingExperience ? parseInt(farmingExperience) : 0,
            location: pincode,
            preferredLanguage
          },
          farm: {
            totalArea: totalFarmSize ? parseFloat(totalFarmSize) : farmFields.reduce((sum: number, field: any) => sum + field.area, 0),
            fields: farmFields,
            primaryCrop,
            soilType,
            irrigationMethod,
            sowingDate: new Date(sowingDate),
            hasStorage: hasStorageCapacity,
            storageCapacity: hasStorageCapacity && storageCapacity ? parseFloat(storageCapacity) : null,
            previousYield: previousYield ? parseFloat(previousYield) : null
          },
          environmental: {
            weather: weatherData,
            coordinates
          }
        }

        aiInsights = await geminiAI.generateCropInsights({
          name: fullName,
          phone: mobile,
          location: `${pincode}${coordinates ? ` (${coordinates.lat}, ${coordinates.lng})` : ''}`,
          cropName: primaryCrop,
          soilType,
          sowingDate: new Date(sowingDate).toISOString().split('T')[0],
          hasStorageCapacity: hasStorageCapacity,
          storageCapacity: hasStorageCapacity && storageCapacity ? parseFloat(storageCapacity) : undefined,
          irrigationMethod,
          farmingExperience: farmingExperience ? parseInt(farmingExperience) : undefined,
          farmSize: profileContext.farm.totalArea,
          previousYield: previousYield ? parseFloat(previousYield) : undefined
        })
      }
    } catch (error) {
      console.error('[Comprehensive Profile API] Error fetching additional data:', error)
      // Continue without weather/AI data if there's an error
    }

    console.log('[Comprehensive Profile API] Profile created successfully with additional data')

    return NextResponse.json({
      success: true,
      profile: {
        user: userData,
        farmerProfile,
        farm,
        farmFields,
        weatherData,
        aiInsights
      },
      message: 'Complete farmer profile created successfully',
      recommendations: aiInsights || 'AI insights will be available shortly. Please check your dashboard.'
    })

  } catch (error: any) {
    console.error('[Comprehensive Profile API] Error saving comprehensive profile:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Profile already exists for this user' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to save comprehensive farmer profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        farms: {
          include: {
            fields: {
              include: {
                ndviData: {
                  orderBy: { date: 'desc' },
                  take: 10 // Get latest 10 NDVI readings
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get latest weather data if location is available
    let weatherData = null
    if (user.location) {
      try {
        // Parse coordinates from location string if available
        const coordMatch = user.location.match(/\(([-\d.]+),([-\d.]+)\)/)
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1])
          const lng = parseFloat(coordMatch[2])
          
          weatherData = await fetch(`https://api.agromonitoring.com/agro/1.0/weather?lat=${lat}&lon=${lng}&appid=${process.env.NEXT_PUBLIC_AGROMONITORING_API_KEY}`)
            .then(res => res.json())
            .catch(err => {
              console.warn('Weather API request failed:', err)
              return null
            })
        }
      } catch (error) {
        console.error('Error fetching weather data:', error)
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location
      },
      farmerProfile: user.farmerProfile,
      farms: user.farms,
      weatherData
    })

  } catch (error: any) {
    console.error('[Comprehensive Profile API] Error fetching comprehensive profile:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch comprehensive farmer profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
