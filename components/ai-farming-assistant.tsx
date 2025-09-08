"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertTriangle, CheckCircle, Clock, Lightbulb, TrendingUp, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
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
  },
  {
    id: 'harvest',
    question: 'When is the best time to harvest my crop?',
    category: 'Harvest',
    icon: Clock
  }
]

interface AIFarmingAssistantProps {
  userId: string
  className?: string
}

export function AIFarmingAssistant({ userId, className }: AIFarmingAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataCompleteness, setDataCompleteness] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI farming assistant. I have access to your farming profile, current weather conditions, satellite data, and soil information to provide personalized recommendations. What would you like to know about your farm today?",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

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
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card className="h-[700px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                AI Farming Assistant
              </CardTitle>
              <CardDescription>
                Get personalized farming insights based on your data
              </CardDescription>
            </div>
            
            {dataCompleteness && (
              <div className="text-right">
                <div className="text-sm font-medium">Data Sources</div>
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

        <Separator />

        {/* Messages Area */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">{message.content}</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        {/* Insights Display */}
                        {message.insights && (
                          <div className="mt-3 space-y-3">
                            {/* Urgent Alerts */}
                            {message.insights.urgentAlerts && message.insights.urgentAlerts.length > 0 && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <div className="font-medium mb-1">Urgent Alerts:</div>
                                  {message.insights.urgentAlerts.map((alert, index) => (
                                    <div key={index} className="text-sm">{alert}</div>
                                  ))}
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {/* Recommendations */}
                            {message.insights.recommendations.length > 0 && (
                              <div className="space-y-2">
                                <div className="font-medium text-sm flex items-center gap-1">
                                  <Lightbulb className="w-4 h-4" />
                                  Recommendations:
                                </div>
                                {message.insights.recommendations.map((rec, index) => (
                                  <div key={index} className="text-sm bg-background rounded p-2 border-l-2 border-primary">
                                    {rec}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Sources */}
                            {message.insights.sources.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <span>Sources:</span>
                                  {message.insights.sources.map((source, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="text-xs text-muted-foreground/70 mt-2" suppressHydrationWarning>
                      {isClient ? message.timestamp.toLocaleTimeString() : '--:--:--'}
                    </div>
                  </div>
                  
                  {message.type === 'user' && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <Separator />

        {/* Preset Questions */}
        {messages.length <= 1 && (
          <div className="p-4 bg-muted/30">
            <div className="text-sm font-medium mb-2">Quick Questions:</div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_QUESTIONS.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto p-2"
                  onClick={() => handlePresetQuestion(preset.question)}
                  disabled={isLoading}
                >
                  <preset.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <div className="text-xs">{preset.question}</div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4">
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
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
          
          <div className="text-xs text-muted-foreground mt-2">
            💡 Ask about weather conditions, irrigation timing, crop health, harvest planning, or any farming question
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AIFarmingAssistant
