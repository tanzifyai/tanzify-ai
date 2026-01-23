# Deployment Guide — Netlify (Quick 3-step)

This guide shows how to deploy the cleaned Tanzify AI frontend to Netlify.

1. Build

```bash
npm install
npm run build
```

2. Create Netlify site

- Go to https://app.netlify.com/sites/new
- Connect your GitHub repo `tanzifyai/tanzify-ai` and select the main branch
- Set the build command: `npm run build`
- Set the publish directory: `dist`
- Add environment variables in Netlify dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_BUCKET` (e.g. `uploads`)
  - `VITE_OPENAI_API_KEY`
  - `VITE_RAZORPAY_KEY_ID` (optional)

3. Deploy & verify

- Trigger a deploy from Netlify UI or push to `main`
- Visit the Netlify-provided URL and test the core flow: Signup → Login → Upload → Transcribe

Optional: Use GitHub Pages

- Run `npm run build:gh`
- Push the `dist` directory with `gh-pages` (`npm run deploy` is included in `package.json`)

Notes

- This repo assumes authentication via Firebase for now; do not switch auth providers without the migration plan.
- Supabase storage is used for file uploads; ensure the `storage_key` column exists in your `transcriptions` table.
