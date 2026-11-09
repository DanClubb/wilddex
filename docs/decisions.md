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
- **Logging happens in a modal on the dex grid.** Tapping a species still to find opens it at
  `/dex?log=<slug>` (shareable; back/Escape close it). It uses the browser History API rather than
  an intercepting route: simpler, no extra request to open, and the grid keeps its filters and scroll.
  Once logged, it navigates to `/dex/<slug>` and the first photo morphs into the species page's photo
  (React `ViewTransition`). Found species skip the modal and go straight to their page.
- **The species page also has a log/add-photos modal** (for adding more photos later).
- **Logging happens in a modal** on the species page, so you never leave it. Photos show in a swipeable
  carousel. The date uses the shadcn calendar and the save progress uses the shadcn spinner.
- **UI components are the official shadcn (radix-luma) ones**, added locally with `npx shadcn add`
  (the build sandbox can't reach the shadcn registry). They import `cn` from the `cn` package, which is
  shadcn's own. `components/ui` is generated code: lint rules that fight it are relaxed in `eslint.config.mjs`.
  Hand-made exceptions: `input.tsx` (16px text so iOS doesn't zoom) and `date-picker.tsx` (shadcn's
  popover + calendar recipe).
- **Photo management on the species page:** each photo has a menu (set as cover, delete with a
  confirmation) and the sighting card has Edit (date, place, notes). Deleting the last photo removes the
  species from the collection (the database does this), so the confirmation warns about it. Changes
  show toasts (sonner).
- **Log modal shows the species' hunting clues** (habitat, best time) beside "?" icons.
- **No loading skeleton on `/dex/[slug]` on purpose:** a loading boundary there would stop the photo
  morph from pairing with the modal's preview.
- **Logging a sighting = first photo (required) + optional date, place and notes.** Later visits add
  photos only. Photos upload straight from the browser to storage, then a database function records them.

- **Navigation always gives feedback.** Tapping a found card dims it with a spinner, and the Back and
  Edit-settings links swap their icon for a spinner, using Next's `useLinkStatus`. (Not a full-page
  loading screen: that would stop the photo morph from pairing.)
- **The species page makes one database call** (`species_page()`, a function returning species, rarity,
  entry and photos together) instead of four in a row. The page and its title share the result.
- **Vercel runs in London (`vercel.json`, `lhr1`)** to sit next to the Supabase project (eu-west-2). Every
  database call is a round trip, so distance between the two is paid on each one.
- **Light / dark / system theme** (`next-themes`): a sun/moon menu on the dex and species pages. It
  defaults to following the device, remembers the choice in the browser, and sets the `dark` class before
  first paint so there's no flash. The choice is per device, not stored on the account.

- **Sharing is a revocable, view-only link** (`/s/<random token>`), created from the share button in
  the dex nav. No sign-in for visitors. They can browse the dex and open species you've found (unfound
  species show as names only, not links) and see photos. Notes and place text are hidden unless the
  owner picks "Photos + notes & places". Turning sharing off kills the link at once; turning it on again
  makes a new one. Shared pages are `noindex` and send no Referer.
- **How sharing stays safe:** visitors never touch tables. They call two `security definer` functions
  (`shared_dex`, `shared_species`) that answer only for a valid token. Photos are in the private bucket;
  a storage policy lets a visitor's server request sign links only for photos of a shared dex (file names
  are random UUIDs). Tokens are made by `set_sharing()`, never by the client. Supabase's linter flags
  these functions as "anon can execute a security definer function": that is intended here.

## Deliberately later (not MVP)

- Offline logging
- User-added custom species (visible only to that user): "MVP v2"
- GPS and maps, achievements, badges, friends (sharing a read-only link is done)
- A custom email sender (SMTP) before turning on email confirmation or adding password reset

## Open items

- **Delete my account** must also remove the user's photo files from storage (database rows cascade,
  files do not). Needed before other people use the app.
- **Species data is a first-draft starter set** (118 species) and needs checking against
  authoritative sources before it is trusted. See `data/README.md`.
- **Conservation status** is not in the data yet and needs proper sourcing.
- **Password reset** ('forgot password') is not built; it needs working email, so it comes with custom SMTP.
- **Service worker** (offline shell, caching) is not built; installing works without it.
