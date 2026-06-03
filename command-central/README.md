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

- The dashboard starts with a few example lights.
- New lights default to yellow.
- Empty names are rejected.
- Duplicate names are rejected case-insensitively, so `Dinner` and `dinner` are treated as the same light.
- The grid uses 4 columns on wide screens, 3 on tablet-sized screens, and 2 on smaller screens.
- State is currently local to the browser or app session. A real shared household webpage would need a backend or real-time database so everyone sees the same light changes.

## Project notes

This project was created with Expo SDK 56. The app uses Expo Router, React Native, React Native Web, and TypeScript.
