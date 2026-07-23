# bucketlist.ai

Personal bucket-list app for places and things to do. Built with Next.js, Tailwind, Neon Postgres + Drizzle, and Gemini.

## Features

- Password-protected personal board (card layout)
- Places + **events** (concerts, community, free public, festivals, sports)
- Categories for places and events; heart favorites; mark done / attended
- City filter + mile radius
- Account settings / preferences (bio, home city, defaults for AI)
- AI research for places and events → confirm → save card
- **Plan my day**: mood + criteria → timed itinerary
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

If you already pushed an earlier schema, run `db:push` again so new columns/tables (`events`, `profiles`, geo fields, favorites) are added.

### 3. Auth + Gemini

Set in `.env.local`:

- `APP_PASSWORD` — the password you’ll use to log in
- `AUTH_SECRET` — any long random string (cookie signing)
- `GOOGLE_GENERATIVE_AI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then **Sign up** / **Log in** with `APP_PASSWORD` to reach the board at `/board`.

## Deploy on Vercel

1. Push this repo and import it in Vercel
2. Add the same env vars (`DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`, `GOOGLE_GENERATIVE_AI_API_KEY`)
3. Deploy — you’ll get a `*.vercel.app` URL with persistent Neon data

Run `npm run db:push` once against the same Neon DB (locally with `.env.local`) before or after the first deploy so the `places` table exists.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run db:push` | Sync Drizzle schema to Neon |
| `npm run db:studio` | Open Drizzle Studio |
