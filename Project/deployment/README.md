# DBSE Project Deployment Guide

All deployment assets are cleanly isolated in this `deployment/` directory. None of your active project source files were touched.

---

## Method 1: Free 5-Minute Cloud Deploy (Vercel + Render)

### Step 1: Deploy Backend to Render (Free)
1. Push this repo to GitHub.
2. Go to [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Select your GitHub repository.
4. Set:
   - **Root Directory:** `mock-api`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** `Free`
5. Click **Deploy**. Note your live URL (e.g., `https://dbse-backend.onrender.com`).

### Step 2: Deploy Frontend to Vercel (Free)
1. Go to [Vercel.com](https://vercel.com) and import your repo.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-url.onrender.com`
4. Click **Deploy**. Your app is live with public HTTPS!

---

## Method 2: Containerized Deploy with Docker Compose

To run the complete 3-tier enterprise stack locally or on a cloud VM (AWS / DigitalOcean):

```bash
cd deployment
docker compose up --build
```

- **Frontend:** http://localhost:80
- **Backend API:** http://localhost:3001
- **Postgres + pgvector:** localhost:5432
