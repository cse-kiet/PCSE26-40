"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, ChevronRight, ChevronLeft, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Form validation schema
const farmerOnboardingSchema = z.object({
  // Personal Information
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  location: z.string().min(5, 'Please enter your location or coordinates'),
  
  // Farming Information
  cropName: z.string().min(1, 'Please select or enter your main crop'),
  soilType: z.string().min(1, 'Please select your soil type'),
  sowingDate: z.date({ required_error: 'Please select the sowing date' }),
  
  // Farm Infrastructure
  hasStorageCapacity: z.boolean(),
  storageCapacity: z.string().optional(),
  irrigationMethod: z.string().min(1, 'Please select your irrigation method'),
  
  // Experience & Scale
  farmingExperience: z.string().optional(),
  farmSize: z.string().optional(),
  previousYield: z.string().optional(),
  
  // Preferences
  preferredLanguage: z.string().default('en')
})

type FarmerOnboardingData = z.infer<typeof farmerOnboardingSchema>

interface FarmerOnboardingFormProps {
  userId: string
  onComplete: (data: FarmerOnboardingData) => void
  onSkip?: () => void
}

const STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Your basic information' },
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

export function FarmerOnboardingForm({ userId, onComplete, onSkip }: FarmerOnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FarmerOnboardingData>({
    resolver: zodResolver(farmerOnboardingSchema),
    defaultValues: {
      name: '',
      phone: '',
      location: '',
      cropName: '',
      soilType: '',
      hasStorageCapacity: false,
      storageCapacity: '',
      irrigationMethod: '',
      farmingExperience: '',
      farmSize: '',
      previousYield: '',
      preferredLanguage: 'en'
    }
  })

  const { watch, trigger } = form
  const watchHasStorage = watch('hasStorageCapacity')

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

  const getStepFields = (step: number): (keyof FarmerOnboardingData)[] => {
    switch (step) {
      case 0: return ['name', 'phone', 'location']
      case 1: return ['cropName', 'soilType', 'sowingDate']
      case 2: return ['irrigationMethod', 'hasStorageCapacity']
      case 3: return [] // Optional fields
      default: return []
    }
  }

  const onSubmit = async (data: FarmerOnboardingData) => {
    setIsSubmitting(true)
    try {
      const formattedData = {
        ...data,
        sowingDate: data.sowingDate.toISOString(),
        storageCapacity: data.hasStorageCapacity && data.storageCapacity ? parseFloat(data.storageCapacity) : undefined,
        farmingExperience: data.farmingExperience ? parseInt(data.farmingExperience) : undefined,
        farmSize: data.farmSize ? parseFloat(data.farmSize) : undefined,
        previousYield: data.previousYield ? parseFloat(data.previousYield) : undefined
      }

      const response = await fetch('/api/farmer-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formattedData })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save profile')
      }

      onComplete(data)
    } catch (error) {
      console.error('Error saving farmer profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to Your Farming Assistant</h1>
        <p className="text-muted-foreground">
          Let's set up your profile to provide personalized farming insights
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
              {/* Step 0: Personal Information */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="City, State or GPS coordinates (lat,lon)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your city and state, or GPS coordinates for better weather data
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

              {/* Step 1: Farming Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cropName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Crop *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your main crop" />
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

              {/* Step 2: Infrastructure */}
              {currentStep === 2 && (
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

              {/* Step 3: Experience */}
              {currentStep === 3 && (
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
                    name="farmSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Size (hectares)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Total farm area"
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
                      {isSubmitting ? 'Saving...' : 'Complete Setup'}
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
  )
}

export default FarmerOnboardingForm
