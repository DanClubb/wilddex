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
- **Email and password sign-in** (Supabase Auth stores and hashes the passwords; WildDex never
  stores them). Passwordless was tried first and dropped: magic links cannot sign in an installed PWA
  (the app and the browser keep separate storage), and the emailed-code fix needs custom SMTP because
  Supabase's built-in sender is capped at a few emails an hour. "Confirm email" is off for now so
  sign-up sends no email (if it is left on, sign-up fails with `over_email_send_rate_limit` after a couple of
  emails an hour). `/auth/confirm` stays for confirmation links when that is turned on.
- **Google sign-in is the planned next addition**, so nobody has to make a password. It needs a Google
  Cloud OAuth client; to be added as its own change once that exists.
- **Installable PWA without a service worker.** `app/manifest.ts` plus icons is enough for "Add to
  Home Screen". The manifest is excluded from the sign-in redirect in `proxy.ts`, because browsers
  fetch it without a session. The icon is a placeholder to replace with real artwork.
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
- **Cards for species not yet found show the name and rarity** on a grey placeholder with an animal icon
  for the species group (`components/dex/group-icon.tsx`), so the dex doubles as a list of things to
  look for. A found card shows the user's cover photo, scientific name and a tick.
- **Rarity is four circles**, filled one (common) to four (legendary), in the tier's colour (grey, blue,
  purple, gold) with the tier name beside them. No background behind them.
- **Dex page actions** (edit settings, sign out) sit in a nav row above the dex. (Easy to switch to "???" for unfound cards later if we want more mystery.)
- **Cover photos are shown through signed links** (one hour) because the bucket is private, in a plain
  `<img>` rather than `next/image`.
- **Rarity colours are theme tokens** (`--rarity-*` in `globals.css`, light and dark), not hard-coded
  in components.
- **Photos are resized in the browser** before upload (2000px full, 400px thumbnail, JPEG), so the
  10 MB cap is never a problem for users. Re-encoding through a canvas also strips EXIF, so the GPS
  location in a phone photo never leaves the device.
- **Species info is revealed by finding the species.** The summary shows once found; "where to look"
  (habitat, best time) is always visible as a hunting hint.
- **Species pages** live at `/dex/<slug>`. A species outside the user's dex that they've never found
  is a 404; one they've found that has since left their dex still shows, with a note.
- **Logging a sighting = first photo (required) + optional date, place and notes.** Later visits add
  photos only. Photos upload straight from the browser to storage, then a database function records them.

## Deliberately later (not MVP)

- Offline logging
- User-added custom species (visible only to that user): "MVP v2"
- GPS and maps, achievements, badges, friends and sharing
- A custom email sender (SMTP) before turning on email confirmation or adding password reset

## Open items

- **Photo management** (change cover, delete photos, edit notes and date) has database support but no
  screens yet; it is the next step.

- **Delete my account** must also remove the user's photo files from storage (database rows cascade,
  files do not). Needed before other people use the app.
- **Species data is a first-draft starter set** (62 species) and needs checking against
  authoritative sources before it is trusted. See `data/README.md`.
- **Conservation status** is not in the data yet and needs proper sourcing.
- **Password reset** ('forgot password') is not built; it needs working email, so it comes with custom SMTP.
- **Service worker** (offline shell, caching) is not built; installing works without it.
