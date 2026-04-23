<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Comeback Era

This contains everything you need to run the app locally.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the frontend:
   `npm run dev`
3. In a second terminal, run the backend API:
   `npm run server`

## Backend

The backend exposes a small Express API on port `3001` with endpoints for habits, planning, and completion updates.

## Environment

If you use Gemini features, set `GEMINI_API_KEY` in `.env.local`.

## Deploy to Vercel

This app is ready for a Vercel frontend deployment.

1. Push the repo to GitHub.
2. Import the repository into Vercel.
3. Use these settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Deploy the Express backend separately if you need it in production.

If you later connect the frontend to a hosted backend, use an environment variable for the API base URL instead of `localhost`.
