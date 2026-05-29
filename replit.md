# ParkEase - Parking Management System

## Overview

A full-stack parking management platform for India, allowing users to find and book parking spots, owners to list their parking spaces, and administrators to manage the platform.

## Architecture

- **Frontend**: React 19 + Vite, Tailwind CSS, Leaflet maps — runs on port 5000
- **Backend**: Node.js + Express 5 REST API — runs on port 3000
- **Database**: PostgreSQL (Replit managed) via Prisma ORM
- **Auth**: JWT tokens + bcryptjs password hashing

## Project Structure

```
client/       # React frontend (Vite)
server/       # Express backend
  prisma/     # Database schema & migrations
  routes/     # API routes (auth, parking, booking, admin, etc.)
  middleware/ # Auth, error handling
  utils/      # Logger, mailer, validation
```

## Development

Two workflows run concurrently:
- **Start application** — `cd client && npm run dev` (port 5000, webview)
- **Backend API** — `cd server && node index.js` (port 3000, console)

The Vite dev server proxies `/api` requests to the backend at `localhost:3000`.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `JWT_SECRET` — Secret for signing JWT tokens (set in shared env vars)
- `NODE_ENV` — `development` or `production`
- `FRONTEND_URL` — Optional: override allowed CORS origin

## Deployment

In production, the Express server serves the built React frontend from `client/dist` (static files) and handles all API routes. The build step compiles the React app first.

## User Roles

- **USER** — Can search and book parking spots
- **OWNER** — Can list and manage parking spaces
- **ADMIN** — Full platform management

## User Preferences

- No specific preferences recorded yet.
