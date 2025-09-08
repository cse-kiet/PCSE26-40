"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertTriangle, CheckCircle, Lightbulb, TrendingUp, Loader2, MessageSquare, MapPin, BarChart3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import GoogleMapsFieldCreator from "@/components/google-maps-field-creator"
import ComprehensiveDashboard from "@/components/comprehensive-dashboard"
import type { PolygonResponse } from "@/lib/agromonitoring-api"
import type { GeocodingResult } from "@/lib/geocoding-api"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  insights?: {
    answer: string
    recommendations: string[]
    urgentAlerts?: string[]
    confidence: number
    sources: string[]
    dataUsed?: {
      hasRealWeatherData: boolean
      hasNDVIData: boolean
      hasSoilData: boolean
      hasUVData: boolean
      dataCompleteness?: any
      debugInfo?: {
        hadUserId?: boolean
        hadFarmerData?: boolean
        actualWeatherData?: string
        actualNDVIData?: string
        actualSoilData?: string
        actualUVData?: string
        reason?: string
      }
    }
  }
  isLoading?: boolean
}

interface PresetQuestion {
  id: string
  question: string
  category: string
  icon: any
}

const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: 'current_conditions',
    question: 'What are my current weather and soil conditions?',
    category: 'Current Status',
    icon: TrendingUp
  },
  {
    id: 'irrigation_today',
    question: 'Should I irrigate today based on soil moisture and weather?',
    category: 'Irrigation',
    icon: CheckCircle
  },
  {
    id: 'crop_ndvi',
    question: 'What does my NDVI data say about crop health?',
    category: 'Crop Health',
    icon: Lightbulb
  },
  {
    id: 'uv_work_timing',
    question: 'What are the best work hours based on UV index?',
    category: 'Work Planning',
    icon: MapPin
  }
]

interface IntegratedDashboardProps {
  selectedPolygon: PolygonResponse | null
  onPolygonCreated: (polygon: PolygonResponse) => void
  onPolygonSelected: (polygon: PolygonResponse) => void
  existingPolygons: PolygonResponse[]
  userLocation: GeocodingResult | null
}

