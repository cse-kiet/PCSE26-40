🌾 AgriVision – Satellite Data for Smarter Farming

AgriVision is a farmer-friendly dashboard that brings real-time satellite insights, weather updates, soil conditions, and vegetation health tracking into one place.
Think of it as a modern toolkit for precision farming, designed to make field management simple and data-driven.






🚀 What AgriVision Can Do
🛰️ Satellite Monitoring

NDVI analysis with Landsat-8 & Sentinel-2

Track vegetation health trends over time

Simple health status: Excellent → Very Poor

🌤️ Weather Insights

Live weather data (temp, humidity, wind, pressure)

7-day forecasts for farm planning

Weather history for past trend analysis

🌱 Soil Conditions

Soil temperature (surface & 10cm depth)

Real-time soil moisture readings

Historical soil condition tracking

☀️ UV Monitoring

Live UV index + risk level

7-day UV forecast

Smart UV risk alerts

🗺️ Field Management

Interactive maps with Google Maps

Draw and save field boundaries (polygons)

View field-specific data & analytics

📊 Dashboard Features

Real-time updates with customizable refresh

Charts powered by Recharts

English + Hindi language support

Responsive UI that works on mobile too

🛠️ Setup Guide
Prerequisites

Node.js (v18+)

npm, yarn, or pnpm

Git

API keys:

Agromonitoring
 (required)

Google Maps API
 (optional, for maps)

Installation

Clone the repo:

git clone https://github.com/yourusername/farmer-dashboard.git
cd farmer-dashboard


Install dependencies:

npm install
# or
yarn install
# or
pnpm install


Set up your .env.local:

cp .env.example .env.local


Fill it with your keys:

NEXT_PUBLIC_AGROMONITORING_API_KEY=your_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000


Run the dev server:

npm run dev


Now open 👉 http://localhost:3000

📱 How to Use

Start the server and open the app

Add your API keys when prompted

Create your farmer profile (name, mobile, pincode)

Add fields by drawing polygons on the map

Get instant access to vegetation, weather, soil, and UV data

🏗️ Project Layout
farmer-dashboard/
├── app/                  # Next.js app routes
├── components/           # Reusable UI + custom components
├── hooks/                # Custom React hooks
├── lib/                  # API clients & helpers
├── public/               # Static assets
└── styles/               # Global styles

🔧 Development

Common scripts:

npm run dev → Start dev server

npm run build → Build for production

npm run start → Run production server

npm run lint → Check linting

npm run format → Format with Prettier

Conventions:

TypeScript everywhere

ESLint + Prettier enforced

Tailwind CSS for styling

🐞 Troubleshooting

Agromonitoring not initialized → Check .env.local key

401 Unauthorized → API key typo or missing

No historical data → Polygon might be new

Map not loading → Missing/invalid Google Maps key

🤝 Contributing

Pull requests are welcome!

Fork this repo

Create a branch (git checkout -b feature/new-feature)

Commit changes (git commit -m "Added something cool")

Push (git push origin feature/new-feature)

Open a PR 🎉

📄 License

MIT License – free to use and modify. See LICENSE
.

🙏 Thanks To

Agromonitoring API – Satellite data

OpenWeatherMap – Weather data

Google Maps – Mapping

Radix UI + Tailwind – Beautiful UI

Vercel – Hosting & deployment

Built with ❤️ to make farming smarter, simpler, and more sustainable.