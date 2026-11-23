# BLEN DIGITAL – Production Live Deployment Guide

This document provides the fastest, most reliable procedure to deploy and run the **BLEN DIGITAL Employee Leave & Attendance Management System** live in production.

---

## 1. Architecture Overview

- **Frontend**: React 18 (Vite 6, Tailwind CSS 3, Recharts, Lucide) hosted on **Vercel** (Edge CDN, sub-second TTFB).
- **Backend API**: Node.js v20+ / Express 4 REST API with JWT Auth & RBAC hosted on **Render** (Containerized Web Service).
- **Database**: **MongoDB Atlas** Cloud Cluster (`mongodb+srv://...`).
- **Repository**: [https://github.com/Om20kar05/blen](https://github.com/Om20kar05/blen) (`main` branch).

---

## 2. Quick Deploy Instructions

### A. Backend Deployment (Render)

1. Open **[dashboard.render.com](https://dashboard.render.com)**.
2. Click **New +** > **Web Service**.
3. Select your repository: **`Om20kar05/blen`**.
4. Configure service settings:
   - **Name**: `blen-hr-portal` (or `blen-backend`)
   - **Region**: Singapore (or closest to your users)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production security & logging |
   | `PORT` | `10000` | Render standard port |
   | `MONGODB_URI` | `mongodb+srv://gawaliomgmailcom:Omkar272005@omkar.03xqnr7.mongodb.net/blen_hr?retryWrites=true&w=majority` | Validated live Atlas cluster |
   | `JWT_SECRET` | `blen_super_secret_jwt_key_2026` | Cryptographic session signing key |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
6. Click **Deploy Web Service**.
7. Note your backend URL: `https://blen-hr-portal.onrender.com`.

---

### B. Frontend Deployment (Vercel — 45 Seconds)

1. Open **[vercel.com/new](https://vercel.com/new)** and sign in with GitHub (`Om20kar05`).
2. Click **Import** next to `blen`.
3. Configure project settings:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://blen-hr-portal.onrender.com/api` |
5. Click **Deploy**.
6. Vercel will build and deploy the frontend in under 30 seconds to a live URL:
   `https://blen-omega.vercel.app` (or similar).

---

## 3. Database Seed & Verification

To populate the production database with initial seed accounts, department hierarchies, and attendance logs:
```bash
npm run seed
```
*(Can be executed locally with `backend/.env` pointing to the Atlas database, or via Render Shell)*

---

## 4. Test Accounts & Live Credentials

All three roles are pre-seeded and accessible via 1-click evaluation buttons on the live Login page:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@blen.com` | `Admin@123` | Executive dashboard, analytics, leave policy config, employee & department management |
| **Manager** | `manager@blen.com` | `Manager@123` | Team shift status, team attendance logs, leave approval/rejection with mandatory notes |
| **Employee** | `employee@blen.com` | `Employee@123` | Self-service check-in/out, leave applications, personal attendance history & balances |

---

## 5. Security & Verification Checklist

- [x] **MongoDB Atlas Connection**: Tested and verified live.
- [x] **CORS Configuration**: Wildcard regex configured for `*.vercel.app` and custom origins.
- [x] **SPA Routing**: `frontend/vercel.json` rewrites enabled so page refreshes never return 404.
- [x] **Host Binding**: Express server explicitly binds to `0.0.0.0` for containerized hosting.
- [x] **Health Check**: Root `/` and `/api/health` return HTTP 200 JSON statuses.
- [x] **Unit & Integration Tests**: 20/20 test suites passing.
