# Worklish

**English practice for professionals.** A web and Android app where you write, speak and hold a
conversation with an AI tutor that corrects grammar, pronunciation and word choice in job-related
contexts.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Functions%20%7C%20Firestore-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285f4?logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

![Worklish landing page](docs/screenshots/landing.png)

## Live demo

https://worklish-app-v2.firebaseapp.com

## What it does

| Feature | Description |
|---|---|
| **Text practice** | Write a work email or message and get corrections with explanations |
| **Voice practice** | Speak an answer, get a transcript, pronunciation feedback and a score |
| **Video call** | Simulated interview or meeting with the AI tutor, turn by turn |
| **How to say** | Look up how a phrase is said in a professional context |
| **Progress** | Practice history and per-skill scores on the dashboard |
| **Subscriptions** | Free tier with limits, paid plans handled through RevenueCat |
| **Android app** | Capacitor build with native text-to-speech and AdMob |

The interface is in Spanish; the practice material is English, aimed at Spanish-speaking
professionals.

## Architecture

```
React 19 SPA ──► Firebase Hosting
      │
      │  fetch + Firebase ID token
      ▼
Cloud Functions (Node.js 22, us-central1)
      ├──► Google Gemini      → corrections, conversation, feedback
      ├──► Cloud Text-to-Speech → narration for listening exercises
      └──► Firestore          → users, practices, subscription state
```

The browser never talks to Gemini directly. Every AI call goes through a Cloud Function that
verifies the Firebase ID token, applies the user's plan limits and keeps the API key on the server.

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Tailwind CSS, shadcn/ui, React Hook Form, Recharts |
| Backend | Firebase Cloud Functions v2 (Node.js 22), Express-style handlers with CORS |
| Database | Firestore with security rules scoped to the document owner |
| Auth | Firebase Authentication — email/password and Google |
| AI | Google Gemini (`@google/generative-ai`), Cloud Text-to-Speech |
| Mobile | Capacitor 8, AdMob, native TTS, signed APK |
| Payments | RevenueCat (`@revenuecat/purchases-capacitor`) |
| Hosting | Firebase Hosting |

## Project structure

```
frontend/                 React application
  src/pages/              Landing, dashboard and the four practice modes
  src/components/         Layout, sidebar and shared UI
  src/contexts/           Auth and language state
  src/lib/                Firebase client, API helpers, speech, ads, purchases
  android/                Capacitor Android project
functions/                Cloud Functions (all AI and data endpoints)
docs/                     Architecture notes and migration guide
firestore.rules           Access rules
firestore.indexes.json    Composite indexes
```

## Getting started

Requirements: Node.js 20+ and a Firebase project with Auth, Firestore and Functions enabled.

```bash
git clone https://github.com/020388jimp-droid/WORKLISHv3.git
cd WORKLISHv3/frontend
npm ci
```

Create `frontend/.env`:

```env
REACT_APP_FUNCTIONS_URL=https://us-central1-worklish-app-v2.cloudfunctions.net
```

The Firebase web configuration is already in `frontend/src/lib/firebase.js`; it is a public
client key and access is controlled by `firestore.rules`.

```bash
npm start        # development server on :3000
npm run build    # production bundle
```

If `npm ci` fails on peer dependency conflicts, use `npm install --legacy-peer-deps`.

### Cloud Functions

```bash
cd functions
npm ci
firebase functions:secrets:set GEMINI_API_KEY   # or a local .env for the emulator
firebase emulators:start --only functions,firestore
```

`GEMINI_API_KEY` is read from the environment at runtime and is never committed.

### Deploy

```bash
firebase deploy --only hosting,functions,firestore:rules
```

For the Android build, see `scripts/Limpiar-caches-android.ps1` for the cache cleanup used before
`npx cap sync android`.

## Security

- `firestore.rules` only lets a user read and write their own documents.
- AI keys live in Cloud Functions environment variables, not in the client bundle.
- `.env`, `*.jks` and `google-services.json` are excluded by `.gitignore`.
- The demo runs on the Firebase Spark/Blaze project `worklish-app-v2`.

## License

MIT — see [LICENSE](LICENSE).
