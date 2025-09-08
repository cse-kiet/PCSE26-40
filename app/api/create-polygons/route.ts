import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAgromonitoringAPI } from '@/lib/agromonitoring-api'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('[Create Polygons API] Creating polygons for user:', userId)

    // Get user's fields
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farms: {
          include: {
            fields: true
          }
        }
      }
    })

    if (!user?.farms.length || !user.farms[0].fields.length) {
      return NextResponse.json(
        { error: 'No fields found for user' },
        { status: 404 }
      )
    }

    const fields = user.farms[0].fields
    const agroAPI = getAgromonitoringAPI()
    const createdPolygons = []

    // Check existing polygons first
    const existingPolygons = await agroAPI.getPolygons()
    
    for (const field of fields) {
      try {
        // Check if polygon already exists
        const existingPolygon = existingPolygons.find((p: any) => 
          p.name.includes(field.name) || p.name.includes(user.name || 'Farm')
        )

        if (existingPolygon) {
          console.log(`[Create Polygons] Polygon already exists: ${existingPolygon.id} for field: ${field.name}`)
          createdPolygons.push({
            fieldId: field.id,
            fieldName: field.name,
            polygonId: existingPolygon.id,
            status: 'existing'
          })
          continue
        }

        // Create new polygon
        if (field.coordinates) {
          const coordsData = JSON.parse(field.coordinates)
          if (coordsData.type === 'Polygon' && coordsData.coordinates[0]) {
            const points = coordsData.coordinates[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }))
            
            const polygon = await agroAPI.createPolygon(field.name, points)
            console.log(`[Create Polygons] Created new polygon: ${polygon.id} for field: ${field.name}`)
            
            createdPolygons.push({
              fieldId: field.id,
              fieldName: field.name,
              polygonId: polygon.id,
              status: 'created'
            })
          }
        }
      } catch (error) {
        console.error(`[Create Polygons] Error creating polygon for field ${field.name}:`, error)
        createdPolygons.push({
          fieldId: field.id,
          fieldName: field.name,
          polygonId: null,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      totalFields: fields.length,
      createdPolygons,
      message: `Processed ${fields.length} fields for polygon creation`
    })

  } catch (error: any) {
    console.error('[Create Polygons API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create polygons',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
