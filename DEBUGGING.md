# 🔧 Debugging Guide - Agromonitoring Integration

## 🚨 Common Errors & Solutions

### 1. **"Agromonitoring API not initialized"**
**Cause:** API functions called before configuration
**Solution:** 
- Configure your API key first in the dashboard
- Make sure the API configuration step completes successfully

### 2. **"401 Unauthorized - Invalid API key"**
**Cause:** Invalid or missing Agromonitoring API key
**Solution:**
- Get a valid API key from [agromonitoring.com/api](https://agromonitoring.com/api)
- Check if your API key is correct (no extra spaces)
- Verify your account is active

### 3. **"Soil history only showing current data"**
**Possible causes:**
- API endpoint returns limited historical data
- Date range is too narrow
- Polygon doesn't have historical data yet

### 4. **"UV forecast not loading"**
**Possible causes:**
- Polygon ID might be invalid
- API might not have forecast data for your location
- Network connection issues

## 🔍 How to Debug

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for messages starting with `[Agromonitoring]` or `[PolygonData]`

### Key Debug Messages
```
[Agromonitoring] Making request to: [URL]
[PolygonData] Fetching soil history from [start] to [end]
[PolygonData] UVI forecast data: [data]
[PolygonData] Soil history data: [data]
```

### Network Tab Debugging
1. Open Network tab in DevTools
2. Filter by "agromonitoring.com"
3. Check if requests are returning 200 OK or error codes

## 📋 Checklist

- [ ] Valid Agromonitoring API key configured
- [ ] Google Maps API key in .env.local
- [ ] Polygon successfully created on map
- [ ] API requests returning 200 OK in Network tab
- [ ] Console shows successful data fetching logs

## 🔗 Useful Links

- [Agromonitoring API Documentation](https://agromonitoring.com/api)
- [Get Agromonitoring API Key](https://agromonitoring.com/api)
- [Google Maps API Console](https://console.cloud.google.com/)
