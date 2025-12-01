# Play, Learn & Protect Platform

Two coordinated apps (Next.js frontend + NestJS backend) powered by Supabase for auth, database, and Row-Level Security.

## Project Structure

```
/ frontend   → Next.js 14 App Router experience with Tailwind and Supabase Auth
/ backend    → NestJS API server with business logic modules
/ supabase   → SQL schema & seed data for Supabase
```

## Prerequisites

- Node.js 18+
- Supabase project (self-hosted via `supabase start` or cloud)
- PostgreSQL access for the service role connection string

## Setup Steps

1. **Provision Supabase**
   - Create a new Supabase project.
   - Run the SQL in `supabase/schema.sql` via the Supabase SQL editor (or `psql`). This creates:
     - Enums, tables, sample achievements/games, and RLS policies
     - **Database trigger** that automatically creates user profiles in `users` table when users sign up
     - The trigger extracts role from `user_metadata` and validates it before saving

2. **Configure environment variables**
   - Create a single `.env` file in the project root:
     ```bash
     # Run the setup script (copies from backend/.env and adds frontend vars)
     ./setup-env.sh
     ```
   - Or manually create `.env` in the root directory with:
     - `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` (same value)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public anon key)
     - `SUPABASE_SERVICE_ROLE_KEY` (service role, keep on the backend only)
     - `SUPABASE_DB_URL` (full Postgres connection string from Supabase)
     - `NEXT_PUBLIC_API_BASE_URL` (frontend API base URL)
   - See `HOW_TO_GET_SUPABASE_CREDENTIALS.md` for where to find these values

3. **Install dependencies**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

4. **Run the apps**
   ```bash
   # terminal 1
   cd frontend
   npm run dev

   # terminal 2
   cd backend
   npm run start:dev
   ```

5. **Sign-up / Auth**
   - Use the frontend `/auth/sign-up` to create users (child, parent, teacher). Supabase Auth metadata stores the desired role.
   - **Automatic profile creation**: A database trigger automatically creates the user profile in the `users` table immediately upon sign-up (no need to wait for first sign-in).
   - The trigger validates the role and saves it to the database.
   - Backend's `/me` endpoint will return the user profile with the correct role.

## Backend API Highlights

- `AuthModule` validates Supabase JWTs and injects user profiles into requests.
- Modules: `users`, `games`, `sessions`, `achievements`, `monitoring`, `alerts`, `leaderboard`.
- Monitoring heuristics generate alerts for risky words or excessive screen time.
- Teachers/Admins can create games; sessions automatically trigger achievement logic.

## Frontend Highlights

- Supabase Auth (email/password) with role-based dashboards.
- Landing page + role dashboards for child, parent, teacher, admin.
- Game catalog plus interactive demo games (`MathQuest`, `WordGarden`) that call the NestJS API to create/complete gameplay sessions.
- Parents get per-child monitoring summaries, alerts, and detail pages with resolve actions.

## Testing & Linting

- **Frontend**: `npm run lint`
- **Backend**: `npm run lint`

## Deployment Notes

- Expose the backend at a secure URL and set `NEXT_PUBLIC_API_BASE_URL` accordingly.
- Ensure Supabase service role key is never exposed to the frontend.
- Update RLS policies if adding new roles or tables.
# EDU-GUARD
