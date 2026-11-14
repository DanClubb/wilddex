# WildDex species dataset

The CSV files in this folder are the **source of truth** for species data. The database is
derived from them: `scripts/build-data.mjs` validates the CSVs and generates `db/seed.sql`,
which you run against Supabase. Edit the CSVs in a spreadsheet or text editor, never the
generated seed file.

```
node scripts/build-data.mjs      # validate, then write db/seed.sql
```

The script prints every problem with a file name and line number, and writes nothing if
there are any errors. Re-running the seed is safe: rows are matched on `slug` and updated.

## Files

| File | One row per | Notes |
|---|---|---|
| `groups.csv` | species group | `default_selected` = ticked by default in the wizard |
| `regions.csv` | region | Currently the four nations. A new region needs a new `rarity_<slug>` column in `species.csv` |
| `species.csv` | species | See below |

## species.csv columns

| Column | Required | Meaning |
|---|---|---|
| `slug` | yes | Stable ID, lowercase-with-hyphens. **Never change it once the app is live**; it is the key the seed matches on |
| `common_name` | yes | Shown on cards |
| `scientific_name` | yes | `Genus species`, unique |
| `group` | yes | A slug from `groups.csv` |
| `rarity_england` `rarity_scotland` `rarity_wales` `rarity_northern_ireland` | at least one | One of `common`, `uncommon`, `rare`, `legendary`. **Blank = the species does not occur there** |
| `summary` | yes | One or two sentences, max 220 characters |
| `habitat` | no (warned) | Short phrase |
| `best_time` | no (warned) | When and how to look; include any "do not disturb" note |

Text containing commas must be wrapped in double quotes (spreadsheets do this on export).

## Rarity rubric

Rarity means **how hard it is for an ordinary person to find and photograph the species in
that nation**, not just how big the population is. A shy nocturnal animal can be abundant and
still be `uncommon`.

| Tier | Meaning |
|---|---|
| `common` | Likely on an ordinary outing or in the garden, with little effort |
| `uncommon` | Needs the right habitat, season or time of day, or some patience |
| `rare` | Needs a dedicated trip, specialist knowledge or real luck |
| `legendary` | Exceptional: very few people ever see one |

When a user has several nations selected, the app averages the tiers for the nations they
selected and the species occurs in, rounding halves up (rare in England + common in Scotland
= uncommon; rare + uncommon = rare).

## Scope rule

Included: UK residents, breeding species and regular annual migrants, including established
introduced species (such as grey squirrel). Excluded: vagrants (one-off or irregular
visitors), escapes and species that are not established. Insects are out of scope.

## Status of the current data

**This is a first-draft starter set (167 species), not the full UK list.** It was written
from general knowledge to prove out the shape of the data and cover the awkward cases
(species missing from some nations, different rarity per nation, protected species). Before
relying on it:

- Check nation presence and rarity tiers against authoritative sources (for example BTO
  and BOU lists for birds, the Mammal Society, the Amphibian and Reptile Conservation Trust,
  and the Bat Conservation Trust).
- Check every `summary`, `habitat` and `best_time` line for accuracy.
- Conservation status (Red/Amber/Green, IUCN) is deliberately **not** included yet: the
  lists differ by group, change over time, and need to be sourced, not recalled.
