"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { initializeAgromonitoringAPI } from "@/lib/agromonitoring-api"

interface APIConfigurationProps {
  onConfigured: () => void
}

export function APIConfiguration({ onConfigured }: APIConfigurationProps) {
  const [apiKey, setApiKey] = useState("")
  const [isConfiguring, setIsConfiguring] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConfiguring(true)

    try {
      if (!apiKey.trim()) {
        throw new Error("API key is required")
      }

      // Initialize the Agromonitoring API with provided key
      initializeAgromonitoringAPI(apiKey.trim())

      // Test the connection with a sample request
      const testAPI = initializeAgromonitoringAPI(apiKey.trim())
      await testAPI.getCurrentWeather(40.7128, -74.006) // Test with NYC coordinates

      console.log("[Agromonitoring] API configured and tested successfully")
      onConfigured()
    } catch (error) {
      console.error("[Agromonitoring] API configuration failed:", error)
      let errorMessage = "Unknown error"
      
      if (error instanceof Error) {
        errorMessage = error.message
        // Provide more context for common errors
        if (error.message.includes('forbidden') || error.message.includes('subscription')) {
          errorMessage += "\n\nNote: Some endpoints may require a paid subscription plan."
        }
      }
      
      alert(`Failed to configure Agromonitoring API: ${errorMessage}`)
    } finally {
      setIsConfiguring(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Configure Agromonitoring API</CardTitle>
        <CardDescription>
          Enter your Agromonitoring API key to enable real-time weather data. 
          Get your API key from{" "}
          <a 
            href="https://agromonitoring.com/api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            agromonitoring.com
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Agromonitoring API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <p className="text-sm text-gray-600">
              API endpoint: https://api.agromonitoring.com/agro/1.0/weather
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isConfiguring || !apiKey.trim()}>
            {isConfiguring ? "Testing API..." : "Configure & Test API"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
