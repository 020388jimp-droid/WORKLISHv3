# Architecture

Worklish is a single-page React app backed by Firebase. There is no custom server: the only
server-side code is a set of Cloud Functions.

## Request flow

A practice request looks like this:

1. The React app reads the signed-in user from `AuthContext`.
2. It calls a Cloud Function with `Authorization: Bearer <Firebase ID token>`.
3. The function verifies the token with the Admin SDK, loads the user document and checks the plan
   quota for the day.
4. It calls Gemini with a prompt built from the practice type and the user's level.
5. The answer is validated, stored in `practices/{id}` and returned to the browser.

If the token is missing or invalid the function returns `401`. If the quota is exhausted it returns
`429` with the reset time.

## Functions

| Function | Purpose |
|---|---|
| `health` | Uptime probe, returns build info |
| `practiceText` | Corrects a written answer and scores it |
| `practiceVoice` | Transcribes a recorded answer, scores pronunciation and grammar |
| `videoCall` | Keeps the conversation with the tutor, turn by turn |
| `howToSay` | Suggests how to express a phrase in a professional register |
| `generateSpeech` | Turns a text into audio with Cloud Text-to-Speech |
| `getUserProfile` / `updateUserProfile` | Profile and level |
| `getPracticeHistory` | Paginated history for the dashboard |
| `updateSubscription` | Syncs RevenueCat entitlement into Firestore |
| `getPublicStats` | Public counters shown on the landing page |

All functions run in `us-central1` on Node.js 22, with `maxInstances` capped to control cost.

## Data model

```
users/{uid}
  name, email, level, nativeLanguage
  plan: { tier, status, renewsAt }
  stats: { totalPractices, streak, averageScore }
  usage: { date, practicesToday }

practices/{practiceId}
  userId, type (text | voice | video | howToSay)
  prompt, answer, score, feedback, createdAt
```

`practices` is queried by `userId` plus `createdAt`, which is why the composite index exists in
`firestore.indexes.json`.

## Security model

- Firestore rules compare `request.auth.uid` with the document owner on every read and write.
- The Gemini key exists only as a Cloud Functions environment variable.
- The Firebase web API key in `src/lib/firebase.js` is a public identifier, not a secret; it is
  restricted by the rules above and by the API key restrictions in Google Cloud.
- Subscription state is written only by `updateSubscription`, never by the client.

## Mobile

The Android app is a Capacitor wrapper around the same bundle. Only three things are native: Google
sign-in, text-to-speech and AdMob. Everything else goes through the same Cloud Functions, so there
is a single backend to maintain.
