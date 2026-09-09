# CampusBites — Super Admin Portal (Standalone Vercel App)

This is the dedicated standalone repository for the **CampusBites Super Admin & Order Management Dashboard**.

## Key Features
- **Real-Time Order Pipeline**: Track orders in real-time (`CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`).
- **Partner Dispatch**: Instant delivery partner assignment with live tracking.
- **Menu Management**: Dynamic price, description, category, and availability updates directly synced to Neon PostgreSQL.
- **Restaurant Multi-Vendor Controls**: Toggle restaurants on/off and manage store settings.
- **Excel Report Generation**: Instant export of campus dining data.

## 1-Click Deployment on Vercel
1. In the Vercel Dashboard, import `snehithraj-1/collagebites-clone` (branch: `main`).
2. Leave all settings at defaults:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
4. Click **Deploy**!
