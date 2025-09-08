import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/farms - Get all farms for a user
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

    const farms = await prisma.farm.findMany({
      where: {
        userId: userId,
      },
      include: {
        fields: {
          include: {
            ndviData: {
              orderBy: {
                date: 'desc',
              },
              take: 1, // Get latest NDVI reading for each field
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(farms)
  } catch (error) {
    console.error('Error fetching farms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/farms - Create a new farm
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, location, area, userId } = body

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Name and User ID are required' },
        { status: 400 }
      )
    }

    const farm = await prisma.farm.create({
      data: {
        name,
        description,
        location,
        area: area ? parseFloat(area) : null,
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(farm, { status: 201 })
  } catch (error) {
    console.error('Error creating farm:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
