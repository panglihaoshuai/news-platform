# Deployment Guide

This document is the single source for production deployment.

## 1) Required Services

- GitHub (source repo)
- Vercel (web hosting)
- Supabase (database)

## 2) Required Environment Variables

Set these in Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
ALPHA_VANTAGE_API_KEY=<alpha-vantage-key>
NEXT_PUBLIC_MAPTILER_KEY=<maptiler-key>
```

Optional:

```bash
DEEPSEEK_API_KEY=<deepseek-key>
```

## 3) Deploy Steps

1. Push `main` branch to GitHub.
2. Import project in Vercel (`news-platform`).
3. Add environment variables.
4. Trigger production deploy.
5. Verify deployment URL and aliases.

## 4) Pre-Deploy Checks

Run locally before pushing:

```bash
npx tsc --noEmit
npx next build
```

Both commands must pass.

## 5) Post-Deploy Checks

1. Open `/zh` page and confirm map + feed load.
2. Verify filters work:
   - region/country
   - language (EN/ZH/ALL)
   - categories
3. Verify outbound link prompt behavior:
   - first click of the day shows prompt
   - continue hides prompt for today
   - checked "do not show again" disables permanently
4. Verify market panel returns data for representative symbols:
   - `SPY`, `TLT`, `FX:USD:CNY`

## 6) Common Issues

- Empty news feed:
  - check Supabase env vars and table data
  - check filter combinations
- Missing market quotes:
  - verify `ALPHA_VANTAGE_API_KEY`
  - retry after rate-limit window
- Build failure on Vercel:
  - run local typecheck/build first

## 7) Useful Commands

```bash
# Check deployment list
npx vercel ls --prod

# Inspect current production alias target
npx vercel inspect https://news-platform-kappa.vercel.app
```
