"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertTriangle, CheckCircle, Lightbulb, TrendingUp, Loader2, MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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
    id: 'weather',
    question: 'What should I do based on current weather conditions?',
    category: 'Weather',
    icon: TrendingUp
  },
  {
    id: 'irrigation',
    question: 'When should I irrigate my crop based on soil moisture?',
    category: 'Irrigation',
    icon: CheckCircle
  },
  {
    id: 'crop_health',
    question: 'How is my crop health based on satellite data?',
    category: 'Crop Health',
    icon: Lightbulb
  }
]

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

interface DashboardWithChatProps {
  userId: string
  userProfile: UserProfile | null
}

export function DashboardWithChat({ userId, userProfile }: DashboardWithChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataCompleteness, setDataCompleteness] = useState<any>(null)
  const [showChat, setShowChat] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return

    setError(null)
    setIsLoading(true)
    setShowChat(true)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    }

    // Add loading assistant message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Analyzing your farm data and generating insights...',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInputMessage('')

    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          question,
          includeHistoricalData: true 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get insights')
      }

      // Store data completeness info
      if (data.metadata?.dataCompleteness) {
        setDataCompleteness(data.metadata.dataCompleteness)
      }

      // Replace loading message with actual insights
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        insights: {
          answer: data.answer,
          recommendations: data.recommendations || [],
          urgentAlerts: data.urgentAlerts,
          confidence: data.confidence || 0,
          sources: data.sources || []
        }
      }

      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = assistantMessage
        return updated
      })

    } catch (error: any) {
      console.error('Error getting AI insights:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again or rephrase your question.`,
        timestamp: new Date()
      }

      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = errorMessage
        return updated
      })

      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const handlePresetQuestion = (question: string) => {
    sendMessage(question)
  }

  const formatConfidence = (confidence: number) => {
    if (confidence >= 80) return { text: 'High', color: 'bg-green-500' }
    if (confidence >= 60) return { text: 'Medium', color: 'bg-yellow-500' }
    return { text: 'Low', color: 'bg-red-500' }
  }

  return (
    <div className="space-y-6">
      {/* Farm Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Crop</CardDescription>
            <CardTitle className="text-2xl">{userProfile?.farmerProfile?.cropName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Soil: {userProfile?.farmerProfile?.soilType}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Farm Size</CardDescription>
            <CardTitle className="text-2xl">
              {userProfile?.farmerProfile?.farmSize || 'N/A'} 
              {userProfile?.farmerProfile?.farmSize && ' ha'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Irrigation: {userProfile?.farmerProfile?.irrigationMethod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Experience</CardDescription>
            <CardTitle className="text-2xl">
              {userProfile?.farmerProfile?.farmingExperience || 'N/A'}
              {userProfile?.farmerProfile?.farmingExperience && ' years'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Previous Yield: {userProfile?.farmerProfile?.previousYield || 'N/A'} t/ha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Storage</CardDescription>
            <CardTitle className="text-2xl">
              {userProfile?.farmerProfile?.hasStorageCapacity ? 'Yes' : 'No'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {userProfile?.farmerProfile?.storageCapacity 
                ? `${userProfile.farmerProfile.storageCapacity} tons`
                : 'No storage facility'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content with Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>AI-generated recommendations for your farm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Weather Optimal</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Current conditions are favorable for {userProfile?.farmerProfile?.cropName?.toLowerCase()} growth.
                </p>
              </div>
              
              {/* Quick Question Buttons */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Ask AI Assistant:</p>
                {PRESET_QUESTIONS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 text-xs"
                    onClick={() => handlePresetQuestion(preset.question)}
                    disabled={isLoading}
                  >
                    <preset.icon className="w-3 h-3 mr-2 flex-shrink-0" />
                    {preset.question}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat Assistant - Takes up 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  AI Farming Assistant
                  {!showChat && <Badge variant="secondary" className="ml-2">Ask a question below</Badge>}
                </CardTitle>
                <CardDescription>
                  Ask personalized questions about your farm
                </CardDescription>
              </div>
              
              {dataCompleteness && showChat && (
                <div className="text-right">
                  <div className="text-xs font-medium">Data Sources</div>
                  <div className="flex gap-1 mt-1">
                    {Object.entries(dataCompleteness).map(([source, available]) => (
                      <Badge
                        key={source}
                        variant={available ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Chat Messages */}
            {showChat && messages.length > 0 && (
              <div className="border rounded-lg">
                <ScrollArea className="h-64 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.type === 'assistant' && (
                          <Avatar className="w-6 h-6 mt-1">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              <Bot className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}
                        >
                          {message.isLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span className="text-xs">{message.content}</span>
                            </div>
                          ) : (
                            <>
                              <div className="text-xs leading-relaxed">
                                {message.content}
                              </div>
                              
                              {/* Insights Display */}
                              {message.insights && (
                                <div className="mt-2 space-y-2">
                                  {/* Urgent Alerts */}
                                  {message.insights.urgentAlerts && message.insights.urgentAlerts.length > 0 && (
                                    <Alert variant="destructive" className="p-2">
                                      <AlertTriangle className="h-3 w-3" />
                                      <AlertDescription className="text-xs">
                                        <div className="font-medium mb-1">Urgent:</div>
                                        {message.insights.urgentAlerts.map((alert, index) => (
                                          <div key={index} className="text-xs">{alert}</div>
                                        ))}
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                  
                                  {/* Recommendations */}
                                  {message.insights.recommendations.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="font-medium text-xs flex items-center gap-1">
                                        <Lightbulb className="w-3 h-3" />
                                        Recommendations:
                                      </div>
                                      {message.insights.recommendations.slice(0, 2).map((rec, index) => (
                                        <div key={index} className="text-xs bg-background rounded p-2 border-l-2 border-primary">
                                          {rec}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  

                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="text-xs text-muted-foreground/70 mt-1" suppressHydrationWarning>
                            {isClient ? message.timestamp.toLocaleTimeString() : '--:--:--'}
                          </div>
                        </div>
                        
                        {message.type === 'user' && (
                          <Avatar className="w-6 h-6 mt-1">
                            <AvatarFallback className="text-xs">
                              <User className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about your farm..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </form>
            
            <div className="text-xs text-muted-foreground">
              💡 Ask about weather, irrigation, crop health, harvest timing, or any farming question
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your farming profile overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Profile Setup</span>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Complete
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Sources</span>
              <Badge variant="secondary">4 Connected</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Updated</span>
              <span className="text-sm text-muted-foreground">Just now</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardWithChat
