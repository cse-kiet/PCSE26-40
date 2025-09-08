"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, MapPin, Search, RefreshCw, IndianRupee } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MandiPriceRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
  formattedMinPrice: string;
  formattedMaxPrice: string;
  formattedModalPrice: string;
  averagePrice: number;
  formattedAveragePrice: string;
}

interface MandiPricesResponse {
  success: boolean;
  data: MandiPriceRecord[];
  location: {
    state?: string;
    district?: string;
    coordinates?: { lat: number; lng: number };
  };
  commodity: string;
  count: number;
  error?: string;
}

interface MandiPricesProps {
  location?: { lat: number; lng: number };
  crop?: string;
  userId?: string; // Add userId prop to fetch user profile automatically
}

export default function MandiPrices({ location, crop, userId }: MandiPricesProps) {
  const [priceData, setPriceData] = useState<MandiPricesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCommodity, setSearchCommodity] = useState(crop || "");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  
  // User profile data
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [autoLocation, setAutoLocation] = useState<{ lat: number; lng: number } | null>(location || null);
  const [autoCrop, setAutoCrop] = useState<string>(crop || "");

  // Popular commodities for quick selection
  const popularCommodities = [
    "Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soyabean", 
    "Groundnut", "Onion", "Potato", "Tomato", "Chili Red", "Turmeric"
  ];

  // Fetch user profile data
  const fetchUserProfile = async (userIdToFetch: string) => {
    setLoadingProfile(true);
    try {
      const response = await fetch(`/api/user-profile?userId=${userIdToFetch}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        setUserProfile(data.user);
        
        // Auto-populate crop name from farmer profile
        if (data.user.farmerProfile?.cropName && !autoCrop) {
          setAutoCrop(data.user.farmerProfile.cropName);
          setSearchCommodity(data.user.farmerProfile.cropName);
        }
        
        // Auto-populate location coordinates
        if (data.user.coordinates && !autoLocation) {
          setAutoLocation(data.user.coordinates);
        }
        
        return data.user;
      } else {
        console.warn('Failed to fetch user profile:', data.error);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoadingProfile(false);
    }
    return null;
  };

  // Auto-fetch user profile and trigger price search
  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId).then((profile) => {
        if (profile && profile.farmerProfile?.cropName) {
          // Auto-trigger price search with user's crop and location
          setTimeout(() => {
            fetchMandiPrices(profile.farmerProfile.cropName);
          }, 500);
        }
      });
    }
  }, [userId]);

  // Update auto states when props change
  useEffect(() => {
    if (location && !autoLocation) {
      setAutoLocation(location);
    }
    if (crop && !autoCrop) {
      setAutoCrop(crop);
      setSearchCommodity(crop);
    }
  }, [location, crop]);

  const fetchMandiPrices = async (commodity: string) => {
    if (!commodity.trim()) {
      setError("Please enter a commodity name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        commodity: commodity.trim()
      });

      if (autoLocation) {
        params.append('lat', autoLocation.lat.toString());
        params.append('lng', autoLocation.lng.toString());
      }

      if (selectedState) {
        params.append('state', selectedState);
      }

      if (selectedDistrict) {
        params.append('district', selectedDistrict);
      }

      const response = await fetch(`/api/mandi-prices?${params.toString()}`);
      const data: MandiPricesResponse = await response.json();

      if (data.success) {
        setPriceData(data);
      } else {
        setError(data.error || 'Failed to fetch mandi prices');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchMandiPrices(searchCommodity);
  };

  const handleQuickSelect = (commodity: string) => {
    setSearchCommodity(commodity);
    fetchMandiPrices(commodity);
  };

  // Auto-fetch if crop is provided (for backward compatibility when used without userId)
  useEffect(() => {
    if (crop && !userId) {
      fetchMandiPrices(crop);
    }
  }, [crop, location]);

  const getLocationDisplay = () => {
    if (priceData?.location.state || priceData?.location.district) {
      return `${priceData.location.district || ''} ${priceData.location.district && priceData.location.state ? ', ' : ''}${priceData.location.state || ''}`;
    }
    if (autoLocation) {
      if (userProfile?.pincode) {
        return `${userProfile.pincode} (Lat: ${autoLocation.lat.toFixed(4)}, Lng: ${autoLocation.lng.toFixed(4)})`;
      }
      return `Lat: ${autoLocation.lat.toFixed(4)}, Lng: ${autoLocation.lng.toFixed(4)}`;
    }
    return 'All Markets';
  };





  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Mandi Prices
          </CardTitle>
          <CardDescription>
            Get current market prices for agricultural commodities from mandis across India. 
            {userId ? "Your crop is auto-filled, but you can search for any other crop too!" : "Search for any Indian crop or commodity."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Select Commodities */}
          <div>
            <Label className="text-sm font-medium">Popular Commodities</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {popularCommodities.map((commodity) => (
                <Button
                  key={commodity}
                  variant={searchCommodity === commodity ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickSelect(commodity)}
                  className="text-xs"
                >
                  {commodity}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Form */}
          <div className={`grid grid-cols-1 ${userId ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-4 items-end`}>
            <div>
              <Label htmlFor="commodity">Commodity</Label>
              <Input
                id="commodity"
                value={searchCommodity}
                onChange={(e) => setSearchCommodity(e.target.value)}
                placeholder={userId ? "Auto-filled from your profile - edit to search other crops" : "Enter commodity name..."}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={loadingProfile}
              />
              {userId && userProfile?.farmerProfile?.cropName && (
                <p className="text-xs text-muted-foreground mt-1">
                  From your profile: {userProfile.farmerProfile.cropName} 
                  <span className="text-blue-600">• You can edit this to search any other crop</span>
                </p>
              )}
            </div>
            
            {/* Only show manual location inputs if no userId provided */}
            {!userId && (
              <>
                <div>
                  <Label htmlFor="state">State (Optional)</Label>
                  <Input
                    id="state"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    placeholder="e.g., Maharashtra"
                  />
                </div>
                <div>
                  <Label htmlFor="district">District (Optional)</Label>
                  <Input
                    id="district"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    placeholder="e.g., Pune"
                  />
                </div>
              </>
            )}
            
            <Button onClick={handleSearch} disabled={loading || loadingProfile || !searchCommodity.trim()}>
              {(loading || loadingProfile) ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {loadingProfile ? 'Loading Profile...' : 'Search Prices'}
            </Button>
          </div>

          {/* Location Info */}
          {(autoLocation || priceData?.location) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Showing prices for: {getLocationDisplay()}</span>
              {userId && userProfile?.name && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Auto-detected from your profile
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {priceData && !error && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Commodity</p>
                  <p className="text-lg font-semibold">{priceData.commodity}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Markets Found</p>
                  <p className="text-lg font-semibold">{priceData.count}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Average Price Range</p>
                  {priceData.data.length > 0 && (
                    <p className="text-lg font-semibold">
                      ₹{Math.min(...priceData.data.map(r => r.averagePrice)).toFixed(2)} - 
                      ₹{Math.max(...priceData.data.map(r => r.averagePrice)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Table */}
          {priceData.data.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Market Prices</CardTitle>
                <CardDescription>
                  Current prices from different mandis sorted by latest arrival date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Market</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Variety</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Arrival Date</TableHead>
                        <TableHead>Min Price</TableHead>
                        <TableHead>Max Price</TableHead>
                        <TableHead>Modal Price</TableHead>
                        <TableHead>Avg Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceData.data
                        .sort((a, b) => new Date(b.arrival_date).getTime() - new Date(a.arrival_date).getTime())
                        .map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{record.market}</TableCell>
                          <TableCell>{record.district}</TableCell>
                          <TableCell>{record.state}</TableCell>
                          <TableCell>{record.variety}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.grade}</Badge>
                          </TableCell>
                          <TableCell>{new Date(record.arrival_date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.formattedMinPrice}</TableCell>
                          <TableCell>{record.formattedMaxPrice}</TableCell>
                          <TableCell className="font-semibold">{record.formattedModalPrice}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {record.formattedAveragePrice}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-lg font-medium">No Price Data Found</p>
                  <p className="text-sm text-muted-foreground">
                    Try searching with a different commodity name or broader location filters.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
