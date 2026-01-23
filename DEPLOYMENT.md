Phase 2 — Production Deployment

What I added
- `vercel.json` — minimal Vercel config to build from `dist` and route SPA requests to `index.html`.
- `netlify.toml` — minimal Netlify config to publish `dist` and redirect all routes to `index.html`.

Important: I cannot perform remote deployments from this environment (no Vercel/Netlify auth or network access). Below are exact commands you can run locally or in your CI to deploy and to import env vars from your local `.env`.

Vercel (recommended if you use Vercel)
1. Install Vercel CLI (if not installed):
```bash
npm i -g vercel
```
2. Build and preview locally:
```bash
npm run build
vercel dev
```
3. Deploy to Vercel (interactive — will prompt to link project):
```bash
vercel --prod
```
4. Set environment variables from your local `.env` (example using `vercel env add`):
```bash
# Example: add the NEXT_PUBLIC_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(echo "$NEXT_PUBLIC_SUPABASE_URL")
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < <(echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY")
vercel env add SUPABASE_SERVICE_ROLE_KEY production < <(echo "$SUPABASE_SERVICE_ROLE_KEY")
vercel env add DATABASE_URL production < <(echo "$DATABASE_URL")
```
Note: On Windows PowerShell you may instead run `vercel env add <NAME> production` and paste the value when prompted.

Netlify
Phase 2 — Production Deployment

What I added
- `vercel.json` — minimal Vercel config to build from `dist` and route SPA requests to `index.html`.
- `netlify.toml` — minimal Netlify config to publish `dist` and redirect all routes to `index.html`.

Important: I cannot perform remote deployments from this environment (no Vercel/Netlify auth or network access). Below are exact commands you can run locally or in your CI to deploy and to import env vars from your local `.env`.

Vercel (recommended if you use Vercel)
1. Install Vercel CLI (if not installed):
```bash
npm i -g vercel
```
2. Build and preview locally:
```bash
npm run build
vercel dev
```
3. Deploy to Vercel (interactive — will prompt to link project):
```bash
vercel --prod
```
4. Set environment variables from your local `.env` (example using `vercel env add`):
```bash
# Example: add the NEXT_PUBLIC_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(echo "$NEXT_PUBLIC_SUPABASE_URL")
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < <(echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY")
vercel env add SUPABASE_SERVICE_ROLE_KEY production < <(echo "$SUPABASE_SERVICE_ROLE_KEY")
vercel env add DATABASE_URL production < <(echo "$DATABASE_URL")
```
Note: On Windows PowerShell you may instead run `vercel env add <NAME> production` and paste the value when prompted.

Netlify
1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```
2. Build and test locally:
```bash
npm run build
netlify dev
```
3. Deploy site:
```bash
netlify deploy --prod --dir=dist
```
4. Set environment variables (Netlify CLI):
```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
netlify env:set DATABASE_URL "$DATABASE_URL"
```

Domain & SSL
- Vercel/Netlify both provide automatic HTTPS for assigned domains.
- To add a custom domain, use the provider dashboard (Vercel Dashboard or Netlify site settings) — both will guide DNS and enable automatic SSL.

If you want me to proceed from here, provide one of the following and I will run the appropriate CLI commands from this environment:
- A token with instructions (not recommended here) and confirm you accept granting it (I will not request tokens unless you explicitly instruct), or
- Grant me instructions to prepare a CI workflow (GitHub Actions) that runs `npm run build` and deploys to Vercel using a GitHub token & Vercel project token you add to the repository secrets.

I have created a sample GitHub Actions workflow at `.github/workflows/deploy.yml` that builds and deploys to Vercel.

GitHub Actions — required secrets
1. Go to your repository → Settings → Secrets and variables → Actions → New repository secret.
2. Add the following secrets (all values should be your production credentials):

   **Database & Supabase:**
   - `DATABASE_URL` — Your Supabase database connection URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (highly sensitive)
   - `VITE_SUPABASE_URL` — Supabase project URL (public)
   - `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key (public)

   **Payment Processing:**
   - `RAZORPAY_KEY_SECRET` — Razorpay secret key (highly sensitive)
   - `RAZORPAY_WEBHOOK_SECRET` — Razorpay webhook secret (highly sensitive)
   - `VITE_RAZORPAY_KEY_ID` — Razorpay key ID (public)

   **AI Services:**
   - `VITE_OPENAI_API_KEY` — OpenAI API key for transcription

   **Backend API:**
   - `VITE_API_BASE_URL` — Production backend API URL

   **Deployment:**
   - `VERCEL_TOKEN` — Personal token from Vercel (Account → Tokens)
   - `VERCEL_PROJECT_ID` — Project ID from Vercel project settings
   - `VERCEL_ORG_ID` — Organization ID from Vercel account

**Security Best Practices:**
- Never commit secrets to version control
- Use separate secrets for different environments (dev/staging/prod)
- Rotate secrets regularly (at least quarterly)
- Use the principle of least privilege for tokens
- Monitor secret usage in GitHub's security tab
- Enable branch protection rules requiring reviews
- Use Dependabot for dependency updates

**Secret Rotation Procedures:**
1. Generate new credentials from the service provider
2. Update the GitHub secret with the new value
3. Update corresponding Vercel environment variables manually or trigger a deployment
4. Test the application thoroughly
5. Revoke old credentials after confirming everything works
6. Update any documentation with new values if necessary

**Important:** Secrets are automatically masked in GitHub Actions logs. Never echo or print secret values in workflows.

If you want, I can next:
- Add a GitHub Actions helper that reads env values from GitHub Secrets and pushes them to Vercel (recommended), or
- Create a CI-only deploy flow that uses `VERCEL_TOKEN` stored in repo secrets to perform non-interactive deploys.
