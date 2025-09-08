# 🌱 AI-Powered ing Assistant Setup Guide

This document provides a complete guide to setting up and using the AI-powered farming assistant system that combines farmer onboarding, real-time agricultural data, and AI-generated insights.

## 🚀 System Overview

The farming assistant integrates:

1. **Farmer Profile Management** - Comprehensive onboarding and profile data
2. **Environmental Data Integration** - Weather, satellite, and soil data from Agromonitoring API
3. **AI Insights** - Google Gemini AI generates personalized farming recommendations
4. **Real-time Dashboard** - Interactive interface for farmers to ask questions and get advice

## 📋 Prerequisites

Before running the system, ensure you have:

- Node.js 18+ installed
- PostgreSQL database setup
- Required API keys (see below)

## 🔑 Required API Keys

### 1. Google Gemini AI API Key
- Visit: https://makersuite.google.com/app/apikey
- Create a new API key
- Set as: `NEXT_PUBLIC_GEMINI_API_KEY`

### 2. Agromonitoring API Key
- Visit: https://agromonitoring.com/api
- Sign up and get your API key
- Set as: `NEXT_PUBLIC_AGROMONITORING_API_KEY`

### 3. Database URL
- Set up a PostgreSQL database
- Set as: `DATABASE_URL="postgresql://username:password@host:port/database"`

