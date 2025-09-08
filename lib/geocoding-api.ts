interface GeocodingResult {
  lat: number;
  lng: number;
  formatted_address: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
}

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

class GeocodingService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key not found for geocoding');
    }
  }

  /**
   * Parse address components from Google Geocoding API response
   */
  private parseAddressComponents(addressComponents: Array<{ long_name: string; short_name: string; types: string[] }>): {
    state?: string;
    district?: string;
    city?: string;
    pincode?: string;
  } {
    const result: { state?: string; district?: string; city?: string; pincode?: string } = {};

    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
      } else if (component.types.includes('administrative_area_level_3')) {
        result.district = component.long_name;
      } else if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
        result.city = component.long_name;
      } else if (component.types.includes('postal_code')) {
        result.pincode = component.long_name;
      }
    }

    return result;
  }

  /**
   * Convert pincode to coordinates using Google Geocoding API
   */
  async geocodePincode(pincode: string): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    if (!pincode || pincode.length !== 6) {
      throw new Error('Invalid pincode format. Please enter a 6-digit pincode');
    }

    try {
      // Add "India" to the search query for better accuracy
      const query = `${pincode}, India`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data: GeocodeResponse = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressInfo = this.parseAddressComponents(result.address_components || []);
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          ...addressInfo,
        };
      } else if (data.status === 'ZERO_RESULTS') {
        throw new Error('No location found for this pincode. Please check and try again.');
      } else {
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to geocode pincode. Please check your internet connection.');
    }
  }

  /**
   * Reverse geocode coordinates to get address details
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data: GeocodeResponse = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressInfo = this.parseAddressComponents(result.address_components || []);
        return {
          lat,
          lng,
          formatted_address: result.formatted_address,
          ...addressInfo,
        };
      } else {
        throw new Error(`Reverse geocoding failed: ${data.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reverse geocode coordinates.');
    }
  }
}

// Export a singleton instance
export const geocodingService = new GeocodingService();

// Export types for use in components
export type { GeocodingResult };
