"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, ChevronRight, ChevronLeft, Check, MapPin, Smartphone, User, Globe, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { geocodingService, type GeocodingResult } from '@/lib/geocoding-api'
import SimpleFieldCreator from './simple-field-creator'

// Enhanced form validation schema
const comprehensiveOnboardingSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Please enter a valid mobile number'),
  pincode: z.string().length(6, 'Please enter a valid 6-digit pincode'),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  
  // Farm Area Information
  farmFields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    coordinates: z.string(), // GeoJSON polygon
    area: z.number(),
    cropType: z.string().optional()
  })).min(1, 'Please draw at least one farm field'),
  
  // Farming Information
  primaryCrop: z.string().min(1, 'Please select your primary crop'),
  soilType: z.string().min(1, 'Please select your soil type'),
  sowingDate: z.date({ required_error: 'Please select the sowing date' }),
  
  // Farm Infrastructure
  hasStorageCapacity: z.boolean(),
  storageCapacity: z.string().optional(),
  irrigationMethod: z.string().min(1, 'Please select your irrigation method'),
  
  // Experience & Scale
  farmingExperience: z.string().optional(),
  totalFarmSize: z.string().optional(),
  previousYield: z.string().optional(),
  
  // Preferences
  preferredLanguage: z.string().default('en')
})

type ComprehensiveOnboardingData = z.infer<typeof comprehensiveOnboardingSchema>

interface ComprehensiveOnboardingProps {
  onComplete: (data: ComprehensiveOnboardingData & { userId: string }) => void
  onSkip?: () => void
}

const STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Your basic information and location' },
  { id: 'farm-mapping', title: 'Farm Mapping', description: 'Draw your farm fields on the map' },
  { id: 'farming', title: 'Crop Details', description: 'Your farming information' },
  { id: 'infrastructure', title: 'Farm Setup', description: 'Infrastructure and methods' },
  { id: 'experience', title: 'Experience', description: 'Your farming background' }
]

const CROP_OPTIONS = [
  'Rice', 'Wheat', 'Corn (Maize)', 'Soybeans', 'Cotton', 'Sugarcane',
  'Potatoes', 'Tomatoes', 'Onions', 'Carrots', 'Cabbage', 'Lettuce',
  'Apples', 'Oranges', 'Bananas', 'Grapes', 'Strawberries',
  'Coffee', 'Tea', 'Cocoa', 'Other'
]

const SOIL_TYPES = [
  'Clay', 'Sandy', 'Loamy', 'Silty', 'Peaty', 'Chalky', 'Mixed', 'Not Sure'
]

const IRRIGATION_METHODS = [
  { value: 'DRIP', label: 'Drip Irrigation', description: 'Water-efficient, targeted watering' },
  { value: 'SPRINKLER', label: 'Sprinkler System', description: 'Overhead water distribution' },
  { value: 'FLOOD', label: 'Flood Irrigation', description: 'Traditional field flooding' },
  { value: 'FURROW', label: 'Furrow Irrigation', description: 'Channel-based watering' },
  { value: 'MANUAL', label: 'Manual Watering', description: 'Hand watering with tools' },
  { value: 'RAINFED', label: 'Rain-fed', description: 'Depends on natural rainfall' }
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' }
]

