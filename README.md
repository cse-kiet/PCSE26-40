# 🌾 FarmSat - Satellite Data for Modern Farming

A comprehensive farmer dashboard application that provides real-time satellite data, weather monitoring, soil analysis, and vegetation health tracking for precision agriculture.

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC)

## 🚀 Features

### 🛰️ Satellite Monitoring
- **NDVI Analysis**: Real-time vegetation health monitoring using Landsat-8 and Sentinel-2 data
- **Historical Trends**: Track vegetation health over time with interactive charts
- **Health Status**: Automatic assessment from Excellent to Very Poor

### 🌤️ Weather Intelligence
- **Real-time Weather**: Current conditions with temperature, humidity, wind, and pressure
- **7-Day Forecast**: Extended weather predictions for farm planning
- **Weather History**: Historical weather data analysis

### 🌱 Soil Monitoring
- **Temperature Tracking**: Surface and 10cm depth soil temperature monitoring
- **Moisture Analysis**: Real-time soil moisture with status indicators
- **Historical Data**: Soil condition trends over time

### ☀️ UV Index Monitoring
- **Current UV Levels**: Real-time UV index with risk assessment
- **UV Forecast**: 7-day UV predictions
- **Risk Management**: Automatic UV risk level classification

### 🗺️ Field Management
- **Interactive Maps**: Google Maps integration for field visualization
- **Polygon Creation**: Create and manage field boundaries
- **Field Analytics**: Comprehensive data for each field/polygon

### 📊 Dashboard Features
- **Real-time Updates**: Live data refresh with customizable intervals
- **Interactive Charts**: Recharts-powered visualization
- **Multi-language Support**: English and Hindi language options
- **Responsive Design**: Mobile-first approach with modern UI

## 📋 Prerequisites

Before setting up the project, make sure you have:

- **Node.js** (version 18 or higher)
- **npm**, **yarn**, or **pnpm** package manager
- **Git** for version control

### Required API Keys

You'll need to obtain API keys from the following services:

1. **Agromonitoring API**: 
   - Visit [agromonitoring.com/api](https://agromonitoring.com/api)
   - Sign up for an account and get your API key

2. **Google Maps API** (optional for maps functionality):
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Enable Maps JavaScript API and get your API key

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/farmer-dashboard.git
cd farmer-dashboard
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

Using pnpm:
```bash
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add your API keys to `.env.local`:

```env
# Agromonitoring API
NEXT_PUBLIC_AGROMONITORING_API_KEY=your_agromonitoring_api_key_here

# Google Maps API (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Additional environment variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🔧 Configuration

### API Configuration

1. **Initial Setup**: When you first run the application, you'll be prompted to configure your API keys
2. **Agromonitoring Setup**: Enter your Agromonitoring API key in the configuration screen
3. **Test Connection**: The system will automatically test your API connection
4. **Google Maps** (optional): Configure Google Maps API for enhanced mapping features

### User Authentication

The application uses a simple form-based authentication system:

1. **User Registration**: Enter full name, mobile number, and pincode
2. **Location Access**: Allow location access for better weather and soil data
3. **Dashboard Access**: Once configured, access the main dashboard

## 📱 Usage

### Getting Started

1. **Launch Application**: Start the development server and navigate to the app
2. **Configure APIs**: Set up your Agromonitoring API key
3. **Create Account**: Fill in your farmer profile information
4. **Create Fields**: Add your farm fields using the polygon creator
5. **Monitor Data**: View real-time satellite, weather, and soil data

### Creating Farm Fields

1. Navigate to the **Field Management** section
2. Click **"Create Field"**
3. Enter field name and coordinates
4. The system will create a polygon in Agromonitoring
5. Start monitoring your field data immediately

### Dashboard Navigation

- **Overview**: Quick status cards showing current conditions
- **Weather Tab**: Current weather and 7-day forecast
- **NDVI Tab**: Vegetation health trends and analysis
- **Soil Tab**: Temperature and moisture monitoring
- **UV Tab**: UV index tracking and risk assessment

## 🏗️ Project Structure

```
farmer-dashboard/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── ui/                # UI components (Radix UI + Tailwind)
│   ├── comprehensive-dashboard.tsx
│   ├── google-maps-integration.tsx
│   ├── weather-dashboard.tsx
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── use-agromonitoring-comprehensive.ts
│   ├── use-farmonaut-data.ts
│   └── ...
├── lib/                   # Utility libraries
│   ├── agromonitoring-api.ts
│   ├── google-maps-loader.ts
│   └── utils.ts
├── public/               # Static assets
└── styles/              # Additional styles
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Adding New Features

1. **API Integration**: Add new API clients in `lib/` directory
2. **Data Hooks**: Create custom hooks in `hooks/` directory
3. **UI Components**: Add new components in `components/` directory
4. **Pages**: Add new pages in `app/` directory

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## 🔍 Troubleshooting

### Common Issues

1. **"Agromonitoring API not initialized"**
   - Ensure your API key is correctly configured
   - Check the API configuration screen

2. **"401 Unauthorized - Invalid API key"**
   - Verify your Agromonitoring API key is valid
   - Check for extra spaces or characters

3. **Missing Data**
   - Some historical data may not be available for new polygons
   - Weather data requires a few minutes to populate

4. **Map Loading Issues**
   - Ensure Google Maps API key is configured (if using maps)
   - Check network connectivity

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` in your environment. This will:
- Show detailed error messages
- Enable console logging
- Display additional debugging information

For more detailed debugging information, see [DEBUGGING.md](./DEBUGGING.md).

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add TypeScript types for new features
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Agromonitoring API** for satellite and agricultural data
- **OpenWeatherMap** for weather services
- **Google Maps** for mapping services
- **Vercel** for deployment platform
- **Radix UI** for accessible UI components
- **Tailwind CSS** for styling framework

## 📞 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/yourusername/farmer-dashboard/issues)
- **Documentation**: Check the `AGROMONITORING_INTEGRATION.md` for detailed API documentation
- **Debugging**: Refer to `DEBUGGING.md` for troubleshooting

## 🚀 Deployment

### Deploy on Vercel

1. **Connect Repository**: Connect your GitHub repository to Vercel
2. **Environment Variables**: Add your environment variables in Vercel dashboard
3. **Deploy**: Vercel will automatically deploy your application

### Deploy on Other Platforms

The application can be deployed on any platform that supports Next.js:

- **Netlify**
- **Railway**
- **DigitalOcean App Platform**
- **AWS Amplify**

Make sure to:
- Set up environment variables
- Configure build commands (`npm run build`)
- Set start command (`npm run start`)

---

**Built with ❤️ for modern farming and precision agriculture**
#   P C S E 2 6 - 4 0  
 #   P C S E 2 6 - 4 0  
 