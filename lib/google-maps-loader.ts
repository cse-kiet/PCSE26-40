// Google Maps API loader utility
// Ensures the API is only loaded once across all components

interface GoogleMapsLoaderOptions {
  libraries?: string[]
  callback?: string
}

class GoogleMapsAPILoader {
  private static instance: GoogleMapsAPILoader
  private loadPromise: Promise<void> | null = null
  private isLoaded = false

  private constructor() {}

  public static getInstance(): GoogleMapsAPILoader {
    if (!GoogleMapsAPILoader.instance) {
      GoogleMapsAPILoader.instance = new GoogleMapsAPILoader()
    }
    return GoogleMapsAPILoader.instance
  }

  public async load(options: GoogleMapsLoaderOptions = {}): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded && window.google) {
      return Promise.resolve()
    }

    // If currently loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise
    }

    // Start loading
    this.loadPromise = this.loadGoogleMapsScript(options)
    return this.loadPromise
  }

  private loadGoogleMapsScript(options: GoogleMapsLoaderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        this.isLoaded = true
        resolve()
        return
      }

      // Check if script already exists in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Script exists, wait for it to load
        const checkLoaded = () => {
          if (window.google && window.google.maps) {
            this.isLoaded = true
            resolve()
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
        return
      }

      // Get API key from environment
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        reject(new Error('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.'))
        return
      }

      // Create script element
      const script = document.createElement('script')
      const libraries = options.libraries || ['drawing', 'geometry']
      const libraryParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : ''
      const callbackParam = options.callback ? `&callback=${options.callback}` : ''
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libraryParam}${callbackParam}`
      script.async = true
      script.defer = true

      script.onload = () => {
        this.isLoaded = true
        resolve()
      }

      script.onerror = () => {
        this.loadPromise = null // Reset promise so it can be retried
        reject(new Error('Failed to load Google Maps API. Please check your API key and internet connection.'))
      }

      document.head.appendChild(script)
    })
  }

  public isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!window.google
  }
}

// Export singleton instance
export const googleMapsLoader = GoogleMapsAPILoader.getInstance()

// Type declarations
declare global {
  interface Window {
    google: typeof google
    initMap?: () => void
  }
}