export function IntegratedDashboardWithChat({ 
  selectedPolygon, 
  onPolygonCreated, 
  onPolygonSelected, 
  existingPolygons, 
  userLocation 
}: IntegratedDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [activeTab, setActiveTab] = useState('fields')
  const [userData, setUserData] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Load user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData')
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }
  }, [])
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Welcome message when chat is first opened
  useEffect(() => {
    if (showChat && messages.length === 0) {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const hasUserId = !!userData.userId
      
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: `Welcome to your AI Farming Assistant powered by Gemini 2.0 Flash! 🌱 

I provide real-time insights using:
${hasUserId ? `✅ Your live weather data
✅ Real-time soil moisture & temperature  
✅ NDVI satellite crop health monitoring
✅ UV index for optimal work timing
✅ Your specific crop and soil information

🔍 Profile: ${userData.userId ? `Linked (${userData.userId.substring(0, 8)}...)` : 'Not Found'}` : `• Weather-based farming decisions
• Irrigation scheduling guidance
• Crop health analysis
• Field management optimization
• General farming recommendations`}

${selectedPolygon ? `📍 Active Field: "${selectedPolygon.name}" (${selectedPolygon.area} hectares)
` : ''}${hasUserId ? `💡 Ask me about your current conditions, soil moisture, crop health, or any farming question!` : `💡 Complete your profile for personalized insights based on real satellite and weather data!`}

What would you like to know about your farming operations?`,
        timestamp: new Date(),
        insights: hasUserId ? {
          answer: '',
          recommendations: [],
          urgentAlerts: [],
          confidence: 1.0,
          sources: ['Real-time Weather', 'Satellite Data', 'Soil Monitoring', 'AI Analysis']
        } : undefined
      }
      setMessages([welcomeMessage])
    }
  }, [showChat, selectedPolygon])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const farmFields = JSON.parse(localStorage.getItem('farmFields') || '[]')
      
      // Validate user data for debugging
      if (!userData.userId) {
        console.warn('[Chat] No userId found in localStorage. User may need to complete onboarding.')
      }

      // Prepare context for AI
      const context = {
        selectedField: selectedPolygon ? {
          id: selectedPolygon.id, // Add the polygon ID!
          name: selectedPolygon.name,
          area: selectedPolygon.area,
          center: selectedPolygon.center
        } : null,
        userLocation: userLocation,
        userData: {
          ...userData,
          cropName: userData.farmerProfile?.cropName,
          soilType: userData.farmerProfile?.soilType,
          irrigationMethod: userData.farmerProfile?.irrigationMethod,
          farmSize: farmFields.reduce((sum: number, field: any) => sum + (field.area || 0), 0)
        },
        farmFields,
        totalFields: existingPolygons.length
      }

      const requestBody = {
        message: content.trim(),
        userId: userData.userId || null, // Ensure we send null if no userId
        context
      }

      // Log request summary (not full body for security)
      console.log('[Chat] Sending AI request:', { hasUserId: !!requestBody.userId, messageLength: requestBody.message.length })

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: data.response || 'I apologize, but I was unable to process your request at this time.',
        timestamp: new Date(),
        insights: {
          answer: data.response,
          recommendations: data.recommendations || [],
          urgentAlerts: data.urgentAlerts || [],
          confidence: data.confidence || 0.8,
          sources: data.sources || ['AI Analysis'],
          dataUsed: data.dataUsed
        }
      }

      setMessages(prev => prev.slice(0, -1).concat([assistantMessage]))
    } catch (error: any) {
      console.error('Error sending message:', error)
      
      let errorContent = 'I apologize, but I encountered an error while processing your request. '
      
      if (error.message?.includes('400')) {
        errorContent += 'Please try rephrasing your question or ask about general farming topics.'
      } else if (error.message?.includes('500')) {
        errorContent += 'The AI service is temporarily unavailable. Please try again in a moment.'
      } else {
        errorContent += 'Please try again or ask a different question.'
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages(prev => prev.slice(0, -1).concat([errorMessage]))
      setError('Failed to get AI response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePresetQuestion = (question: string) => {
    handleSendMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputMessage)
    }
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Field Management
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Data Dashboard
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            AI Assistant
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {messages.filter(m => m.type === 'user').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Field Management Tab */}
        <TabsContent value="fields" className="flex-1 mt-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Field Management
              </CardTitle>
              <CardDescription>
                Create and manage your farm fields using satellite imagery
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <div className="h-96 w-full">
                <GoogleMapsFieldCreator
                  onPolygonCreated={onPolygonCreated}
                  onPolygonSelected={onPolygonSelected}
                  existingPolygons={existingPolygons}
                  selectedPolygon={selectedPolygon}
                  initialLocation={userLocation}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 mt-4">
          <ComprehensiveDashboard 
            selectedPolygon={selectedPolygon} 
            cropName={userData?.farmerProfile?.cropName || userData?.primaryCrop}
            userId={userData?.userId}
          />
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-none">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    AI Farming Assistant
                  </CardTitle>
                  <CardDescription>
                    Get personalized farming insights and recommendations
                    {selectedPolygon && (
                      <span className="block mt-1 text-primary font-medium">
                        Active Field: {selectedPolygon.name}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex items-start gap-3 ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.type === 'assistant' && (
                            <Avatar className="w-8 h-8 bg-primary">
                              <AvatarFallback>
                                <Bot className="w-4 h-4 text-primary-foreground" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.isLoading ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Analyzing your farming data...</span>
                              </div>
                            ) : (
                              <>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                
                                {message.insights && (
                                  <div className="mt-3 space-y-2">
                                    {message.insights.recommendations.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium mb-1">Recommendations:</p>
                                        <ul className="text-sm space-y-1">
                                          {message.insights.recommendations.map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-1">
                                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                              {rec}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    {message.insights.urgentAlerts && message.insights.urgentAlerts.length > 0 && (
                                      <Alert>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                          <ul className="space-y-1">
                                            {message.insights.urgentAlerts.map((alert, idx) => (
                                              <li key={idx}>{alert}</li>
                                            ))}
                                          </ul>
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                    
                                    <div className="space-y-1">
                                      {message.insights.sources.length > 0 && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span>Sources: {message.insights.sources.join(', ')}</span>
                                        </div>
                                      )}
                                      
                                      {message.insights.dataUsed && (
                                        <div className="flex flex-wrap gap-1 text-xs">
                                          <span className="text-muted-foreground">Real data used:</span>
                                          {message.insights.dataUsed.hasRealWeatherData && (
                                            <Badge variant="secondary" className="h-5 text-xs px-1">
                                              🌡️ Weather
                                            </Badge>
                                          )}
                                          {message.insights.dataUsed.hasSoilData && (
                                            <Badge variant="secondary" className="h-5 text-xs px-1">
                                              🌱 Soil
                                            </Badge>
                                          )}
                                          {message.insights.dataUsed.hasNDVIData && (
                                            <Badge variant="secondary" className="h-5 text-xs px-1">
                                              🛰️ NDVI
                                            </Badge>
                                          )}
                                          {message.insights.dataUsed.hasUVData && (
                                            <Badge variant="secondary" className="h-5 text-xs px-1">
                                              ☀️ UV
                                            </Badge>
                                          )}
                                          {/* Debug info for troubleshooting */}
                                          {message.insights.dataUsed.debugInfo && !message.insights.dataUsed.debugInfo.hadUserId && (
                                            <Badge variant="destructive" className="h-5 text-xs px-1">
                                              ⚠️ No User Profile
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            <div className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                              {isClient ? message.timestamp.toLocaleTimeString() : '--:--:--'}
                            </div>
                          </div>
                          
                          {message.type === 'user' && (
                            <Avatar className="w-8 h-8 bg-secondary">
                              <AvatarFallback>
                                <User className="w-4 h-4 text-secondary-foreground" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {/* Input */}
                  <div className="flex-none p-6 border-t">
                    {error && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        placeholder="Ask about your crops, weather, irrigation, or field management..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => handleSendMessage(inputMessage)}
                        disabled={isLoading || !inputMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>

                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Questions & Field Info */}
            <div className="space-y-6">
              {/* Field Info */}
              {selectedPolygon && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Field</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedPolygon.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Area:</span>
                        <span className="font-medium">{selectedPolygon.area} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-mono text-sm">{selectedPolygon.id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Quick Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Questions</CardTitle>
                  <CardDescription>
                    Click on a question to get instant insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {PRESET_QUESTIONS.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        className="w-full justify-start h-auto p-3 text-left"
                        onClick={() => handlePresetQuestion(preset.question)}
                        disabled={isLoading}
                      >
                        <div className="flex items-start gap-3">
                          <preset.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-sm">{preset.category}</div>
                            <div className="text-xs text-muted-foreground">{preset.question}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default IntegratedDashboardWithChat
