# CLAUDE.md — DESIST! Mobile App

> Drop this file at the root of `chris-wedesist/mobile_app` as `CLAUDE.md`. Claude Code loads it into context every session.

## What this repo is

DESIST! Mobile is the **"tactical" surface** of the DESIST! (Digital Emergency Safety & Incident Support Tool) platform — a civil rights safety tool used during high-pressure encounters with law enforcement, ICE, or other authority figures. User state is high-adrenaline; the app must work under stealth and operate reliably under pressure. Core features: stealth mode (calculator cover), biometric auth, incident recording with auto-upload, panic alerts, emergency contact SMS, PostGIS-backed incident map, attorney search.

This is one of two surfaces. The companion is a Next.js website (`chris-wedesist/website`). Both surfaces point at the same Supabase project — see "The Bridge" below.

## Active branch

`phase-2-advanced-security` — base any new work off this branch unless told otherwise.

## Stack — what's actually installed

- **React Native** 0.79.5
- **Expo SDK 53** — `yarn.lock` is authoritative at `53.0.20`. `package.json` shows `~49` and is wrong. **Do not trust `package.json` for version info.** `package.json` is a skeleton that does not reflect the actual installed dependency tree.
- **TypeScript**, **Expo Router 5.1.4**
- **Supabase JS v1.35.7** — deprecated. v2 migration is required. Field-name changes between v1 and v2 will cause silent bugs; flag any code you touch that uses v1 patterns.
- **PostGIS** (server-side via Supabase)
- **Zustand**, **AsyncStorage**, **Expo SecureStore**
- **i18next / react-i18next** — EN/ES/FR locale files exist (63 keys each); most screens are not yet wired to `useTranslation()`. When you touch a screen with user-facing strings, wire it.

## Design system — NON-NEGOTIABLE

Before any code change that affects UI, read `docs/STYLE_GUIDE.md`.

- All spacing, colors, typography, shadows must come from `constants/theme.ts`. **No hardcoded values.** Ever.
- Font: Inter (Regular / Medium / SemiBold / Bold).
- Color categories: brand (primary / secondary / accent), semantic (success / warning / error), text (primary / secondary / muted), security states (safe / caution / danger).
- **No red backgrounds anywhere.** The logo uses white and red only — that's the only acceptable use of red as a fill.
- Run `scripts/style-check.sh` before declaring any UI work done. ESLint also enforces style rules.
- Visual tone: serious, clear, trust-building, professional. Never cartoonish.
- WCAG 2.1 AA alignment required.

## Security — known issues, fix before any public exposure

These are committed-to-the-repo secrets. Treat any PR that does not move toward fixing them as suspect:

1. **Supabase URL and anon JWT hardcoded in 18 source files.** Move to env vars via `expo-constants` / `app.config.ts`. Do not introduce a 19th hardcoded reference.
2. **Google Places API key committed in plaintext to `app.json`.** Move to env. Rotate the key after the move.
3. **Supabase JS v1 in use** — migrate to v2 before any auth work.

## What works vs. what doesn't — current ground truth

**Verified working (codebase-inspected):** stealth mode end-to-end (calculator cover, 7-tap + hold toggle, `stealthManager` singleton with AsyncStorage persistence, biometric gate, blank-screen mode, threat detection, screen capture prevention), biometric auth with PIN fallback, incident recording (expo-camera + expo-av, 5-min max, anonymous upload to Supabase Storage), recordings playback, incident map with real-time Supabase subscriptions, emergency contact SMS dispatch, attorney search via Google Places, document safe storage, 5-slide onboarding, badges (local only), panic activation screen, i18n scaffolding.

**Partial or stubbed:**
- **User authentication: NOT IMPLEMENTED.** No `signIn` / `signUp` / `signOut` anywhere. Profile screen shows hardcoded "John Doe" with a stock photo. All Supabase writes are anonymous.
- GDPR data deletion and export: UI-only, TODO comments, no backend logic.
- **Incidents tab uses placeholder credentials** (`https://example.supabase.co`) — **will crash at runtime.** Fix before testing that tab.
- Push notifications: schema exists, token registration not wired.
- Sentry: commented out for SDK 53 compatibility. No crash reporting active.
- Cover story variant screens (`stealth-browser`, `stealth-calculator`, `stealth-calendar`, etc.): exist as routes but not linked from any navigation — dead routes.

**Not started:** Supabase Auth wiring, App Store / Play Store submission config (`eas.json` submit block is empty), iOS Privacy Manifest (required since iOS 17.4), Android permissions declaration, physical device testing, crash reporting.

## Known runtime bug to be careful around

**Stealth mode toggle does not update `appMode` in root layout until cold restart.** Toggle navigates correctly via router, but `EmergencyCallButton` visibility will be incorrect until the next app launch. If you touch stealth toggle or root layout, this is the bug to fix or avoid regressing.

## The Bridge — cross-surface context

Both surfaces use Supabase project `tscvzrxnxadnvgnsdrqx.supabase.co`. Schema is shared at the DB level but auth is fully siloed today (no auth implemented here; web has two competing auth systems). When implementing auth here, target **Supabase Auth v2** — do not introduce anything that would have to be ripped out when the website consolidates onto Supabase Auth. The mobile `panic_events` table needs to sync with the website's `incidents` table; coordinate schema changes with the website repo.

## Conventions

- TypeScript strict — do not loosen it.
- Run `scripts/style-check.sh` before declaring UI work done.
- When wiring a previously-anonymous Supabase write to an authenticated user, also add the corresponding RLS policy in a migration file under `supabase/migrations/`.
- Folder organization is logical and purpose-driven — match existing patterns rather than inventing new top-level folders.

## Where to find more context

- `DESIST-APP.md` — app-level overview
- `PROJECT_STATUS.md` — current state
- `DEVELOPMENT_ROADMAP.md` — what's next
- `COMPREHENSIVE_CODE_REVIEW.md` — full review notes
- `docs/STYLE_GUIDE.md` — mandatory before UI work
- `docs/DEVELOPER_HANDOVER.md` — handover notes

## What NOT to do

- Don't hardcode colors, spacing, or any other design token. Use `constants/theme.ts`.
- Don't use a red background anywhere.
- Don't trust `package.json` versions — check `yarn.lock`.
- Don't add new hardcoded Supabase URLs or API keys to source. Use env.
- Don't write new Supabase JS v1-style calls. Use v2 patterns even if it means migrating the surrounding file.
- Don't introduce NextAuth-style or non-Supabase auth here.
- Don't soften technical debt in commit messages or PR descriptions — call it out directly.
