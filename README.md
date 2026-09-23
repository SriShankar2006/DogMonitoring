# AI Stray Dog Detection & Monitoring System

A production-ready, responsive full-stack web application for detecting, tracking, and
monitoring stray dogs using AI image recognition, GPS geolocation, and interactive maps.

## Tech Stack

- **Frontend:** React 18 + Vite, Material UI (MUI) v5
- **Backend:** Node.js + Express
- **Authentication:** Firebase Authentication
- **Database:** Cloud Firestore
- **Image Storage:** Local filesystem on the backend server (served via /uploads over HTTPS or HTTP)
- **Maps:** Google Maps JavaScript API
- **AI Detection:** External REST API (pluggable)
- **Animal re-identification:** PostgreSQL embeddings shared by the Python enrollment tools and Node upload API

## Folder Structure

```
dog_monitoring_app/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── common/     # Sidebar, Header, Loader, ProtectedRoute...
│       │   ├── dashboard/
│       │   ├── upload/
│       │   ├── map/
│       │   ├── dogs/
│       │   ├── search/
│       │   └── stats/
│       ├── pages/
│       ├── services/       # firebase, supabase, api clients
│       ├── context/        # Auth + Theme context providers
│       ├── utils/
│       ├── theme/
│       └── routes/
└── server/                 # Express backend
    └── src/
        ├── config/         # firebaseAdmin, supabase clients
        ├── routes/
        ├── controllers/
        ├── services/       # aiService, duplicateDetection, storage
        ├── middleware/
        └── utils/
```

## Getting Started

From the project root, you can run both services with:

```bash
npm run dev:server
npm run dev:client
```

To start the client, Node API, and Python ML service together:

```bash
npm run dev:all
```

The ML service loads its detector, embedder, and health model automatically at startup.
Run `python enroll_dogs.py` once after adding reference images so re-identification has
known dogs to compare against.

### 1. Backend Setup

```bash
cd server
npm install
copy .env.example .env    # Windows
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install
copy .env.example .env    # Windows
npm run dev
```

The frontend runs on `http://localhost:5174` and proxies API calls to
`http://localhost:5000` by default.

## Mobile App Setup

A React Native + Expo mobile app is now available under the `mobile/` folder.

```bash
cd mobile
npm install
npm start
```

### Mobile notes

- The mobile app connects to the existing backend through `http://10.0.2.2:5000/api` for Android emulator access.
- For a physical device, update the base URL in `mobile/src/services/api.js` to your computer's local IP address.
- The current mobile app includes:
  - login and register screens
  - dashboard screen
  - image upload with gallery picker and GPS tagging
  - map screen
  - stats placeholder screen

## Environment Variables

See `client/.env.example` and `server/.env.example` for the full list of required
Firebase, Supabase, Google Maps, and AI API keys.

### PostgreSQL re-identification setup

Create a PostgreSQL database and set `DATABASE_URL` in `server/.env` and in the
environment used by the Python scripts. The server creates the shared embedding
tables on startup. Run `python enroll_dogs.py` once after placing reference images
in `images/`; uploads then compare their embeddings against PostgreSQL and store
the accepted upload embedding under the resolved dog ID.

## Core Workflow

```
Login → Dashboard → Upload Image → AI API
  → Not a dog? → Reject upload
  → Is a dog?
      → Duplicate? → Update Dog + Add Sighting History
      → New?       → Create Dog + Add Sighting History
      → Dashboard / Map / Search / Statistics all update
```

## Features

- Firebase Authentication (Login / Register / Forgot Password)
- Dashboard with live stats, recent uploads, and a map preview
- Drag-and-drop image upload with GPS tagging + AI dog validation
- Google Maps with dog markers, movement polylines, and current location
- Dog details with full sighting/movement timeline
- Search and filter (by ID, date, location, new/repeat, time range)
- Statistics dashboard with bar/pie/line charts
- Dark / light mode, fully responsive (mobile hamburger, desktop sidebar).
