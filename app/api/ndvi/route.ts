import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/ndvi - Get NDVI readings for a field
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fieldId = searchParams.get('fieldId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!fieldId) {
      return NextResponse.json(
        { error: 'Field ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      fieldId: fieldId,
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        whereClause.date.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate)
      }
    }

    const ndviReadings = await prisma.nDVIReading.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
      include: {
        field: {
          select: {
            name: true,
            cropType: true,
          },
        },
      },
    })

    return NextResponse.json(ndviReadings)
  } catch (error) {
    console.error('Error fetching NDVI readings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/ndvi - Store new NDVI reading
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { value, date, source, fieldId } = body

    if (!value || !date || !source || !fieldId) {
      return NextResponse.json(
        { error: 'Value, date, source, and Field ID are required' },
        { status: 400 }
      )
    }

    // Validate NDVI value range
    const ndviValue = parseFloat(value)
    if (ndviValue < -1 || ndviValue > 1) {
      return NextResponse.json(
        { error: 'NDVI value must be between -1 and 1' },
        { status: 400 }
      )
    }

    const ndviReading = await prisma.nDVIReading.create({
      data: {
        value: ndviValue,
        date: new Date(date),
        source,
        fieldId,
      },
      include: {
        field: {
          select: {
            name: true,
            cropType: true,
          },
        },
      },
    })

    return NextResponse.json(ndviReading, { status: 201 })
  } catch (error) {
    console.error('Error creating NDVI reading:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
