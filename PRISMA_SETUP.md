# Prisma + PostgreSQL Setup Guide

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database running. You can use:
   - Local PostgreSQL installation
   - Docker: `docker run --name postgres -e POSTGRES_PASSWORD=yourpassword -d -p 5432:5432 postgres`
   - Cloud services: Supabase, Railway, Neon, etc.

## Setup Steps

### 1. Environment Variables

Create a `.env` file in the project root with your database connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/hwi_database?schema=public"
```

Replace with your actual credentials:
- `username`: your PostgreSQL username
- `password`: your PostgreSQL password
- `localhost:5432`: your PostgreSQL host and port
- `hwi_database`: your database name

### 2. Create Database (if using local PostgreSQL)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hwi_database;

# Exit
\q
```

### 3. Run Migrations

Create and apply the database schema:

```bash
# Generate migration files
npx prisma migrate dev --name init

# This will:
# - Create migration files in prisma/migrations/
# - Apply the migration to your database
# - Generate the Prisma client
```

### 4. (Optional) Seed Database

You can create a seed script to populate initial data:

```bash
# Create seed file
touch prisma/seed.ts
```

### 5. Database Studio (Optional)

View and edit your data with Prisma Studio:

```bash
npx prisma studio
```

## Usage Examples

### In API Routes

```typescript
import { prisma } from '@/lib/prisma'

// Create a farm
const farm = await prisma.farm.create({
  data: {
    name: "My Farm",
    location: "40.7128,-74.0060",
    userId: "user123"
  }
})

// Get farms with fields and NDVI data
const farms = await prisma.farm.findMany({
  include: {
    fields: {
      include: {
        ndviData: true
      }
    }
  }
})
```

### In Components (via API)

```typescript
// Fetch farms
const response = await fetch('/api/farms?userId=user123')
const farms = await response.json()

// Create new field
await fetch('/api/fields', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Field 1",
    coordinates: "...",
    farmId: "farm123"
  })
})
```

## Available API Endpoints

- `GET /api/farms?userId=xxx` - Get all farms for a user
- `POST /api/farms` - Create a new farm
- `GET /api/fields?farmId=xxx` - Get all fields for a farm
- `POST /api/fields` - Create a new field
- `GET /api/ndvi?fieldId=xxx` - Get NDVI readings for a field
- `POST /api/ndvi` - Store new NDVI reading

## Useful Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Reset database (careful!)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy

# View current schema
npx prisma db pull
```
