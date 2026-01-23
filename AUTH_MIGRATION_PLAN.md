# Firebase → Supabase Auth Migration Plan

Purpose: Outline steps to migrate authentication from Firebase to Supabase Auth without breaking core flow. Do NOT implement immediately — this is a migration plan.

Estimated time: 3–4 hours (developer familiar with codebase and Supabase)

Steps:
1. Inventory
   - Files to change: `src/contexts/AuthContext.tsx`, any `ProtectedRoute` or auth-guard components, `.env` usage, and tests.
   - Database references: replace `firebase_uid` usage in `src/lib/supabase.ts` and SQL schema => switch to `auth_id` or `supabase_user_id`.

2. Create Supabase Auth client
   - Use existing `src/lib/supabase.ts` client and enable `supabase.auth` usage in frontend.

3. Update `AuthContext`
   - Replace Firebase imports with `supabase.auth` listeners (`onAuthStateChange`) and map Supabase user object to existing `user` shape.
   - Ensure `user.id` maps to Supabase `id` and other fields (email, name).

4. Database migration
   - Add `supabase_id` column to `users` table and backfill from `firebase_uid` if possible.
   - Update `transcriptions` policies to use `auth.uid()` comparisons against `supabase_id`.

5. Update code references
   - Replace any `firebase_uid` checks with `user.id` or `supabase_id` logic.
   - Update `src/lib/supabase.ts` helper methods if they assumed Firebase UIDs.

6. Testing
   - Run local sign-up, login, upload, transcription flows.
   - Verify RLS policies and that users see only their transcriptions.

7. Rollout
   - Keep Firebase auth enabled until all users migrated or provide migration flows (token exchange) if necessary.

Files affected (non-exhaustive):
- `src/contexts/AuthContext.tsx`
- `src/lib/supabase.ts` (types + helper functions)
- `src/pages/Login.tsx`, `src/pages/Signup.tsx`, `src/pages/Dashboard.tsx`
- Database SQL: `database-schema.sql` (replace `firebase_uid` with `supabase_id`)
- Any serverless/backend endpoints that reference Firebase IDs

Notes & risks:
- Changing auth is breaking; ensure feature flag or migration window.
- Backfilling users requires access to mapping between Firebase UIDs and Supabase IDs.
- If you want, I can implement this after you confirm.
