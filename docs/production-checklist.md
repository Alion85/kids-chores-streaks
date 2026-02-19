# Production Checklist

## 1) Backend
- Run SQL in order:
  1. `supabase/schema.sql`
  2. `supabase/add_active_days.sql`
  3. `supabase/add_rewards_and_wishlist.sql`
  4. `supabase/rls.sql`
- Verify Auth Email provider enabled
- Optional: turn ON email confirmation for real users

## 2) Environments
- Create separate Supabase projects: `dev` and `prod`
- Fill env files from templates:
  - `.env.development.example`
  - `.env.production.example`

## 3) EAS Build
- Install/login:
  - `npm i -g eas-cli`
  - `eas login`
- Configure project:
  - `eas init`
- Build internal test:
  - `npm run build:preview:ios`
  - `npm run build:preview:android`

## 4) CI
- GitHub Action runs typecheck on push/PR.
- Keep `main` protected (require CI green).

## 5) Release
- Build production:
  - `npm run build:prod:ios`
  - `npm run build:prod:android`
- Submit:
  - `eas submit --platform ios`
  - `eas submit --platform android`

## 6) Monitoring
- Add Sentry/Crash reporting before public launch.
- Track conversion metrics: tasks created, tasks approved, streak count, wishlist redeemed.
