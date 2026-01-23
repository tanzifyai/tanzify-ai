Tanzify — Final Stack Decisions & Next Steps

Summary
- Auth: Supabase Auth (serverless, integrates with Postgres)
- DB: Supabase Postgres (single source of truth for users, transcriptions, subscriptions)
- Storage: Supabase Storage (bucket `uploads`) — replaces AWS S3
- Transcription: OpenAI Whisper API (client or server proxy)
- Payments: Razorpay (frontend checkout + server-side webhook handling)
- Backend: Minimal private backend (ONLY for payment webhooks and server-side secrets)
- Frontend hosting: Netlify or Vercel
- CI: GitHub Actions (build + lint + tests)

Required environment variables (frontend)
- VITE_SUPABASE_URL: https://<project>.supabase.co
- VITE_SUPABASE_ANON_KEY: public anon key
- VITE_SUPABASE_BUCKET: uploads
- VITE_OPENAI_API_KEY: sk-...
- VITE_RAZORPAY_KEY_ID: rzp_test_...
- VITE_API_BASE: optional backend base URL (if used)

Server-side secrets (store only in private backend / hosting env)
- SUPABASE_SERVICE_ROLE_KEY: Supabase service role (server only)
- RAZORPAY_KEY_SECRET: Razorpay secret
- OPENAI_API_KEY: (if you proxy requests server-side instead of calling from frontend)
- EMAIL provider keys (SendGrid / SMTP credentials)

Immediate next steps
1. Create `STACK_DECISIONS.md` (this file) — done.
2. If you need server-side payment verification, create a small private backend repo with:
   - One endpoint to create Razorpay orders
   - One webhook endpoint to verify payments and update `subscriptions`/`users` in Supabase
   - Store `RAZORPAY_KEY_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` there only
3. Add one-line purpose comments at top of major `src/` files (I'll do this on request).
4. Finalize `.env.local` for local testing and set production env vars in Netlify/Vercel.
5. Run final checks: `npm run build`, `npm run lint`, `npm test`.

Recommendations / rationale
- Use Supabase for DB+Storage to avoid extra complexity and costs of S3.
- Keep backend minimal and private to protect payment and service-role secrets.
- Keep OpenAI key private when possible; if called from frontend, rate-limit and require user quotas.

If you want, I can now:
- scaffold a minimal private backend template (`backend-template/`) with Razorpay webhook endpoints, or
- add one-line purpose comments to main `src/` files, or
- run a final repo-wide scan and commit remaining changes.

Tell me which of the three to do next: `backend-template`, `add-comments`, or `scan-commit`.