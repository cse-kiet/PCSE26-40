import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/fields - Get all fields for a farm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')

    if (!farmId) {
      return NextResponse.json(
        { error: 'Farm ID is required' },
        { status: 400 }
      )
    }

    const fields = await prisma.field.findMany({
      where: {
        farmId: farmId,
      },
      include: {
        ndviData: {
          orderBy: {
            date: 'desc',
          },
          take: 10, // Get latest 10 NDVI readings
        },
        farm: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    })

    return NextResponse.json(fields)
  } catch (error) {
    console.error('Error fetching fields:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/fields - Create a new field
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, coordinates, cropType, area, farmId } = body

    if (!name || !coordinates || !farmId) {
      return NextResponse.json(
        { error: 'Name, coordinates, and Farm ID are required' },
        { status: 400 }
      )
    }

    const field = await prisma.field.create({
      data: {
        name,
        coordinates,
        cropType,
        area: area ? parseFloat(area) : null,
        farmId,
      },
      include: {
        farm: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    })

    return NextResponse.json(field, { status: 201 })
  } catch (error) {
    console.error('Error creating field:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
