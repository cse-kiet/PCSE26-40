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

    // Fetch user with farmer profile, farms, and fields
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
                  take: 5
                }
              }
            }
          }
        }
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
        } : null,
        farms: user.farms.map(farm => ({
          id: farm.id,
          name: farm.name,
          description: farm.description,
          location: farm.location,
          area: farm.area,
          createdAt: farm.createdAt,
          fieldCount: farm.fields.length,
          totalFieldArea: farm.fields.reduce((sum, f) => sum + (f.area || 0), 0),
          fields: farm.fields.map(field => ({
            id: field.id,
            name: field.name,
            cropType: field.cropType,
            area: field.area,
            coordinates: field.coordinates,
            createdAt: field.createdAt,
            ndviDataCount: field.ndviData.length,
            latestNDVI: field.ndviData.length > 0 ? {
              date: field.ndviData[0].date,
              value: field.ndviData[0].value,
              source: field.ndviData[0].source
            } : null
          }))
        }))
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
