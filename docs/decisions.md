# WildDex decisions

What we have agreed, and why. Update this when a decision changes, so it stays true.

## Product

- **Real-life Pokédex for UK wildlife.** Every species starts as a grey card. Photographing one
  unlocks it.
- **For the owner first**, with firm plans to share with the UK wildlife community. Design for many
  users now (everything is per-user from day one), but do not build social features yet.
- **A photo is required to log a species.** It is the proof of sighting.
- **One dex per user.** The dex name is personalisation only.
- **Configurable dex.** A setup wizard picks regions (England, Scotland, Wales, Northern Ireland,
  or all) and species groups. Hard-to-photograph groups (bats, marine mammals, marine fish) are off
  by default.
- **Changing the dex never loses entries.** Entries belong to species, and the dex is only a filter.
- **Cover photo is chosen by the user** and is part of the MVP.
- **No separate sightings.** An entry holds the original finding (date, location, notes), and
  photos from later sightings are added to it freely.
- **Species scope:** UK residents, breeding species and regular annual migrants, including
  established introduced species. No vagrants, no insects.
- **Species info comes from our own curated dataset**, not fetched live from outside services.

## Technical

- **Next.js + Supabase + Vercel.** Chosen because the product is front-end heavy, the owner knows
  React and Next.js, and a managed backend means no time lost on auth and storage plumbing.
- **Passwordless email sign-in.** Magic link for now (works with Supabase's built-in email sender).
  `/auth/confirm` already accepts both the default `?code=` format and the `?token_hash=` format,
  so moving to emailed codes later needs a template change and a code-entry field, not a rewrite.
- **Rarity is stored per nation** on `species_regions`. For a user, the tiers for the nations they
  selected are averaged and rounded, halves up (rare + common = uncommon, rare + uncommon = rare).
- **Regions are rows, not columns,** so new regions need no schema change.
- **Photos:** resized in the browser before upload (about 2000px plus a 400px thumbnail), uploaded
  straight to a private Supabase bucket under `<user_id>/`. Users never resize anything by hand.
- **Entries and photos change only through database functions** (`log_entry`, `add_entry_photo`,
  `set_cover_photo`, `delete_entry_photo`). Deleting a user's last photo removes the entry.
- **Species data lives in CSV files in this repo** and is loaded by a generated seed script.
- **`profiles` is created when the wizard finishes,** not by a trigger on sign-up. `/dex` sends
  anyone without a profile to `/setup`.
- **The setup wizard (`/setup`) is also the settings screen.** Same three steps (name, groups,
  regions); when a profile exists it opens pre-filled. Counts are worked out in the browser from the
  reference data (`lib/dex.ts`), and saving goes through `save_dex_settings`.

- **The dex grid is filtered in the browser.** The server loads the user's whole dex from the `my_dex`
  view (found or not, with rarity and cover photo) and the page filters it by group, found/to-find and
  search. Fine for hundreds of species; move to paging or an RPC well before 1000 (Supabase's
  per-request row cap).
- **Cards for species not yet found show the name and rarity** on a grey placeholder, so the dex doubles
  as a list of things to look for. A found card shows the user's cover photo, scientific name and a
  tick. (Easy to switch to "???" for unfound cards later if we want more mystery.)
- **Cover photos are shown through signed links** (one hour) because the bucket is private, in a plain
  `<img>` rather than `next/image`.
- **Rarity colours are theme tokens** (`--rarity-*` in `globals.css`, light and dark), not hard-coded
  in components.

## Deliberately later (not MVP)

- Offline logging
- User-added custom species (visible only to that user): "MVP v2"
- GPS and maps, achievements, badges, friends and sharing
- Emailed sign-in codes, which need a custom email sender
- A custom email sender for production (the built-in one is for testing only)

## Open items

- **Delete my account** must also remove the user's photo files from storage (database rows cascade,
  files do not). Needed before other people use the app.
- **Species data is a first-draft starter set** (62 species) and needs checking against
  authoritative sources before it is trusted. See `data/README.md`.
- **Conservation status** is not in the data yet and needs proper sourcing.
- **PWA basics** (manifest, icons, installability) are not built yet.
