# bSafe Next.js — UI spec

The original React/Vite UI lives at `C:\Users\Tejas\bsafe\apps\web\src`. Recreate it faithfully
in the Next.js App Router, replacing React Router with `next/navigation` and Firebase auth with
the local cookie session. Do not use `react-router-dom`.

## Routes

| Route | Source of truth | Notes |
| --- | --- | --- |
| `/login` | `pages/LoginPage.tsx` | signin/signup; no Google button, no Firebase notice |
| `/` | `pages/HomePage.tsx` + `components/SosPanel.tsx` | protected, silent SOS |
| `/contacts` | `pages/ContactsPage.tsx` | protected, max 5 |
| `/me` | `pages/ProfilePage.tsx` | protected |
| `/admin` | `pages/admin/AdminDashboard.tsx` | protected + admin only |
| `/track/[token]` | `pages/TrackAlertPage.tsx` | public tokenized tracking |

## Shell

`components/AppLayout.tsx` is the source of truth for the responsive sidebar/mobile nav,
contact counter, user badge, admin link and sign-out. Wrap protected routes in a client
`AppShell` that:
- shows `FullPageLoader` while `useAuth().initializing`;
- redirects to `/login` when there is no user;
- redirects non-admin users away from `/admin`;
- renders `AppLayout`.

## Data layer

- TanStack Query + the shared `apiClient` from `lib/client/api.ts` (axios, baseURL `/api`).
- Query keys can mirror the original: `['profile']`, `['contacts']`, `['alert', id]`,
  `['tracking', token]`, `['admin','alerts',filter]`, `['admin','reports']`.
- Errors: use `errorMessage(error)` from `lib/client/api.ts`.
- Live updates: subscribe with `new EventSource('/api/alerts/:id/stream')` or
  `/api/tracking/:token/stream`; on each `update` event invalidate/refetch the matching query.
  Keep the original polling intervals as a fallback (15s owner, 12s tracking).

## SOS flow (must stay silent)

- Request geolocation during setup via the onboarding card, using the original
  `hooks/useGeolocation.ts` behavior.
- `SosButton`: single tap or 600ms long-press; no sound, no modal, no success animation.
- On trigger: read the latest position, POST `/api/alerts/trigger`, store the alert id in
  `localStorage` under `bsafe.activeAlertId`, then start the 12s location loop posting to
  `/api/alerts/:id/location`.
- While active: dim dial, show `SOS ACTIVE`, location count, and a quiet `Resolve alert` link.
- On resolve: PATCH status `resolved` and clear the active id. If the saved alert 404s, clear it.
- If the user has zero contacts, disable SOS with the original empty-state CTA to `/contacts`.

## Design

Reuse the original "night dispatch" design tokens from `app/globals.css` (already ported):
`bg-night`, `bg-panel`, `border-line`, `text-chalk/mist/faint`, `bg-signal`, fonts
`font-display`/`font-mono`, `animate-rise`/`animate-breathe`/`animate-ping-slow`.
Copy the icon set from `components/icons.tsx`. Keep mobile responsiveness.

## Maps

Use the existing imperative Leaflet implementation (`components/LiveMap.tsx`, OpenStreetMap
tiles, no API key). Load it client-only with `next/dynamic({ ssr: false })`; Leaflet CSS is
already imported in `app/layout.tsx`.

## Auth

Use `useAuth()` from `lib/auth-context.tsx`:
`user`, `initializing`, `signIn(email,password)`, `signUp(name,email,password)`, `signOut()`.
The signup form adds a name field (the original Firebase signup had no name).
