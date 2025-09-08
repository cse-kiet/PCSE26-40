# Mandi Price Integration Demo

This document demonstrates how to use the new mandi price integration feature.

## Overview

The mandi price integration allows farmers to check current market prices for their crops based on their location. The system:

1. Takes the user's location (from field coordinates or input)
2. Converts coordinates to state/district using Google Geocoding API
3. Fetches current commodity prices from the government mandi API
4. Displays prices in a user-friendly interface

## Features

### 1. Automatic Location Detection
- Uses field polygon coordinates to determine location
- Reverse geocodes to get state/district information
- Falls back to manual location input

### 2. Crop Name Mapping
- Maps common crop names to official commodity names in the mandi API
- Examples: "rice" → "Paddy(Dhan)(Common)", "wheat" → "Wheat"

### 3. Price Display
- Shows prices from multiple markets in the region
- Displays min, max, modal, and average prices
- Includes price trends and market information

## Usage

### In Dashboard
```tsx
import ComprehensiveDashboard from './comprehensive-dashboard'

// Pass crop name to enable mandi prices
<ComprehensiveDashboard 
  selectedPolygon={selectedPolygon}
  cropName="Rice" // Primary crop from farmer profile
/>
```

### Direct API Usage
```javascript
// GET request with coordinates
const response = await fetch('/api/mandi-prices?commodity=Rice&lat=19.0760&lng=72.8777')

// POST request with location object
const response = await fetch('/api/mandi-prices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    commodity: 'Rice',
    location: { lat: 19.0760, lng: 72.8777 },
    filters: {
      state: 'Maharashtra', // optional
      district: 'Mumbai' // optional
    }
  })
})
```

### Standalone Component
```tsx
import MandiPrices from './mandi-prices'

// Use with location and crop
<MandiPrices 
  location={{ lat: 19.0760, lng: 72.8777 }}
  crop="Rice"
/>

// Use without location (user can search manually)
<MandiPrices />
```

## API Response Format

```json
{
  "success": true,
  "data": [
    {
      "state": "Maharashtra",
      "district": "Mumbai",
      "market": "Vashi",
      "commodity": "Paddy(Dhan)(Common)",
      "variety": "Common",
      "grade": "FAQ",
      "arrival_date": "2024-01-15",
      "min_price": "2100",
      "max_price": "2300",
      "modal_price": "2200",
      "formattedMinPrice": "₹2100.00",
      "formattedMaxPrice": "₹2300.00",
      "formattedModalPrice": "₹2200.00",
      "averagePrice": 2200,
      "formattedAveragePrice": "₹2200.00"
    }
  ],
  "location": {
    "state": "Maharashtra",
    "district": "Mumbai"
  },
  "commodity": "Rice",
  "count": 1
}
```

## Common Crop Mappings

| User Input | API Commodity Name |
|------------|-------------------|
| Rice/Paddy | Paddy(Dhan)(Common) |
| Wheat | Wheat |
| Maize/Corn | Maize |
| Cotton | Cotton |
| Sugarcane | Sugarcane |
| Soybean/Soya | Soyabean |
| Onion | Onion |
| Potato | Potato |
| Tomato | Tomato |
| Chili/Chilli | Chili Red |

## Testing the Integration

### 1. Test API Endpoint
```bash
# Test with coordinates
curl "http://localhost:3000/api/mandi-prices?commodity=Rice&lat=19.0760&lng=72.8777"

# Test with state/district
curl "http://localhost:3000/api/mandi-prices?commodity=Wheat&state=Punjab&district=Ludhiana"
```

### 2. Test in Dashboard
1. Create or select a farm field
2. Go to the "Market Prices" tab
3. Search for a commodity (e.g., "Rice", "Wheat")
4. View results from nearby mandis

### 3. Test Standalone Component
1. Navigate to a page with the MandiPrices component
2. Use quick select buttons for popular commodities
3. Enter custom commodity names
4. Optionally filter by state/district

## Error Handling

The system handles various error scenarios:
- Invalid commodity names
- Network connectivity issues
- API rate limits
- Geocoding failures
- No price data available

## Future Enhancements

1. **Historical Price Charts**: Add price trend visualization
2. **Price Alerts**: Notify farmers when prices reach target levels
3. **Market Distance**: Show distance to each mandi
4. **Seasonal Insights**: Compare current prices with historical seasonal data
5. **Crop Recommendations**: Suggest profitable crops based on current prices

## Configuration

### Environment Variables
```bash
# Required for geocoding (already configured)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# The mandi API uses a public key, no additional config needed
```

### API Limits
- Google Geocoding: Per your existing API quota
- Mandi API: 10 records per request with sample key (upgrade for production)

## Support

For issues or questions about the mandi price integration:
1. Check this documentation
2. Review API response logs
3. Test with different commodity names
4. Verify location coordinates are valid
