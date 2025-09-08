import { NextRequest, NextResponse } from 'next/server'
import { getFarmerDataAggregator } from '@/lib/farmer-data-aggregator'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      name,
      phone,
      location,
      cropName,
      soilType,
      sowingDate,
      hasStorageCapacity,
      storageCapacity,
      irrigationMethod,
      farmingExperience,
      farmSize,
      previousYield,
      preferredLanguage = 'en'
    } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!cropName || !soilType || !sowingDate || !irrigationMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: cropName, soilType, sowingDate, irrigationMethod' },
        { status: 400 }
      )
    }

    console.log('[Farmer Profile API] Creating/updating profile for user:', userId)

    // Create or update user basic info
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        name,
        phone,
        location
      },
      create: {
        id: userId,
        email: `${userId}@temp.com`, // Temporary email, will be updated later
        name,
        phone,
        location
      }
    })

    // Create or update farmer profile
    const dataAggregator = getFarmerDataAggregator()
    const farmerProfile = await dataAggregator.updateFarmerProfile(userId, {
      cropName,
      soilType,
      sowingDate: new Date(sowingDate),
      hasStorageCapacity: Boolean(hasStorageCapacity),
      storageCapacity: hasStorageCapacity ? parseFloat(storageCapacity) : null,
      irrigationMethod,
      farmingExperience: farmingExperience ? parseInt(farmingExperience) : null,
      farmSize: farmSize ? parseFloat(farmSize) : null,
      previousYield: previousYield ? parseFloat(previousYield) : null,
      preferredLanguage,
      isOnboardingComplete: true
    })

    console.log('[Farmer Profile API] Profile created/updated successfully')

    return NextResponse.json({
      success: true,
      profile: farmerProfile,
      message: 'Farmer profile saved successfully'
    })

  } catch (error: any) {
    console.error('[Farmer Profile API] Error saving profile:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Profile already exists for this user' },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to save farmer profile',
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

    // Get user with farmer profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location
      },
      farmerProfile: user.farmerProfile
    })

  } catch (error: any) {
    console.error('[Farmer Profile API] Error fetching profile:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch farmer profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('[Farmer Profile API] Updating profile for user:', userId)

    // Separate user data from farmer profile data
    const { name, phone, location, ...profileData } = updateData

    // Update user basic info if provided
    if (name !== undefined || phone !== undefined || location !== undefined) {
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(location !== undefined && { location })
        },
        create: {
          id: userId,
          email: `${userId}@temp.com`, // Temporary email, will be updated later
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(location !== undefined && { location })
        }
      })
    }

    // Update farmer profile if provided
    if (Object.keys(profileData).length > 0) {
      const processedProfileData = {
        ...profileData,
        ...(profileData.sowingDate && { sowingDate: new Date(profileData.sowingDate) }),
        ...(profileData.hasStorageCapacity !== undefined && { hasStorageCapacity: Boolean(profileData.hasStorageCapacity) }),
        ...(profileData.storageCapacity && { storageCapacity: parseFloat(profileData.storageCapacity) }),
        ...(profileData.farmingExperience && { farmingExperience: parseInt(profileData.farmingExperience) }),
        ...(profileData.farmSize && { farmSize: parseFloat(profileData.farmSize) }),
        ...(profileData.previousYield && { previousYield: parseFloat(profileData.previousYield) })
      }

      await prisma.farmerProfile.update({
        where: { userId },
        data: processedProfileData
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })

  } catch (error: any) {
    console.error('[Farmer Profile API] Error updating profile:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update farmer profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
