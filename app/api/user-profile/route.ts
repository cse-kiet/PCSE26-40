import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user with farmer profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse location coordinates from the location string
    let coordinates = null;
    if (user.location) {
      // Location format: "123456 (lat,lng)" or just "123456"
      const coordMatch = user.location.match(/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/);
      if (coordMatch) {
        coordinates = {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      }
    }

    // Extract pincode from location
    let pincode = null;
    if (user.location) {
      const pincodeMatch = user.location.match(/^(\d{6})/);
      if (pincodeMatch) {
        pincode = pincodeMatch[1];
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        location: user.location,
        coordinates,
        pincode,
        farmerProfile: user.farmerProfile ? {
          cropName: user.farmerProfile.cropName,
          soilType: user.farmerProfile.soilType,
          sowingDate: user.farmerProfile.sowingDate,
          hasStorageCapacity: user.farmerProfile.hasStorageCapacity,
          storageCapacity: user.farmerProfile.storageCapacity,
          irrigationMethod: user.farmerProfile.irrigationMethod,
          farmingExperience: user.farmerProfile.farmingExperience,
          farmSize: user.farmerProfile.farmSize,
          previousYield: user.farmerProfile.previousYield,
          preferredLanguage: user.farmerProfile.preferredLanguage,
          isOnboardingComplete: user.farmerProfile.isOnboardingComplete
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch user profile',
        success: false 
      },
      { status: 500 }
    );
  }
}
