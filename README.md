# 🌾 FarmSat – Satellite Data for Smarter Farming

**FarmSat** is a farmer-friendly dashboard that brings real-time satellite insights, weather updates, soil conditions, and vegetation health tracking into one place.

Think of it as a modern toolkit for **precision farming**, designed to make field management simple and data-driven.

---

## 🚀 Features

### 🛰️ Satellite Monitoring

* NDVI analysis using **Landsat-8** & **Sentinel-2**
* Track vegetation health trends over time
* Simple health classification:
  **Excellent → Good → Moderate → Poor → Very Poor**

---

### 🌤️ Weather Insights

* Live weather data:

  * Temperature
  * Humidity
  * Wind
  * Pressure
* 7-day forecast for planning
* Historical weather trend analysis

---

### 🌱 Soil Conditions

* Soil temperature:

  * Surface level
  * 10 cm depth
* Real-time soil moisture readings
* Historical soil data tracking

---

### ☀️ UV Monitoring

* Live UV index with risk levels
* 7-day UV forecast
* Smart UV risk alerts

---

### 🗺️ Field Management

* Interactive maps (Google Maps integration)
* Draw & save field boundaries (polygons)
* Field-specific insights and analytics

---

### 📊 Dashboard Features

* Real-time updates with customizable refresh
* Interactive charts powered by **Recharts**
* Multi-language support:

  * English
  * Hindi
* Fully responsive (mobile-friendly)

---

## 🛠️ Setup Guide

### 📌 Prerequisites

* Node.js (v18+)
* npm / yarn / pnpm
* Git

### 🔑 API Keys Required

* Agromonitoring (**required**)
* Google Maps (**optional**, for map features)

---

### ⚙️ Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/farmer-dashboard.git
cd farmer-dashboard
```

#### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

#### 3. Setup environment variables

```bash
cp .env.example .env.local
```

Update `.env.local`:

```env
NEXT_PUBLIC_AGROMONITORING_API_KEY=your_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 4. Run the development server

```bash
npm run dev
```

👉 Open in browser: **[http://localhost:3000](http://localhost:3000)**

---

## 📱 How to Use

1. Start the server and open the app
2. Add your API keys when prompted
3. Create your farmer profile:

   * Name
   * Mobile number
   * Pincode
4. Add fields by drawing polygons on the map
5. Access real-time insights:

   * Vegetation
   * Weather
   * Soil
   * UV data

---

## 🏗️ Project Structure

```
farmer-dashboard/
├── app/          # Next.js app routes
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # API clients & helpers
├── public/       # Static assets
└── styles/       # Global styles
```

---

## 🔧 Development

### Common Scripts

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Run production server
npm run lint    # Lint code
npm run format  # Format code (Prettier)
```

### Code Conventions

* TypeScript throughout
* ESLint + Prettier enforced
* Tailwind CSS for styling

---

## 🐞 Troubleshooting

| Issue                          | Solution                     |
| ------------------------------ | ---------------------------- |
| Agromonitoring not initialized | Check `.env.local` API key   |
| 401 Unauthorized               | Verify API key               |
| No historical data             | Polygon may be newly created |
| Map not loading                | Check Google Maps API key    |

---

## 🤝 Contributing

Pull requests are welcome!

1. Fork the repository
2. Create a feature branch

   ```bash
   git checkout -b feature/new-feature
   ```
3. Commit your changes

   ```bash
   git commit -m "Added something cool"
   ```
4. Push to your branch

   ```bash
   git push origin feature/new-feature
   ```
5. Open a PR 🎉

---

## 📄 License

MIT License – free to use and modify.

---

## 🙏 Acknowledgements

* Agromonitoring API – Satellite data
* OpenWeatherMap – Weather data
* Google Maps – Mapping
* Radix UI + Tailwind – UI components
* Vercel – Hosting & deployment

---

Built with ❤️ to make farming **smarter, simpler, and more sustainable**.
