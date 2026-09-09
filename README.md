# CampusBites — Student Dining Portal (Standalone Vercel App)

This branch contains the dedicated, standalone **Student Dining Portal** of CampusBites.

## Architecture
- **Framework**: React + Vite + Tailwind CSS
- **API**: Vercel Serverless Functions (`/api/*`) connected to Neon PostgreSQL
- **Zero Configuration**: Ready for 1-click deployment on Vercel at root `/`

## Deployment on Vercel
1. Import repository `snehithraj-1/collagebites-clone`.
2. Select branch **`student`**.
3. Leave all build settings at defaults (Root: `.`, Build: `vite build`, Output: `dist`).
4. Add environment variable:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
5. Click **Deploy**.
