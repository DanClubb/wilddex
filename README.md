# WildDex

A real-life Pokédex for UK wildlife. Choose which regions and species groups you care about,
photograph what you find, and watch the grey cards fill in.

Mobile-first web app, installable to the home screen (PWA). Built for one user first, with the
UK wildlife community in mind.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui primitives
- **Supabase**: Postgres, Auth (email and password), Storage (private photo bucket)
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

In the Supabase dashboard:

| Where                                            | Setting                 | Value                                                                                                                                                    |
| ------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication → Sign In / Providers → Email** | Confirm email           | **Off** while it is just you (sign-up then signs in straight away, and no email is sent). Turn it on before inviting others, once custom SMTP is set up. |
| Same page                                        | Minimum password length | `8` (the sign-up form assumes this; see `lib/auth.ts`)                                                                                                   |
| **Authentication → URL Configuration**           | Site URL                | `http://localhost:3000` (your live URL in production)                                                                                                    |
| Same page                                        | Redirect URLs           | `http://localhost:3000/**` (add your live URL with `/**` too)                                                                                            |

The URL settings only matter for emailed links (confirming an email address, and later password
reset); `/auth/confirm` handles them. Supabase's built-in email sender is for testing only and allows
just a handful of emails per hour, which is why sign-in does not depend on email.

### Setting up a fresh Supabase project

1. Run `db/schema.sql` in the SQL editor (tables, security rules, functions, photo bucket).
2. Generate and run the seed: `node scripts/build-data.mjs`, then run `db/seed.sql`.

## Project layout

| Path                                   | What it is                                                                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                                 | Routes: landing, `/login`, `/setup` (dex wizard), `/dex`, `/dex/[slug]` (species page and photo logging), `/auth/confirm`, `/auth/signout`; `manifest.ts` and `apple-icon.png` make it installable |
| `components/dex/`                      | The dex grid, species card, rarity circles and the photo uploader                                                                                                                                  |
| `lib/auth.ts`                          | Password length rules shared by the sign-up form and its server action                                                                                                                             |
| `lib/dex.ts`                           | Pure helpers for dex counts, filtering and progress                                                                                                                                                |
| `lib/images.ts`, `lib/photo-upload.ts` | Browser-side photo resizing, and uploading photos then recording the sighting                                                                                                                      |
| `lib/supabase/`                        | Browser and server Supabase clients; session refresh used by `proxy.ts`                                                                                                                            |
| `proxy.ts`                             | Refreshes the session on every request and redirects signed-out visitors to `/login`                                                                                                               |
| `types/database.types.ts`              | Generated from the database schema                                                                                                                                                                 |
| `db/schema.sql`                        | Source of truth for the database structure                                                                                                                                                         |
| `data/`                                | Species dataset as CSV files (see `data/README.md`)                                                                                                                                                |
| `scripts/build-data.mjs`               | Validates the CSVs and generates `db/seed.sql`                                                                                                                                                     |
| `docs/decisions.md`                    | What we decided and why, plus what is deliberately left for later                                                                                                                                  |

## Data model in one paragraph

Reference data (`groups`, `regions`, `species`, `species_regions`) is curated here and readable by
everyone. User data (`profiles`, dex settings, `entries`, `entry_photos`) is private to its owner
through row-level security. An entry is "this user has found this species" and needs a photo.
Entries belong to the species, not the dex settings, so changing regions or groups never deletes
anything. Entries and photos are only changed through database functions that enforce the rules.

## Scripts

| Command                       | Does                                               |
| ----------------------------- | -------------------------------------------------- |
| `npm run dev`                 | Dev server                                         |
| `npm run build`               | Production build                                   |
| `npm run lint`                | ESLint                                             |
| `node scripts/build-data.mjs` | Validate species data and regenerate `db/seed.sql` |
