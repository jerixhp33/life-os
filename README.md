# LifeOS — One App. Your Whole Life.

A complete, production-ready cross-platform personal life assistant for Android and iOS, built with React Native, Expo, TypeScript, and Supabase.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Running the App](#running-the-app)
7. [Running Tests](#running-tests)
8. [Project Structure](#project-structure)
9. [Build & Release](#build--release)
10. [AI Assistant Setup](#ai-assistant-setup)
11. [What's Implemented vs Stubbed](#whats-implemented-vs-stubbed)
12. [Troubleshooting](#troubleshooting)

---

## Features

| Module | Status |
|---|---|
| Authentication (sign up / sign in / reset / delete) | ✅ Complete |
| Home dashboard (today's tasks, upcoming events, quick actions) | ✅ Complete |
| Task management (create, complete, delete, priorities, reminders) | ✅ Complete |
| Notes (create, edit, search, checklist/text/markdown, favorites) | ✅ Complete |
| Calendar (month view, event display) | ✅ Complete |
| Habits (daily/weekly, completion tracking, streaks) | ✅ Complete |
| Goals (create, progress, milestones, categories) | ✅ Complete |
| Finance (transactions, budgets, savings goals, charts) | ✅ Complete |
| AI assistant (server-side, rate-limited, action confirmation) | ✅ Complete |
| Settings (profile, theme, notifications, account deletion) | ✅ Complete |
| Offline queue (SQLite-backed pending operations) | ✅ Complete |
| Local notifications (task/event/habit reminders) | ✅ Complete |
| Database schema + RLS policies | ✅ Complete |
| Supabase Edge Functions (AI + data export) | ✅ Complete |
| Documents screen | 🔧 Stubbed |
| Workspaces / collaboration | 🔧 Stubbed |
| Task detail / edit screen | 🔧 Stubbed |
| Calendar event creation form | 🔧 Stubbed |
| Habit / goal creation forms | 🔧 Stubbed |
| Finance transaction form | 🔧 Stubbed |

---

## Tech Stack

- **React Native 0.88 + Expo 58** — Cross-platform iOS and Android
- **Expo Router 5** — File-based navigation
- **TypeScript** (strict mode) — Type safety throughout
- **Supabase** — Auth, PostgreSQL, Storage, Edge Functions, Row Level Security
- **TanStack Query** — Server state, caching, optimistic updates
- **Zustand** — Auth and minimal global client state
- **React Hook Form + Zod** — Validated forms with schema-first types
- **React Native Reanimated** — Smooth, UI-thread animations
- **date-fns** — Timezone-safe date arithmetic
- **Expo Notifications** — Scheduled local push notifications
- **EAS Build** — Managed Android (APK/AAB) and iOS builds

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- A [Supabase](https://supabase.com) project (free tier works)
- A Google Gemini API key (optional — only needed for AI features)

### 1. Clone and install

```bash
git clone <your-repo-url> lifeos
cd lifeos
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key
```

### 3. Set up the database

```bash
# Using Supabase CLI (recommended)
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push

# Or paste the SQL files manually in the Supabase Dashboard SQL editor:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
# 3. supabase/migrations/003_storage_policies.sql
```

### 4. Run

```bash
npm start
# Then press 'a' for Android or 'i' for iOS
```

---

## Environment Variables

| Variable | Where | Required |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env.local` | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function secrets | Yes (for server functions) |
| `GEMINI_API_KEY` | Supabase Edge Function secrets | Only for AI features |

> **Security**: `EXPO_PUBLIC_*` variables are bundled into the app. They must be the **anon** key only. The service role key and AI provider key **must never** appear in the mobile bundle — they live only in the Supabase Edge Function environment.

To set Edge Function secrets:
```bash
npx supabase secrets set GEMINI_API_KEY=your-gemini-key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Database Setup

The three migrations in `supabase/migrations/` set up:

- **001_initial_schema.sql** — All tables: profiles, tasks, task_subtasks, events, note_folders, notes, habits, habit_logs, goals, goal_milestones, transactions, budgets, savings_goals, documents, workspaces, workspace_members, workspace_invitations, ai_usage, reminders. Includes foreign keys, indexes, constraints, and an `updated_at` trigger on every table.

- **002_rls_policies.sql** — Row Level Security on every user-facing table. Users can only read and write their own data. Workspace data requires verified membership checked at the database level — never trusting client-supplied role claims.

- **003_storage_policies.sql** — Private `documents` bucket. Users can only access files under their own `{user_id}/` path prefix. No public access.

**Testing RLS** (run in Supabase SQL editor):
```sql
-- Should return 0 rows when logged in as user B trying to read user A's tasks
SELECT * FROM public.tasks WHERE user_id = '<user_a_id>';
```

---

## Running the App

```bash
# Start Metro bundler
npm start

# Run on specific platform
npm run android   # Requires Android emulator or device
npm run ios       # Requires macOS + Xcode or iOS Simulator

# Web (limited feature support — no SecureStore, no native notifications)
npm run web
```

### First launch

1. The app opens the Welcome screen.
2. Tap **Get started** to create an account.
3. Enter name, email, and a password (8+ characters, 1 uppercase, 1 number).
4. After signup you're taken directly to the Home dashboard.
5. Create your first task via the **+** tab.

---

## Running Tests

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# CI mode (no watch, exits with code)
npm run test:ci
```

The 36 unit tests cover:

- **Finance logic** — `buildSpendingSummary` (5 tests), `formatCurrency` (4 tests)
- **Habit logic** — `calculateStreak` (6 tests), `calculateCompletionRate` (3 tests)
- **Validation schemas** — sign-up, tasks, transactions, events, goals (18 tests)

Tests use a plain Jest config (no jest-expo preset) with mocks for all native modules, so they run in the cloud environment without a device.

---

## Project Structure

```
lifeos/
├── app/                      # Expo Router screens
│   ├── (auth)/               # Welcome, signup, login, forgot-password
│   ├── (tabs)/               # Home, Calendar, Create, Goals, More
│   ├── tasks/                # Task list, new task, [id] detail
│   ├── notes/                # Notes list, editor, [id]
│   ├── calendar/             # Event screens
│   ├── goals/                # Goals screens
│   ├── habits/               # Habits screens
│   ├── finance/              # Finance screens
│   ├── ai/                   # AI chat
│   ├── documents/            # Documents screens
│   ├── workspaces/           # Collaboration screens
│   └── settings/             # Profile & settings
│
├── src/
│   ├── components/
│   │   ├── ui/               # Button, Card, Input (reusable primitives)
│   │   ├── feedback/         # Spinner, Skeleton, EmptyState, ErrorState
│   │   └── layout/           # ScreenLayout (safe area + header)
│   ├── features/
│   │   ├── tasks/            # api.ts (Supabase calls) + hooks.ts (TanStack Query)
│   │   ├── notes/            # api.ts + hooks.ts
│   │   ├── calendar/         # api.ts + hooks.ts
│   │   ├── habits/           # api.ts + logic.ts (pure, testable) + hooks.ts
│   │   ├── goals/            # api.ts + hooks.ts
│   │   ├── finance/          # api.ts + logic.ts (pure, testable)
│   │   ├── ai/               # api.ts (server-side call via Edge Function)
│   │   ├── workspaces/       # api.ts
│   │   └── documents/        # api.ts
│   ├── lib/
│   │   ├── supabase/         # client.ts (SecureStore session storage)
│   │   ├── validation/       # schemas.ts (all Zod schemas)
│   │   ├── notifications/    # service.ts (schedule/cancel local notifications)
│   │   └── offline/          # queue.ts (SQLite pending operations)
│   ├── stores/
│   │   └── authStore.ts      # Zustand: session, profile, sign-in/out
│   ├── theme/
│   │   ├── tokens.ts         # Colors, spacing, typography, shadows
│   │   └── ThemeContext.tsx  # Light/dark mode provider + hook
│   └── types/
│       └── index.ts          # All shared TypeScript interfaces
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_storage_policies.sql
│   └── functions/
│       ├── ai-assistant/     # Deno: Anthropic call, rate-limiting, usage tracking
│       └── export-data/      # Deno: full user data JSON export
│
├── tests/
│   ├── unit/                 # 36 pure-logic unit tests
│   └── __mocks__/            # Native module mocks (SecureStore, Notifications, etc.)
│
├── app.json                  # Expo config (icons, permissions, plugins)
├── eas.json                  # EAS Build profiles (dev / preview / production)
├── babel.config.js
├── jest.config.js
├── tsconfig.json             # Strict TypeScript
└── .env.example
```

---

## Build & Release

### Development build (device testing)

```bash
# Android APK — install directly on device
eas build --platform android --profile development

# iOS — run on simulator or TestFlight
eas build --platform ios --profile development
```

### Preview build (internal distribution)

```bash
eas build --platform all --profile preview
```

### Production build (app store)

```bash
# Requires Apple Developer account + Google Play Console
eas build --platform android --profile production  # → AAB for Play Store
eas build --platform ios     --profile production  # → IPA for App Store

# Submit
eas submit --platform android
eas submit --platform ios
```

### Before submitting to stores

- [ ] Replace `YOUR_EAS_PROJECT_ID` in `app.json`
- [ ] Add real app icons to `assets/icons/` (1024×1024 for iOS, adaptive for Android)
- [ ] Add splash screen image to `assets/icons/splash.png`
- [ ] Fill in Apple ID details in `eas.json`
- [ ] Add `google-service-account.json` for Android submissions
- [ ] Write Privacy Policy (required by both stores — you log no content by default)
- [ ] Review all Android permissions in `app.json` for necessity

---

## AI Assistant Setup

The AI assistant uses Google Gemini (Gemini 2.5 Flash) via a Supabase Edge Function. The API key **never** leaves the server.

1. Get a [Gemini API key](https://aistudio.google.com)
2. Set it as a Supabase secret:
   ```bash
   npx supabase secrets set GEMINI_API_KEY=your-gemini-key
   ```
3. Deploy the Edge Functions:
   ```bash
   npx supabase functions deploy ai-assistant
   npx supabase functions deploy export-data
   ```
4. The AI tab in the app will now work. Without the key it shows a clear "not configured" message — no fake responses.

**Rate limiting**: Each user is limited to 50,000 output tokens per day (configurable in `supabase/functions/ai-assistant/index.ts`).

**What context is sent**: Only summary counts (pending task count, overdue count) are sent — never raw note content, financial data, or personal identifiers beyond the user's first name.

---

## What's Implemented vs Stubbed

### Fully implemented (end-to-end)
- Authentication: sign up, sign in, sign out, password reset, account deletion
- Home dashboard with real data
- Task list with filtering, search, optimistic complete, delete
- Task creation form (title, priority, due date, reminder, category)
- Notes list with search, favorites toggle, delete
- Note editor (text / checklist / markdown modes)
- Calendar month view with event dots and day detail
- Habits list with today's log tracking and streak display
- Goals list with progress bars and milestone counts
- Finance overview: monthly transactions, budget bars, savings progress
- AI chat with real Supabase Edge Function call
- Profile settings: name, theme toggle, notification switch, sign out, account deletion
- All Supabase queries with RLS enforced at database level
- Offline queue infrastructure (SQLite)
- Local notification scheduling for tasks, events, habits

### Stubbed (shows "Coming soon" placeholder)
These screens have correct routes and navigation wired but no form/data yet:

- Task detail / edit (`/tasks/[id]`)
- Note detail view (`/notes/[id]`)
- Calendar event creation form (`/calendar/new`)
- Calendar event detail (`/calendar/[id]`)
- Goal creation form (`/goals/new`)
- Goal detail / milestone editing (`/goals/[id]`)
- Habit creation form (`/habits/new`)
- Habit detail / history (`/habits/[id]`)
- Transaction creation form (`/finance/new`)
- Documents upload and viewer (`/documents/*`)
- Workspaces and collaboration (`/workspaces/*`)

The API layer, Supabase queries, TanStack Query hooks, and Zod validation schemas for every stubbed screen are **complete** — connecting the form UI is the remaining work.

---

## Troubleshooting

**"Supabase credentials not set" warning**
Copy `.env.example` to `.env.local` and fill in your project URL and anon key. For Expo Go, restart the Metro bundler after adding the file.

**Notifications not appearing**
iOS requires explicit permission — the app requests it on the first scheduled reminder. Android 13+ also requires `POST_NOTIFICATIONS` permission. Check device Settings → Notifications → LifeOS.

**"AI assistant is not configured"**
The Edge Function needs `GEMINI_API_KEY`. See [AI Assistant Setup](#ai-assistant-setup). Without it the app continues to work normally — AI is not required for any core feature.

**TypeScript errors after `npm install`**
Run `npm install --legacy-peer-deps`. Expo 58 / React 19 has some peer dependency mismatches that are safe to bypass.

**Tests fail with "Cannot find module"**
Make sure `babel.config.js` exists at the project root and `babel-preset-expo` is installed as a dev dependency.

**Metro bundler can't resolve a module**
Clear the cache: `npx expo start --clear`

**RLS blocking your own data**
Check that `auth.uid()` matches the `user_id` column. In the Supabase dashboard, go to Authentication → Users to verify the user exists, and Table Editor to check the row's `user_id`.

---

## Security Notes

- Session tokens are stored in `expo-secure-store` (iOS Keychain / Android Keystore), not AsyncStorage.
- The service role key and AI provider key are never in the mobile bundle.
- RLS is enforced at the database level — changing a record ID in a client request cannot access another user's data.
- Document files are stored in a private bucket with per-user path scoping.
- All form inputs are validated with Zod on the client and checked by database constraints.
- AI actions always require explicit user confirmation before executing.
- No analytics beyond what Supabase logs by default.

---

*LifeOS v1.0.0 — Built with React Native, Expo, TypeScript, Supabase*
