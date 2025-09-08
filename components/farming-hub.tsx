"use client"

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, User, Bot, Settings, BarChart3 } from 'lucide-react'

import FarmerOnboardingForm from './farmer-onboarding-form'
import DashboardWithChat from './dashboard-with-chat'

interface FarmingHubProps {
  userId: string
  initialOnboardingStatus?: boolean
}

interface UserProfile {
  user: {
    id: string
    email: string
    name?: string
    phone?: string
    location?: string
  }
  farmerProfile?: {
    id: string
    cropName: string
    soilType: string
    sowingDate: string
    hasStorageCapacity: boolean
    storageCapacity?: number
    irrigationMethod: string
    farmingExperience?: number
    farmSize?: number
    previousYield?: number
    isOnboardingComplete: boolean
  }
}

export function FarmingHub({ userId, initialOnboardingStatus = false }: FarmingHubProps) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(initialOnboardingStatus)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/farmer-profile?userId=${userId}`)
      
      if (response.ok) {
        const profileData = await response.json()
        setUserProfile(profileData)
        setIsOnboardingComplete(profileData.farmerProfile?.isOnboardingComplete || false)
      } else if (response.status === 404) {
        // User exists but no farmer profile yet
        setIsOnboardingComplete(false)
      } else {
        throw new Error('Failed to load profile')
      }
    } catch (err: any) {
      console.error('Error loading user profile:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnboardingComplete = async (data: any) => {
    console.log('Onboarding completed:', data)
    setIsOnboardingComplete(true)
    await loadUserProfile() // Reload profile data
    setActiveTab('dashboard') // Switch to dashboard with AI chat
  }

  const handleRetakeOnboarding = () => {
    setIsOnboardingComplete(false)
    setActiveTab('onboarding')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your farming profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading profile: {error}
          <Button variant="outline" size="sm" onClick={loadUserProfile} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Show onboarding if not completed
  if (!isOnboardingComplete) {
    return (
      <div className="container mx-auto py-8">
        <FarmerOnboardingForm
          userId={userId}
          onComplete={handleOnboardingComplete}
          onSkip={() => setIsOnboardingComplete(true)}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-bold">Your Farming Hub</h1>
        <p className="text-muted-foreground">
          Welcome back{userProfile?.user.name ? `, ${userProfile.user.name}` : ''}! 
          Manage your farm with AI-powered insights.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard & AI Chat
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab with Integrated Chat */}
        <TabsContent value="dashboard">
          <DashboardWithChat userId={userId} userProfile={userProfile} />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Farmer Profile</CardTitle>
              <CardDescription>Your farming information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userProfile && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Personal Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span>{userProfile.user.name || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{userProfile.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{userProfile.user.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{userProfile.user.location || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Farming Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Crop:</span>
                          <span>{userProfile.farmerProfile?.cropName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Soil Type:</span>
                          <span>{userProfile.farmerProfile?.soilType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sowing Date:</span>
                          <span>
                            {userProfile.farmerProfile?.sowingDate 
                              ? new Date(userProfile.farmerProfile.sowingDate).toLocaleDateString()
                              : 'Not provided'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Irrigation:</span>
                          <span>{userProfile.farmerProfile?.irrigationMethod}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={handleRetakeOnboarding} variant="outline">
                      Update Profile Information
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure your farming assistant preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync weather and satellite data
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Insights</p>
                    <p className="text-sm text-muted-foreground">
                      Generate AI-powered farming recommendations
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for urgent farming conditions
                    </p>
                  </div>
                  <Badge variant="secondary">Configure</Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={handleRetakeOnboarding} variant="outline" className="mr-2">
                  Reset Profile
                </Button>
                <Button onClick={() => setActiveTab('dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FarmingHub