export function ComprehensiveOnboarding({ onComplete, onSkip }: ComprehensiveOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [pincodeLocation, setPincodeLocation] = useState<GeocodingResult | null>(null)
  const [isGeocodingPincode, setIsGeocodingPincode] = useState(false)
  const [geocodingError, setGeocodingError] = useState<string | null>(null)

  const form = useForm<ComprehensiveOnboardingData>({
    resolver: zodResolver(comprehensiveOnboardingSchema),
    defaultValues: {
      fullName: '',
      mobile: '',
      pincode: '',
      farmFields: [],
      primaryCrop: '',
      soilType: '',
      hasStorageCapacity: false,
      storageCapacity: '',
      irrigationMethod: '',
      farmingExperience: '',
      totalFarmSize: '',
      previousYield: '',
      preferredLanguage: 'en'
    }
  })

  const { watch, trigger, setValue } = form
  const watchHasStorage = watch('hasStorageCapacity')
  const watchPincode = watch('pincode')
  const watchFarmFields = watch('farmFields')

  // Generate a unique user ID
  const [userId] = useState(() => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  const handleLocationAccess = () => {
    setIsLoadingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('location', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setIsLoadingLocation(false)
        },
        (error) => {
          console.error("Location access denied:", error)
          setIsLoadingLocation(false)
        }
      )
    }
  }

  const geocodePincode = async (pincode: string) => {
    if (!pincode || pincode.length !== 6) return
    
    setIsGeocodingPincode(true)
    setGeocodingError(null)
    
    try {
      const result = await geocodingService.geocodePincode(pincode)
      setPincodeLocation(result)
    } catch (error) {
      console.error('Geocoding error:', error)
      setGeocodingError(error instanceof Error ? error.message : 'Failed to geocode pincode')
    } finally {
      setIsGeocodingPincode(false)
    }
  }

  // Geocode pincode when it changes and is valid
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchPincode?.length === 6) {
        geocodePincode(watchPincode)
      } else {
        setPincodeLocation(null)
        setGeocodingError(null)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [watchPincode])

  const nextStep = async () => {
    const currentStepFields = getStepFields(currentStep)
    const isStepValid = await trigger(currentStepFields as any)
    
    if (isStepValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepFields = (step: number): (keyof ComprehensiveOnboardingData)[] => {
    switch (step) {
      case 0: return ['fullName', 'mobile', 'pincode']
      case 1: return ['farmFields']
      case 2: return ['primaryCrop', 'soilType', 'sowingDate']
      case 3: return ['irrigationMethod', 'hasStorageCapacity']
      case 4: return [] // Optional fields
      default: return []
    }
  }

  const onSubmit = async (data: ComprehensiveOnboardingData) => {
    setIsSubmitting(true)
    try {
      // Calculate total farm size from drawn fields
      const totalArea = data.farmFields.reduce((sum, field) => sum + field.area, 0)
      
      // Prepare data for submission
      const submissionData = {
        ...data,
        userId,
        totalFarmSize: totalArea.toString(),
        pincodeLocation
      }

      onComplete(submissionData)
    } catch (error) {
      console.error('Error saving comprehensive profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onFieldsCreated = useCallback((fields: any[]) => {
    setValue('farmFields', fields)
  }, [setValue])

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-amber-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Globe className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Welcome to FarmSat</h1>
          <p className="text-muted-foreground">
            AI-powered farming assistant with satellite data - Let's set up your complete profile
          </p>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center space-y-1 text-center",
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2",
                  index < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : index === currentStep
                    ? "border-primary text-primary"
                    : "border-muted-foreground"
                )}
              >
                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <div className="text-xs font-medium">{step.title}</div>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 0: Personal Information & Location */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Mobile Number *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your mobile number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Pincode *
                            {isGeocodingPincode && <span className="text-xs text-muted-foreground">(Looking up location...)</span>}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your area pincode" 
                              maxLength={6} 
                              {...field} 
                            />
                          </FormControl>
                          {pincodeLocation && (
                            <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md">
                              📍 Location found: {pincodeLocation.formatted_address}
                            </div>
                          )}
                          {geocodingError && (
                            <Alert className="text-xs">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{geocodingError}</AlertDescription>
                            </Alert>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location Access */}
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLocationAccess}
                        disabled={isLoadingLocation}
                        className="w-full h-12 text-base border-2 border-dashed border-primary/30 hover:border-primary/50 bg-transparent"
                      >
                        <MapPin className="w-5 h-5 mr-2" />
                        {isLoadingLocation
                          ? "Getting Location..."
                          : form.watch('location')
                            ? "Location Detected ✓"
                            : "Allow Location Access (Optional)"}
                      </Button>
                      {form.watch('location') && (
                        <p className="text-xs text-muted-foreground text-center">
                          Location: {form.watch('location')?.lat.toFixed(4)},{" "}
                          {form.watch('location')?.lng.toFixed(4)}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="preferredLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 1: Farm Mapping */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-2 mb-6">
                      <h3 className="text-lg font-semibold">Draw Your Farm Fields</h3>
                      <p className="text-muted-foreground">
                        Use the map below to draw the boundaries of your farm fields. This helps us provide accurate satellite data and AI insights.
                      </p>
                    </div>

                    <div className="h-96 w-full rounded-lg overflow-hidden border">
                      <SimpleFieldCreator
                        onFieldsCreated={onFieldsCreated}
                        initialCenter={
                          form.watch('location') || 
                          (pincodeLocation ? { lat: pincodeLocation.lat, lng: pincodeLocation.lng } : undefined)
                        }
                      />
                    </div>

                    {watchFarmFields.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Farm Fields Created:</h4>
                        <ul className="space-y-1">
                          {watchFarmFields.map((field, index) => (
                            <li key={field.id} className="text-sm text-green-700">
                              Field {index + 1}: {field.name} ({field.area.toFixed(2)} hectares)
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm text-green-600 mt-2">
                          Total Area: {watchFarmFields.reduce((sum, field) => sum + field.area, 0).toFixed(2)} hectares
                        </p>
                      </div>
                    )}

                    {watchFarmFields.length === 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please draw at least one farm field on the map to continue.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Step 2: Farming Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="primaryCrop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Crop *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your primary crop" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CROP_OPTIONS.map((crop) => (
                                <SelectItem key={crop} value={crop}>
                                  {crop}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="soilType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soil Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your soil type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SOIL_TYPES.map((soil) => (
                                <SelectItem key={soil} value={soil}>
                                  {soil}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            If you're not sure, select "Not Sure" and we'll help you identify it
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sowingDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Last Sowing Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When did you last sow/plant your crop?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Infrastructure */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="irrigationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Irrigation Method *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select irrigation method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {IRRIGATION_METHODS.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  <div>
                                    <div className="font-medium">{method.label}</div>
                                    <div className="text-sm text-muted-foreground">{method.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasStorageCapacity"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Storage Facility</FormLabel>
                            <FormDescription>
                              Do you have storage capacity for your harvest?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {watchHasStorage && (
                      <FormField
                        control={form.control}
                        name="storageCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Capacity (tons)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter storage capacity"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Approximate storage capacity in tons
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Step 4: Experience */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      The following information is optional but helps us provide better recommendations.
                    </div>

                    <FormField
                      control={form.control}
                      name="farmingExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farming Experience (years)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Years of farming experience"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="previousYield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Yield (tons/hectare)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Last harvest yield"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This helps us track your improvement over time
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Weather data will be mapped to your drawn farm areas</li>
                        <li>• Soil moisture and satellite data will be analyzed for your fields</li>
                        <li>• Gemini AI will provide personalized farming insights</li>
                        <li>• You'll get real-time recommendations based on your location and crops</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between pt-6">
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button type="button" variant="outline" onClick={prevStep}>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    {onSkip && currentStep === 0 && (
                      <Button type="button" variant="ghost" onClick={onSkip}>
                        Skip Setup
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {currentStep < STEPS.length - 1 ? (
                      <Button type="button" onClick={nextStep}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Setting up your profile...' : 'Complete Setup & Start Farming!'}
                        <Check className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ComprehensiveOnboarding
