"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sprout } from "lucide-react"
import { ComprehensiveOnboarding } from "@/components/comprehensive-onboarding"

// 1. Translations Object for Multi-language support
const translations = {
  en: {
    title: "FarmSat",
    subtitle: "AI-powered farming assistant with satellite data",
    welcomeTitle: "Welcome to FarmSat",
    welcomeDescription: "Grow smarter with localized insights from weather, soil and satellites",
    setupButton: "🌱 Set Up My Farm Profile",
    setupIncludes: "Complete setup includes:",
    setupItems: [
      "Personal information & location",
      "Farm field mapping with GPS",
      "Crop and soil details",
      "Weather & satellite data integration",
      "AI-powered farming insights",
    ],
    featureCrop: "Crop Health",
    featureWeather: "Weather & UVI",
    featureSoil: "Soil & Irrigation",
    footer: "Powered by satellite technology for precision agriculture",
  },
  hi: {
    title: "फार्मसेट",
    subtitle: "सैटेलाइट डेटा के साथ एआई-संचालित खेती सहायक",
    welcomeTitle: "फार्मसेट में आपका स्वागत है",
    welcomeDescription: "मौसम, मिट्टी और सैटेलाइट से स्थानीय जानकारी के साथ बेहतर खेती करें",
    setupButton: "🌱 मेरा फार्म प्रोफाइल सेट करें",
    setupIncludes: "पूर्ण सेटअप में शामिल हैं:",
    setupItems: [
      "व्यक्तिगत जानकारी और स्थान",
      "जीपीएस के साथ खेत की मैपिंग",
      "फसल और मिट्टी का विवरण",
      "मौसम और सैटेलाइट डेटा एकीकरण",
      "एआई-संचालित खेती की जानकारी",
    ],
    featureCrop: "फसल स्वास्थ्य",
    featureWeather: "मौसम और यूवीआई",
    featureSoil: "मिट्टी और सिंचाई",
    footer: "सटीक खेती के लिए सैटेलाइट तकनीक द्वारा संचालित",
  },
  mr: {
    title: "फार्मसॅट",
    subtitle: "उपग्रह डेटासह AI-शक्तीवर चालणारा शेती सहाय्यक",
    welcomeTitle: "फार्मसॅटमध्ये स्वागत आहे",
    welcomeDescription: "हवामान, माती आणि उपग्रहाच्या स्थानिक माहितीसह हुशारीने वाढवा",
    setupButton: "🌱 माझे फार्म प्रोफाइल सेट करा",
    setupIncludes: "पूर्ण सेटअपमध्ये समाविष्ट आहे:",
    setupItems: [
      "वैयक्तिक माहिती आणि स्थान",
      "जीपीएसद्वारे शेताचे मॅपिंग",
      "पीक आणि मातीचा तपशील",
      "हवामान आणि उपग्रह डेटा एकत्रीकरण",
      "एआय-शक्तीवर चालणारी शेतीविषयक माहिती",
    ],
    featureCrop: "पीक आरोग्य",
    featureWeather: "हवामान आणि अतिनील निर्देशांक",
    featureSoil: "माती आणि सिंचन",
    footer: "अचूक शेतीसाठी उपग्रह तंत्रज्ञानाद्वारे समर्थित",
  },
  ta: {
    title: "பார்ம்சாட்",
    subtitle: "செயற்கைக்கோள் தரவுகளுடன் AI-இயங்கும் விவசாய உதவியாளர்",
    welcomeTitle: "பார்ம்சாட்டிற்கு வரவேற்கிறோம்",
    welcomeDescription: "வானிலை, மண் மற்றும் செயற்கைக்கோள்களின் உள்ளூர் நுண்ணறிவுகளுடன் புத்திசாலித்தனமாக வளருங்கள்",
    setupButton: "🌱 எனது பண்ணை சுயவிவரத்தை அமைக்கவும்",
    setupIncludes: "முழுமையான அமைப்பில் அடங்கும்:",
    setupItems: [
      "தனிப்பட்ட தகவல் & இருப்பிடம்",
      "ஜிபிஎஸ் உடன் பண்ணை புல வரைபடம்",
      "பயிர் மற்றும் மண் விவரங்கள்",
      "வானிலை மற்றும் செயற்கைக்கோள் தரவு ஒருங்கிணைப்பு",
      "AI-இயங்கும் விவசாய நுண்ணறிவு",
    ],
    featureCrop: "பயிர் ஆரோக்கியம்",
    featureWeather: "வானிலை & புற ஊதா குறியீடு",
    featureSoil: "மண் & நீர்ப்பாசனம்",
    footer: "துல்லியமான விவசாயத்திற்கான செயற்கைக்கோள் தொழில்நுட்பத்தால் இயக்கப்படுகிறது",
  },
};


type Language = 'en' | 'hi' | 'mr' | 'ta'

export default function LoginPage() {
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [language, setLanguage] = useState<Language>('en')

  const handleStartOnboarding = () => {
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = async (data: any) => {
    try {
      const response = await fetch('/api/comprehensive-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save profile')
      }

      const result = await response.json()
      
      const userData = {
        userId: data.userId,
        fullName: data.fullName,
        mobile: data.mobile,
        pincode: data.pincode,
        location: data.location,
        pincodeLocation: data.pincodeLocation,
        farmFields: data.farmFields,
        profileComplete: true,
        aiInsights: result.profile?.aiInsights,
        weatherData: result.profile?.weatherData
      }
      
      localStorage.setItem('userData', JSON.stringify(userData))
      localStorage.setItem('farmFields', JSON.stringify(data.farmFields))

      if (result.recommendations) {
        console.log('AI Recommendations:', result.recommendations)
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to save your profile. Please try again.')
    }
  }

  if (showOnboarding) {
    return (
      <ComprehensiveOnboarding
        onComplete={handleOnboardingComplete}
      />
    )
  }
  
  const t = translations[language];

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-emerald-50 via-lime-50 to-amber-50">
      {/* Decorative agrarian shapes */}
      <div className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_50%_at_50%_0%,#000_20%,transparent_70%)]">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200 blur-3xl" />
        <div className="absolute -top-10 right-0 h-64 w-64 rounded-full bg-lime-200 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-60 w-[36rem] -translate-x-1/2 bg-gradient-to-r from-amber-200/60 via-emerald-200/60 to-lime-200/60 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-lg shadow-primary/20">
            <Sprout className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Welcome Card */}
        <Card className="shadow-xl border border-emerald-100/70 bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 relative">
            {/* 3. Language Switcher Dropdown */}
            <div className="absolute top-4 right-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-xs rounded border bg-white/80 backdrop-blur-sm p-1 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
            <CardTitle className="text-xl font-semibold pt-4">{t.welcomeTitle}</CardTitle>
            <CardDescription>{t.welcomeDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={handleStartOnboarding}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              >
                {t.setupButton}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>{t.setupIncludes}</p>
              <ul className="text-xs mt-2 space-y-1">
                {t.setupItems.map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg border bg-white/70 backdrop-blur p-3 text-center">
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-emerald-800">🌿</div>
            <div className="text-xs font-medium">{t.featureCrop}</div>
          </div>
          <div className="rounded-lg border bg-white/70 backdrop-blur p-3 text-center">
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-800">☀️</div>
            <div className="text-xs font-medium">{t.featureWeather}</div>
          </div>
          <div className="rounded-lg border bg-white/70 backdrop-blur p-3 text-center">
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded bg-lime-100 text-lime-800">💧</div>
            <div className="text-xs font-medium">{t.featureSoil}</div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {t.footer}
        </p>
      </div>
    </div>
  )
}