## 🛠️ Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/farming_db"
   NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key_here"
   NEXT_PUBLIC_AGROMONITORING_API_KEY="your_agromonitoring_api_key_here"
   ```

3. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run the Application**
   ```bash
   npm run dev
   ```

5. **Access the Demo**
   Visit: http://localhost:3000/demo

## 🎯 Key Features Implemented

### 1. Farmer Onboarding System (`/components/farmer-onboarding-form.tsx`)

**Multi-step guided setup:**
- Personal information (name, phone, location)
- Crop details (crop type, soil type, sowing date)
- Infrastructure (irrigation method, storage capacity)
- Experience (farming years, farm size, previous yield)

**Features:**
- Form validation with Zod schema
- Progress tracking
- Step-by-step navigation
- Data persistence to database

### 2. Database Schema (`/prisma/schema.prisma`)

**Extended models:**
- `User` - Basic user information + location data
- `FarmerProfile` - Comprehensive farming information
- `IrrigationMethod` - Enum for standardized irrigation types
- Existing models: `Farm`, `Field`, `NDVIReading`, `WeatherData`

### 3. Data Aggregation Service (`/lib/farmer-data-aggregator.ts`)

**Combines multiple data sources:**
- Farmer profile from database
- Current weather data from Agromonitoring API
- Weather forecasts
- NDVI satellite data
- Soil moisture and temperature data
- UV index information

**Features:**
- Parallel data fetching for performance
- Error handling for missing data sources
- Data completeness tracking
- Coordinate parsing for API calls

### 4. AI Insight Generation (`/lib/gemini-ai.ts`)

**Google Gemini AI integration:**
- Comprehensive prompt engineering with farmer context
- Structured JSON response parsing
- Confidence scoring
- Source attribution
- Specialized insight types (crop, weather, irrigation)

**AI Capabilities:**
- Crop-specific recommendations
- Weather-based actions
- Irrigation scheduling advice
- Risk assessments and urgent alerts

### 5. API Endpoints

**`/app/api/farmer-profile/route.ts`:**
- POST: Create/update farmer profiles
- GET: Retrieve farmer profile data
- PUT: Update existing profiles

**`/app/api/ai-insights/route.ts`:**
- POST: Generate AI insights from user questions
- GET: Get predefined insights (crop, weather, irrigation)

### 6. Interactive Chat Interface (`/components/ai-farming-assistant.tsx`)

**Features:**
- Real-time chat with AI
- Preset question templates
- Confidence indicators
- Source attribution
- Urgent alert highlighting
- Recommendation formatting

### 7. Comprehensive Dashboard (`/components/farming-hub.tsx`)

**Tabbed interface:**
- Dashboard: Overview of farm metrics and quick insights
- AI Assistant: Interactive chat for personalized advice
- Profile: Farmer information and settings
- Settings: System configuration options

## 🔄 User Flow

1. **First-Time User:**
   - Access `/demo` page
   - Complete farmer onboarding form
   - System collects: crop, soil, irrigation, experience data
   - Profile saved to database with `isOnboardingComplete: true`

2. **Data Integration:**
   - System fetches environmental data based on location
   - Combines farmer profile with real-time API data
   - Creates comprehensive context for AI

3. **AI Interaction:**
   - User asks questions in chat interface
   - System aggregates all relevant data
   - Gemini AI generates personalized insights
   - Response includes recommendations, alerts, and confidence scores

## 📊 Data Sources & Integration

### Farmer Profile Data:
- Crop name, soil type, sowing date
- Storage capacity and irrigation methods
- Farm size and farming experience
- Location for environmental data

### Environmental Data (Agromonitoring API):
- Current weather conditions
- 7-day weather forecasts
- NDVI satellite readings
- Soil moisture and temperature
- UV index data

### AI Context Building:
- All farmer data + environmental data
- Historical trends and patterns
- Crop-specific knowledge base
- Best practices and recommendations

## 💡 Example AI Interactions

**User Question:** "Should I irrigate my wheat field today?"

**AI Response:**
- Analyzes current soil moisture (28.1%)
- Checks weather forecast (rain expected in 2 days)
- Considers wheat growth stage and irrigation method
- Provides specific recommendation with confidence score
- Includes timing and quantity suggestions

**User Question:** "How is my crop health based on satellite data?"

**AI Response:**
- Reviews NDVI readings (0.65 - Good status)
- Compares to optimal ranges for the crop
- Identifies areas needing attention
- Suggests interventions if necessary

## 🎨 Technical Architecture

### Frontend:
- Next.js 15 with React 19
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI components
- React Hook Form with Zod validation

### Backend:
- Next.js API routes
- Prisma ORM with PostgreSQL
- Google Gemini AI SDK
- Agromonitoring API integration

### Key Libraries:
- `@google/generative-ai` - Gemini AI integration
- `@prisma/client` - Database ORM
- `react-hook-form` + `@hookform/resolvers` - Form handling
- `zod` - Schema validation
- Various Radix UI components

## 🚦 Getting Started with Demo

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Visit the demo page:**
   ```
   http://localhost:3000/demo
   ```

3. **Try the system:**
   - If no profile exists: Complete the onboarding form
   - If profile exists: Go directly to AI assistant
   - Ask questions like:
     - "What should I do based on current weather?"
     - "When should I irrigate my crop?"
     - "How is my crop health?"

## 🔧 Customization Options

### Adding New Crops:
Update `CROP_OPTIONS` in `/components/farmer-onboarding-form.tsx`

### Adding New Soil Types:
Update `SOIL_TYPES` in the same file

### Modifying AI Prompts:
Edit the `buildPrompt` method in `/lib/gemini-ai.ts`

### Adding New Data Sources:
Extend the data aggregation service to include additional APIs

## 📈 Potential Enhancements

1. **Real-time Notifications** - Alert farmers about urgent conditions
2. **Historical Analytics** - Track farming performance over time
3. **Market Integration** - Include crop pricing and market data
4. **Image Analysis** - AI-powered crop disease detection
5. **Multi-language Support** - Localized farming advice
6. **Mobile App** - React Native or PWA implementation

## 🛡️ Security Considerations

- API keys stored as environment variables
- Database queries use Prisma for SQL injection protection
- User input validation with Zod schemas
- Rate limiting recommended for production

This farming assistant represents a complete integration of modern agricultural technology, AI-powered insights, and user-friendly interfaces to help farmers make data-driven decisions.
