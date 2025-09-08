"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, User, Menu, Calendar, Activity, Languages } from "lucide-react"
import { useRouter } from "next/navigation"

import IntegratedDashboardWithChat from "@/components/integrated-dashboard-with-chat"
import { getAgromonitoringAPI, type PolygonResponse } from "@/lib/agromonitoring-api"
import { useUserPolygons } from "@/hooks/use-agromonitoring-comprehensive"
import type { GeocodingResult } from "@/lib/geocoding-api"
import { LanguageProvider, useLanguage, type Language } from "@/lib/profile-translations"

// Language selector component
function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()
  
  return (
    <div className="flex items-center gap-2 mb-4">
      <Languages className="w-4 h-4 text-muted-foreground" />
      <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder={t.languageSelector.label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t.languageSelector.languages.en}</SelectItem>
          <SelectItem value="hi">{t.languageSelector.languages.hi}</SelectItem>
          <SelectItem value="mr">{t.languageSelector.languages.mr}</SelectItem>
          <SelectItem value="ta">{t.languageSelector.languages.ta}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// Main dashboard content component (with language context)
function DashboardContent() {
  const router = useRouter()
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonResponse | null>(null)
  const [isAPIConfigured, setIsAPIConfigured] = useState(false)
  const [userLocation, setUserLocation] = useState<GeocodingResult | null>(null)
  const [activeSection, setActiveSection] = useState<'home' | 'profile'>('home')
  const [userData, setUserData] = useState<{
    fullName: string
    mobile: string
    pincode: string
    browserLocation?: { lat: number; lng: number } | null
    pincodeLocation?: GeocodingResult | null
    farmerProfile?: {
      cropName?: string
      soilType?: string
      irrigationMethod?: string
      farmingExperience?: number
      farmSize?: number
      previousYield?: number
      hasStorageCapacity?: boolean
      storageCapacity?: number
    }
  } | null>(null)

  // Use the comprehensive polygon management hook - only after API is configured
  const { polygons, loading: polygonsLoading, refetch: refetchPolygons } = useUserPolygons(isAPIConfigured)

  const sidebarItems = [
    { icon: Home, label: "Home", id: "home", active: activeSection === 'home' },
    { icon: User, label: t.sidebarProfile.label, id: "profile", active: activeSection === 'profile' },
  ] as const

  // Load user data from localStorage and initialize API
  useEffect(() => {
    try {
      // Load user data from localStorage
      const storedUserData = localStorage.getItem('userData')
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData)
        setUserData(parsedUserData)
        
        // Use pincode location first, then browser location as fallback
        if (parsedUserData.pincodeLocation) {
          setUserLocation(parsedUserData.pincodeLocation)
          console.log("[Dashboard] Using pincode location:", parsedUserData.pincodeLocation)
        } else if (parsedUserData.browserLocation) {
          setUserLocation({
            lat: parsedUserData.browserLocation.lat,
            lng: parsedUserData.browserLocation.lng,
            formatted_address: `${parsedUserData.browserLocation.lat}, ${parsedUserData.browserLocation.lng}`
          })
          console.log("[Dashboard] Using browser location:", parsedUserData.browserLocation)
        }
      }

      // This will automatically initialize from environment variables if not already done
      getAgromonitoringAPI()
      setIsAPIConfigured(true)
      console.log("[Dashboard] Agromonitoring API initialized successfully from environment variables")
    } catch (error) {
      console.error("[Dashboard] Failed to initialize:", error)
      setIsAPIConfigured(false)
    }
  }, [])

  // Auto-select first polygon if none selected
  useEffect(() => {
    if (polygons.length > 0 && !selectedPolygon) {
      setSelectedPolygon(polygons[0])
    }
  }, [polygons, selectedPolygon])

  const handlePolygonCreated = (newPolygon: PolygonResponse) => {
    console.log("[Dashboard] New polygon created:", newPolygon)
    refetchPolygons() // Refresh the polygons list
    setSelectedPolygon(newPolygon) // Auto-select the new polygon
  }

  const handlePolygonSelected = (polygon: PolygonResponse) => {
    console.log("[Dashboard] Polygon selected:", polygon)
    setSelectedPolygon(polygon)
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('userData')
      localStorage.removeItem('farmFields')
    } catch {}
    setUserData(null)
    setSelectedPolygon(null)
    router.replace('/')
  }

  // Show error message if API key is not configured in environment variables
  if (!isAPIConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">⚠️ API Configuration Required</CardTitle>
            <CardDescription>
              Agromonitoring API key not found in environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">To fix this issue:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file in your project root</li>
                <li>Add the following line to the file:</li>
                <div className="bg-gray-800 text-green-400 p-2 rounded mt-2 font-mono text-xs">
                  NEXT_PUBLIC_AGROMONITORING_API_KEY=your_api_key_here
                </div>
                <li>Replace <code className="bg-gray-200 px-1 rounded">your_api_key_here</code> with your actual API key</li>
                <li>Restart your development server</li>
              </ol>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                Get your API key from{" "}
                <a 
                  href="https://agromonitoring.com/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  agromonitoring.com/api
                </a>
              </p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">FarmSat</h1>
                <p className="text-xs text-muted-foreground">Satellite Data</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 h-12 text-base ${
                      item.active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                    }`}
                    onClick={() => setActiveSection(item.id as 'home' | 'profile')}
                  >
                    {item.icon && <item.icon className="w-5 h-5" />}
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sidebar-foreground truncate">
                  {userData?.fullName || 'Farmer Name'}
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {userData?.mobile && (
                    <p className="truncate">📞 {userData.mobile}</p>
                  )}
                  {userData?.pincode && (
                    <p className="truncate">📍 {userData.pincode}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Farmer details */}
            {userData?.farmerProfile && (
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                {userData.farmerProfile.cropName && (
                  <div className="flex justify-between">
                    <span>Crop</span>
                    <span className="font-medium text-foreground">{userData.farmerProfile.cropName}</span>
                  </div>
                )}
                {userData.farmerProfile.soilType && (
                  <div className="flex justify-between">
                    <span>Soil</span>
                    <span className="font-medium text-foreground">{userData.farmerProfile.soilType}</span>
                  </div>
                )}
                {userData.farmerProfile.irrigationMethod && (
                  <div className="flex justify-between">
                    <span>Irrigation</span>
                    <span className="font-medium text-foreground">{userData.farmerProfile.irrigationMethod}</span>
                  </div>
                )}
                {(userData.farmerProfile.farmSize || userData.farmerProfile.farmSize === 0) && (
                  <div className="flex justify-between">
                    <span>Farm Size</span>
                    <span className="font-medium text-foreground">{userData.farmerProfile.farmSize} ha</span>
                  </div>
                )}
                {(userData.farmerProfile.hasStorageCapacity !== undefined) && (
                  <div className="flex justify-between">
                    <span>Storage</span>
                    <span className="font-medium text-foreground">
                      {userData.farmerProfile.hasStorageCapacity ? `${userData.farmerProfile.storageCapacity || 0} tons` : 'No'}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Button className="mt-3 w-full" variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Farm Dashboard</h1>
                <p className="text-muted-foreground">Monitor your fields with real-time satellite data</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                <Calendar className="w-3 h-3 mr-1" />
                Aug 21, 2025
              </Badge>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-6">
          {activeSection === 'home' && (
            <IntegratedDashboardWithChat 
              selectedPolygon={selectedPolygon}
              onPolygonCreated={handlePolygonCreated}
              onPolygonSelected={handlePolygonSelected}
              existingPolygons={polygons}
              userLocation={userLocation}
            />
          )}

          {activeSection === 'profile' && (
            <div className="space-y-6">
              {/* Language Selector */}
              <LanguageSelector />
              
              {/* Personal Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.profile.title}</CardTitle>
                  <CardDescription>{t.profile.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.personalInfo.fullName}</div>
                      <div className="font-medium">{userData?.fullName || t.profile.personalInfo.locationValues.na}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.personalInfo.mobile}</div>
                      <div className="font-medium">{userData?.mobile || t.profile.personalInfo.locationValues.na}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.personalInfo.pincode}</div>
                      <div className="font-medium">{userData?.pincode || t.profile.personalInfo.locationValues.na}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.personalInfo.locationSource}</div>
                      <div className="font-medium">
                        {userData?.pincodeLocation ? t.profile.personalInfo.locationValues.pincode : userData?.browserLocation ? t.profile.personalInfo.locationValues.browser : t.profile.personalInfo.locationValues.na}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Farming Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.profile.farmingDetails.title}</CardTitle>
                  <CardDescription>{t.profile.farmingDetails.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.farmingDetails.crop}</div>
                      <div className="font-medium">{userData?.farmerProfile?.cropName || t.profile.farmingDetails.storageValues.na}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.farmingDetails.soilType}</div>
                      <div className="font-medium">{userData?.farmerProfile?.soilType || t.profile.farmingDetails.storageValues.na}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.farmingDetails.irrigation}</div>
                      <div className="font-medium">{userData?.farmerProfile?.irrigationMethod || t.profile.farmingDetails.storageValues.na}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.farmingDetails.experience}</div>
                      <div className="font-medium">
                        {userData?.farmerProfile?.farmingExperience ?? t.profile.farmingDetails.storageValues.na}
                        {userData?.farmerProfile?.farmingExperience !== undefined ? ` ${t.profile.farmingDetails.experienceUnit}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.farmingDetails.farmSize}</div>
                      <div className="font-medium">
                        {userData?.farmerProfile?.farmSize ?? t.profile.farmingDetails.storageValues.na}
                        {userData?.farmerProfile?.farmSize !== undefined ? ` ${t.profile.farmingDetails.farmSizeUnit}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.farmingDetails.previousYield}</div>
                      <div className="font-medium">
                        {userData?.farmerProfile?.previousYield ?? t.profile.farmingDetails.storageValues.na}
                        {userData?.farmerProfile?.previousYield !== undefined ? ` ${t.profile.farmingDetails.yieldUnit}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t.profile.farmingDetails.storage}</div>
                      <div className="font-medium">
                        {userData?.farmerProfile?.hasStorageCapacity ? 
                          `${userData.farmerProfile.storageCapacity || 0} ${t.profile.farmingDetails.storageUnit}` : 
                          (userData?.farmerProfile ? t.profile.farmingDetails.storageValues.no : t.profile.farmingDetails.storageValues.na)
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}

// Main export with Language Provider wrapper
export default function Dashboard() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  )
}
