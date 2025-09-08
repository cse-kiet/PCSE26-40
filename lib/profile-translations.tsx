// Translation system for profile page
export type Language = 'en' | 'hi' | 'mr' | 'ta'

export interface ProfileTranslations {
  languageSelector: {
    label: string
    languages: {
      en: string
      hi: string
      mr: string
      ta: string
    }
  }
  sidebarProfile: {
    label: string
  }
  profile: {
    title: string
    description: string
    personalInfo: {
      title: string
      fullName: string
      mobile: string
      pincode: string
      locationSource: string
      locationValues: {
        pincode: string
        browser: string
        na: string
      }
    }
    farmingDetails: {
      title: string
      description: string
      crop: string
      soilType: string
      irrigation: string
      experience: string
      farmSize: string
      previousYield: string
      storage: string
      experienceUnit: string
      farmSizeUnit: string
      yieldUnit: string
      storageUnit: string
      storageValues: {
        no: string
        na: string
      }
    }
  }
}

export const profileTranslations: Record<Language, ProfileTranslations> = {
  en: {
    languageSelector: {
      label: "Language",
      languages: {
        en: "English",
        hi: "हिंदी",
        mr: "मराठी",
        ta: "தமிழ்"
      }
    },
    sidebarProfile: {
      label: "My Profile"
    },
    profile: {
      title: "My Profile",
      description: "Farmer personal information",
      personalInfo: {
        title: "Personal Information",
        fullName: "Full Name",
        mobile: "Mobile",
        pincode: "Pincode",
        locationSource: "Location Source",
        locationValues: {
          pincode: "Pincode",
          browser: "Browser",
          na: "N/A"
        }
      },
      farmingDetails: {
        title: "Farming Details",
        description: "Profile used for recommendations",
        crop: "Crop",
        soilType: "Soil Type",
        irrigation: "Irrigation",
        experience: "Experience",
        farmSize: "Farm Size",
        previousYield: "Previous Yield",
        storage: "Storage",
        experienceUnit: "years",
        farmSizeUnit: "ha",
        yieldUnit: "t/ha",
        storageUnit: "tons",
        storageValues: {
          no: "No",
          na: "N/A"
        }
      }
    }
  },
  hi: {
    languageSelector: {
      label: "भाषा",
      languages: {
        en: "English",
        hi: "हिंदी",
        mr: "मराठी",
        ta: "தமிழ்"
      }
    },
    sidebarProfile: {
      label: "मेरी प्रोफ़ाइल"
    },
    profile: {
      title: "मेरी प्रोफ़ाइल",
      description: "किसान व्यक्तिगत जानकारी",
      personalInfo: {
        title: "व्यक्तिगत जानकारी",
        fullName: "पूरा नाम",
        mobile: "मोबाइल",
        pincode: "पिनकोड",
        locationSource: "स्थान स्रोत",
        locationValues: {
          pincode: "पिनकोड",
          browser: "ब्राउज़र",
          na: "उपलब्ध नहीं"
        }
      },
      farmingDetails: {
        title: "खेती विवरण",
        description: "सिफारिशों के लिए उपयोग की गई प्रोफ़ाइल",
        crop: "फसल",
        soilType: "मिट्टी का प्रकार",
        irrigation: "सिंचाई",
        experience: "अनुभव",
        farmSize: "खेत का आकार",
        previousYield: "पिछली उपज",
        storage: "भंडारण",
        experienceUnit: "वर्ष",
        farmSizeUnit: "हेक्टेयर",
        yieldUnit: "टन/हेक्टेयर",
        storageUnit: "टन",
        storageValues: {
          no: "नहीं",
          na: "उपलब्ध नहीं"
        }
      }
    }
  },
  mr: {
    languageSelector: {
      label: "भाषा",
      languages: {
        en: "English",
        hi: "हिंदी",
        mr: "मराठी",
        ta: "தமிழ்"
      }
    },
    sidebarProfile: {
      label: "माझे प्रोफाइल"
    },
    profile: {
      title: "माझे प्रोफाइल",
      description: "शेतकरी वैयक्तिक माहिती",
      personalInfo: {
        title: "वैयक्तिक माहिती",
        fullName: "पूर्ण नाव",
        mobile: "मोबाइल",
        pincode: "पिनकोड",
        locationSource: "स्थान स्रोत",
        locationValues: {
          pincode: "पिनकोड",
          browser: "ब्राउझर",
          na: "उपलब्ध नाही"
        }
      },
      farmingDetails: {
        title: "शेती तपशील",
        description: "शिफारशींसाठी वापरलेले प्रोफाइल",
        crop: "पीक",
        soilType: "मातीचा प्रकार",
        irrigation: "सिंचन",
        experience: "अनुभव",
        farmSize: "शेताचा आकार",
        previousYield: "मागील उत्पादन",
        storage: "साठवण",
        experienceUnit: "वर्षे",
        farmSizeUnit: "हेक्टर",
        yieldUnit: "टन/हेक्टर",
        storageUnit: "टन",
        storageValues: {
          no: "नाही",
          na: "उपलब्ध नाही"
        }
      }
    }
  },
  ta: {
    languageSelector: {
      label: "மொழி",
      languages: {
        en: "English",
        hi: "हिंदी",
        mr: "मराठी",
        ta: "தமிழ்"
      }
    },
    sidebarProfile: {
      label: "என் சுயவிவரம்"
    },
    profile: {
      title: "என் சுயவிவரம்",
      description: "விவசாயி தனிப்பட்ட தகவல்",
      personalInfo: {
        title: "தனிப்பட்ட தகவல்",
        fullName: "முழு பெயர்",
        mobile: "மொபைல்",
        pincode: "பின்கோட்",
        locationSource: "இடம் மூலம்",
        locationValues: {
          pincode: "பின்கோட்",
          browser: "உலாவி",
          na: "கிடைக்கவில்லை"
        }
      },
      farmingDetails: {
        title: "விவசாய விவரங்கள்",
        description: "பரிந்துரைகளுக்கு பயன்படுத்தப்பட்ட சுயவிவரம்",
        crop: "பயிர்",
        soilType: "மண் வகை",
        irrigation: "நீர்ப்பாசனம்",
        experience: "அனுபவம்",
        farmSize: "நிலத்தின் அளவு",
        previousYield: "முந்தைய மகசூல்",
        storage: "சேமிப்பு",
        experienceUnit: "ஆண்டுகள்",
        farmSizeUnit: "ஹெக்டேர்",
        yieldUnit: "டன்/ஹெக்டேர்",
        storageUnit: "டன்",
        storageValues: {
          no: "இல்லை",
          na: "கிடைக்கவில்லை"
        }
      }
    }
  }
}

// Hook to manage language state
import { useState, createContext, useContext, ReactNode } from 'react'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ProfileTranslations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en')
  
  const value = {
    language,
    setLanguage,
    t: profileTranslations[language]
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
