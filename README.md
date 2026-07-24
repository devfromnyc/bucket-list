# bucketlist.ai

Personal bucket-list app for places and things to do. Built with Next.js, Tailwind, Neon Postgres + Drizzle, and Gemini.

## Features

- Email/password user accounts (passwords hashed in Neon)
- Password reset via email (Resend)
- Places + **events** + **stays** (hotels, Airbnb, rentals, hostels) — scoped per user
- **Trips**: multi-day plans combining places, events, and stays (manual + AI draft)
- Categories for places, events, and stays; heart favorites; mark done / attended / stayed
- City filter + mile radius
- Account settings / preferences (bio, interests, home city, defaults for AI)
- AI research for places, events, and stays → confirm → save card
- **Plan my day**: mood + criteria → timed itinerary (one day, ephemeral)
- Separate AI ideas chat with “add to list” shortcuts

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Neon database

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string into `.env.local` as `DATABASE_URL`
3. Push the schema:

```bash
npm run db:push
```

If you already pushed an earlier schema, run `db:push` again so new columns/tables (`events`, `stays`, `trips`, `trip_stops`, `profiles`, geo fields, favorites) are added.

### 3. Auth + Gemini + email

Set in `.env.local`:

- `AUTH_SECRET` — any long random string (cookie signing)
- `APP_URL` — your site URL for reset links (e.g. `http://localhost:3000` or your Vercel URL)
- `RESEND_API_KEY` — from [Resend](https://resend.com) (password reset emails)
- `EMAIL_FROM` — verified sender, e.g. `bucketlist.ai <noreply@yourdomain.com>` (optional in local; Resend’s onboarding address works for testing)
- `GOOGLE_GENERATIVE_AI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)

Users create their own email/password on `/signup` (stored hashed in Neon). Without `RESEND_API_KEY`, reset links are logged to the server console for local testing.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then **Sign up** with your email and password to reach `/board`.

## Deploy on Vercel

1. Push this repo and import it in Vercel
2. Add env vars (`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_GENERATIVE_AI_API_KEY`)
3. Deploy — you’ll get a `*.vercel.app` URL with persistent Neon data

Run `npm run db:push` once against the same Neon DB (locally with `.env.local`) before or after the first deploy so tables exist.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run db:push` | Sync Drizzle schema to Neon |
| `npm run db:studio` | Open Drizzle Studio |
