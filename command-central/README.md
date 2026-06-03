# Command Central

Command Central is an Expo React Native status-light dashboard for web and iOS. It lets someone add named lights, then switch each light between red, yellow, and green so a shared screen can show whether something is stopped, waiting, or ready.

## Run the app

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm run start
```

Run directly on web:

```bash
npm run web
```

Run directly on the iOS simulator:

```bash
npm run ios
```

## Supabase setup

The app reads and writes lights through Supabase when these Expo public variables are set:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

Use separate Supabase projects or a production project plus a development branch:

- Development values belong in `.env.local` while you are building locally.
- Production values should be supplied by your production build/deploy environment.
- `.env.development.example` and `.env.production.example` show the shape for each database.

For local development, copy the development example and fill it with the dev project URL and publishable key:

```bash
cp .env.development.example .env.local
```

For a production web export or app build, make sure `.env.local` or your build environment contains the production URL and publishable key before running:

```bash
npm run web
./script/build_and_run.sh --export-web
```

The database schema is in:

```bash
supabase/migrations/20260603000000_create_lights.sql
```

That migration creates `public.lights`, enables row level security, grants `anon` and `authenticated` access for this no-login shared board, seeds the starter lights, and registers the table for Supabase Realtime.

From this workspace, the Codex app also has these actions wired:

```bash
./script/build_and_run.sh
./script/build_and_run.sh --web
./script/build_and_run.sh --ios
```

## How the lights work

Think of the board like a row of labeled porch lights. The label says what the light is about, and the color gives everyone the current signal:

- Red means stop or unavailable.
- Yellow means wait or in progress.
- Green means go or ready.

Adding a light puts a new labeled signal at the front of the board. Changing a color updates only that one light, the same way flipping one switch on a panel should not change the rest.

## Current behavior

- The dashboard starts with a few example lights when Supabase is not configured.
- When Supabase is configured, the dashboard loads lights from `public.lights`.
- New lights default to yellow.
- Empty names are rejected.
- Duplicate names are rejected case-insensitively, so `Dinner` and `dinner` are treated as the same light.
- The grid uses 4 columns on wide screens, 3 on tablet-sized screens, and 2 on smaller screens.
- State is shared through Supabase and refreshes through Realtime when another screen changes a light.

## Project notes

This project was created with Expo SDK 56. The app uses Expo Router, React Native, React Native Web, and TypeScript.
