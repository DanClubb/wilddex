# WildDex

A real-life Pokédex for UK wildlife. Choose which regions and species groups you care about,
photograph what you find, and watch the grey cards fill in.

Mobile-first web app, installable to the home screen (PWA). Built for one user first, with the
UK wildlife community in mind.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui primitives
- **Supabase**: Postgres, Auth (passwordless email), Storage (private photo bucket)
- **Vercel** for hosting (planned)

> Next.js 16 differs from older versions (for example `proxy.ts` replaces `middleware.ts`).
> Read the bundled docs in `node_modules/next/dist/docs/` before changing framework-level code.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Supabase settings that must match

In the Supabase dashboard, **Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| Site URL | `http://localhost:3000` (your live URL in production) |
| Redirect URLs | `http://localhost:3000/**` (add your live URL with `/**` too) |

Sign-in emails link back to `/auth/confirm`, which must be on the allow-list. Open the link in the
**same browser** you requested it from.

### Email codes (needed for the installed app)

When WildDex is installed on a phone's home screen, the installed app and the browser keep separate
storage, so a link opened from the email app can't sign the installed app in. The login page
therefore asks for a **code** typed into the app. The code only appears in the email once the
template includes it, and Supabase only lets you edit templates after you set up **custom SMTP**
(**Authentication → Emails → SMTP settings**).

Then edit the **Magic Link** template (**Authentication → Emails → Templates**):

```html
<h2>Your WildDex sign-in code</h2>
<p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
<p>On a computer? <a href="{{ .ConfirmationURL }}">Sign in with a link instead</a>.</p>
```

Until then, sign-in works with the link in a normal browser, but not in the installed app.

### Setting up a fresh Supabase project

1. Run `db/schema.sql` in the SQL editor (tables, security rules, functions, photo bucket).
2. Generate and run the seed: `node scripts/build-data.mjs`, then run `db/seed.sql`.

## Project layout

| Path | What it is |
|---|---|
| `app/` | Routes: landing, `/login`, `/setup` (dex wizard), `/dex`, `/auth/confirm`, `/auth/signout`; `manifest.ts` and `apple-icon.png` make it installable |
| `lib/supabase/` | Browser and server Supabase clients; session refresh used by `proxy.ts` |
| `proxy.ts` | Refreshes the session on every request and redirects signed-out visitors to `/login` |
| `types/database.types.ts` | Generated from the database schema |
| `db/schema.sql` | Source of truth for the database structure |
| `data/` | Species dataset as CSV files (see `data/README.md`) |
| `scripts/build-data.mjs` | Validates the CSVs and generates `db/seed.sql` |
| `docs/decisions.md` | What we decided and why, plus what is deliberately left for later |

## Data model in one paragraph

Reference data (`groups`, `regions`, `species`, `species_regions`) is curated here and readable by
everyone. User data (`profiles`, dex settings, `entries`, `entry_photos`) is private to its owner
through row-level security. An entry is "this user has found this species" and needs a photo.
Entries belong to the species, not the dex settings, so changing regions or groups never deletes
anything. Entries and photos are only changed through database functions that enforce the rules.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `node scripts/build-data.mjs` | Validate species data and regenerate `db/seed.sql` |
