import { NextRequest, NextResponse } from 'next/server';
import { mandiPriceService } from '@/lib/mandi-api';
import { geocodingService } from '@/lib/geocoding-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const commodity = searchParams.get('commodity');
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    const limit = searchParams.get('limit');

    if (!commodity) {
      return NextResponse.json(
        { error: 'Commodity parameter is required' },
        { status: 400 }
      );
    }

    let finalState = state;
    let finalDistrict = district;

    // If lat/lng provided but no state/district, try to reverse geocode
    if (lat && lng && (!state || !district)) {
      try {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          const locationInfo = await geocodingService.reverseGeocode(latNum, lngNum);
          if (locationInfo) {
            finalState = finalState || locationInfo.state;
            finalDistrict = finalDistrict || locationInfo.district;
          }
        }
      } catch (error) {
        console.warn('Reverse geocoding failed:', error);
        // Continue without location filtering
      }
    }

    // Fetch mandi prices
    const prices = await mandiPriceService.getCommodityPricesByLocation(
      commodity,
      finalState,
      finalDistrict
    );

    // Process and enhance the data
    const processedPrices = prices.map(price => ({
      ...price,
      formattedMinPrice: mandiPriceService.formatPrice(price.min_price),
      formattedMaxPrice: mandiPriceService.formatPrice(price.max_price),
      formattedModalPrice: mandiPriceService.formatPrice(price.modal_price),
      averagePrice: mandiPriceService.calculateAveragePrice(price.min_price, price.max_price),
      formattedAveragePrice: mandiPriceService.formatPrice(
        mandiPriceService.calculateAveragePrice(price.min_price, price.max_price).toString()
      )
    }));

    return NextResponse.json({
      success: true,
      data: processedPrices,
      location: {
        state: finalState,
        district: finalDistrict
      },
      commodity,
      count: processedPrices.length
    });

  } catch (error) {
    console.error('Error fetching mandi prices:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch mandi prices',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, commodity, filters } = body;

    if (!commodity) {
      return NextResponse.json(
        { error: 'Commodity is required' },
        { status: 400 }
      );
    }

    let state = filters?.state;
    let district = filters?.district;

    // If location coordinates provided, reverse geocode to get state/district
    if (location && location.lat && location.lng) {
      try {
        const locationInfo = await geocodingService.reverseGeocode(location.lat, location.lng);
        if (locationInfo) {
          state = state || locationInfo.state;
          district = district || locationInfo.district;
        }
      } catch (error) {
        console.warn('Reverse geocoding failed:', error);
      }
    }

    // Fetch mandi prices
    const prices = await mandiPriceService.getCommodityPricesByLocation(
      commodity,
      state,
      district
    );

    // Process the data
    const processedPrices = prices.map(price => ({
      ...price,
      formattedMinPrice: mandiPriceService.formatPrice(price.min_price),
      formattedMaxPrice: mandiPriceService.formatPrice(price.max_price),
      formattedModalPrice: mandiPriceService.formatPrice(price.modal_price),
      averagePrice: mandiPriceService.calculateAveragePrice(price.min_price, price.max_price),
      formattedAveragePrice: mandiPriceService.formatPrice(
        mandiPriceService.calculateAveragePrice(price.min_price, price.max_price).toString()
      )
    }));

    return NextResponse.json({
      success: true,
      data: processedPrices,
      location: {
        state,
        district,
        coordinates: location
      },
      commodity,
      count: processedPrices.length
    });

  } catch (error) {
    console.error('Error fetching mandi prices:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch mandi prices',
        success: false 
      },
      { status: 500 }
    );
  }
}
