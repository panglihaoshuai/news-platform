# Vercel Deployment Guide

## Quick Deploy

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel
```

### Option 2: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import from GitHub: `panglihaoshuai/news-platform`
4. Configure Environment Variables (see below)
5. Click "Deploy"

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_MAPTILER_KEY` | Map tiles API key | [MapTiler Cloud](https://cloud.maptiler.com/) |
| `DEEPSEEK_API_KEY` | LLM for smart classification | [DeepSeek Platform](https://platform.deepseek.com/) |
| `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY` | Market data API | [Alpha Vantage](https://www.alphavantage.co/) |

## Project Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Root Directory**: `/`

## Features Configured

### API Routes
- All API routes are serverless functions
- Max duration: 60 seconds
- CORS enabled for cross-origin requests

### Cron Jobs
- `/api/cron/fetch-news` - Runs every 15 minutes

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: enabled

## After Deployment

### 1. Update Supabase
Add your Vercel URL to Supabase:
- Supabase Dashboard → Authentication → URL Configuration
- Add your Vercel production URL

### 2. Configure Domain (Optional)
- Vercel Dashboard → Settings → Domains
- Add your custom domain

### 3. Enable Preview Deployments
- Vercel automatically deploys PRs as preview deployments
- Share preview links for review

## Troubleshooting

### Build Fails
```bash
# Test build locally
npm run build
```

### Environment Variables Not Working
- Make sure variables are set in Vercel Dashboard
- Restart deployment after adding variables

### API Routes Not Working
- Check Vercel Function Logs in Dashboard
- Verify CORS settings in `vercel.json`

## Performance Tips

- Images are optimized by Vercel
- API routes have 60s timeout
- Regions: `iad1` (Washington, D.C.)
