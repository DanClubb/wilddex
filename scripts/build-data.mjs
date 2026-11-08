#!/usr/bin/env node
// Validates the species dataset (data/*.csv) and, if it is valid, generates
// db/seed.sql. No dependencies: run with plain Node 18+.
//
//   node scripts/build-data.mjs                  -> reads data/, writes db/seed.sql
//   node scripts/build-data.mjs <dataDir> <out>  -> custom locations (used for testing)
//
// Exit code 1 (and nothing written) if any validation error is found.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(process.argv[2] ?? join(root, 'data'));
const outFile = resolve(process.argv[3] ?? join(root, 'db', 'seed.sql'));

const RARITIES = ['common', 'uncommon', 'rare', 'legendary']; // same order as the SQL enum
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SCIENTIFIC_NAME = /^[A-Z][a-z]+ [a-z]+( [a-z]+)?$/; // Genus species (subspecies)
const MAX_SUMMARY = 220;

const errors = [];
const warnings = [];
const err = (file, line, msg) => errors.push(`${file}:${line}  ${msg}`);
const warn = (file, line, msg) => warnings.push(`${file}:${line}  ${msg}`);

// --- Minimal CSV parser (RFC 4180: quoted fields, "" escapes, newlines in quotes) ---
function parseCsv(file) {
  let text;
  try {
    text = readFileSync(join(dataDir, file), 'utf8').replace(/^﻿/, ''); // Excel adds a BOM
  } catch {
    errors.push(`${file}  cannot read file in ${dataDir}`);
    return { header: [], records: [] };
  }
  const rows = [];
  let row = [], field = '', inQuotes = false, line = 1, rowLine = 1;
  const endField = () => { row.push(field.trim()); field = ''; };
  const endRow = () => {
    endField();
    if (!(row.length === 1 && row[0] === '')) rows.push({ line: rowLine, cells: row });
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else {
        if (c === '\n') line++;
        field += c;
      }
    } else if (c === '"') inQuotes = true;
    else if (c === ',') endField();
    else if (c === '\r') { /* ignore */ }
    else if (c === '\n') { endRow(); line++; rowLine = line; }
    else field += c;
  }
  if (inQuotes) err(file, line, 'unterminated quote');
  if (field !== '' || row.length) endRow();

  const [head, ...body] = rows;
  const header = head ? head.cells : [];
  const records = [];
  for (const r of body) {
    if (r.cells.length !== header.length) {
      err(file, r.line, `has ${r.cells.length} columns, expected ${header.length}`);
      continue;
    }
    const rec = { _line: r.line };
    header.forEach((h, i) => { rec[h] = r.cells[i]; });
    records.push(rec);
  }
  return { header, records };
}

function checkColumns(file, header, required, allowed = required) {
  for (const col of required) if (!header.includes(col)) err(file, 1, `missing column "${col}"`);
  for (const col of header) if (!allowed.includes(col)) err(file, 1, `unknown column "${col}" (typo?)`);
}

function checkUniqueSlugs(file, records) {
  const seen = new Map();
  for (const r of records) {
    if (!SLUG.test(r.slug ?? '')) err(file, r._line, `slug "${r.slug}" must be lowercase words joined by hyphens`);
    if (seen.has(r.slug)) err(file, r._line, `duplicate slug "${r.slug}" (first on line ${seen.get(r.slug)})`);
    else seen.set(r.slug, r._line);
  }
}

// --- Load and validate ---
const groups = parseCsv('groups.csv');
checkColumns('groups.csv', groups.header, ['slug', 'name', 'sort_order', 'default_selected']);
checkUniqueSlugs('groups.csv', groups.records);
for (const g of groups.records) {
  if (!g.name) err('groups.csv', g._line, 'name is empty');
  if (!/^\d+$/.test(g.sort_order)) err('groups.csv', g._line, 'sort_order must be a whole number');
  if (!['true', 'false'].includes(g.default_selected)) err('groups.csv', g._line, 'default_selected must be true or false');
}

const regions = parseCsv('regions.csv');
checkColumns('regions.csv', regions.header, ['slug', 'name', 'sort_order']);
checkUniqueSlugs('regions.csv', regions.records);
for (const r of regions.records) {
  if (!r.name) err('regions.csv', r._line, 'name is empty');
  if (!/^\d+$/.test(r.sort_order)) err('regions.csv', r._line, 'sort_order must be a whole number');
}

// Each region needs a rarity column: "northern-ireland" -> rarity_northern_ireland
const rarityColumn = (regionSlug) => `rarity_${regionSlug.replaceAll('-', '_')}`;
const regionColumns = regions.records.map((r) => ({ slug: r.slug, column: rarityColumn(r.slug) }));

const species = parseCsv('species.csv');
const coreColumns = ['slug', 'common_name', 'scientific_name', 'group', 'summary', 'habitat', 'best_time'];
checkColumns(
  'species.csv',
  species.header,
  [...coreColumns, ...regionColumns.map((r) => r.column)],
);
checkUniqueSlugs('species.csv', species.records);

const groupSlugs = new Set(groups.records.map((g) => g.slug));
const scientificNames = new Map();
const perGroup = new Map();
const perRegion = new Map();
for (const s of species.records) {
  const f = 'species.csv', l = s._line;
  if (!s.common_name) err(f, l, 'common_name is empty');
  if (!SCIENTIFIC_NAME.test(s.scientific_name)) {
    err(f, l, `scientific_name "${s.scientific_name}" should look like "Genus species"`);
  }
  const key = s.scientific_name.toLowerCase();
  if (scientificNames.has(key)) err(f, l, `duplicate scientific_name "${s.scientific_name}" (first on line ${scientificNames.get(key)})`);
  else scientificNames.set(key, l);
  if (!groupSlugs.has(s.group)) err(f, l, `unknown group "${s.group}" (not in groups.csv)`);
  if (!s.summary) err(f, l, 'summary is empty');
  else if (s.summary.length > MAX_SUMMARY) err(f, l, `summary is ${s.summary.length} characters (max ${MAX_SUMMARY})`);
  if (!s.habitat) warn(f, l, `"${s.slug}" has no habitat`);
  if (!s.best_time) warn(f, l, `"${s.slug}" has no best_time`);

  let presentIn = 0;
  for (const { slug, column } of regionColumns) {
    const v = s[column];
    if (v === undefined || v === '') continue;
    if (!RARITIES.includes(v)) err(f, l, `${column} is "${v}"; use ${RARITIES.join(', ')} or leave blank if absent`);
    else {
      presentIn++;
      perRegion.set(slug, (perRegion.get(slug) ?? 0) + 1);
    }
  }
  if (presentIn === 0) err(f, l, `"${s.slug}" is not present in any region (every rarity column is blank)`);
  perGroup.set(s.group, (perGroup.get(s.group) ?? 0) + 1);
}

for (const w of warnings.slice(0, 5)) console.warn(`warning  ${w}`);
if (warnings.length > 5) console.warn(`warning  ...and ${warnings.length - 5} more`);
if (errors.length) {
  console.error(`\n${errors.length} error(s); seed file NOT written:\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

// --- Generate seed.sql ---
const q = (v) => `'${String(v).replaceAll("'", "''")}'`;
const qn = (v) => (v === '' || v === undefined ? 'null' : q(v));

const lines = [];
lines.push('-- GENERATED by scripts/build-data.mjs from data/*.csv. Do not edit by hand.');
lines.push('-- Safe to re-run: rows are matched on slug and updated in place.');
lines.push('begin;', '');

lines.push('insert into public.groups (slug, name, sort_order, default_selected) values');
lines.push(groups.records.map((g) => `  (${q(g.slug)}, ${q(g.name)}, ${g.sort_order}, ${g.default_selected})`).join(',\n'));
lines.push('on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, default_selected = excluded.default_selected;', '');

lines.push('insert into public.regions (slug, name, sort_order) values');
lines.push(regions.records.map((r) => `  (${q(r.slug)}, ${q(r.name)}, ${r.sort_order})`).join(',\n'));
lines.push('on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;', '');

lines.push('insert into public.species (slug, common_name, scientific_name, group_id, summary, habitat, best_time)');
lines.push('select v.slug, v.common_name, v.scientific_name, g.id, v.summary, v.habitat, v.best_time');
lines.push('from (values');
lines.push(
  species.records
    .map((s) => `  (${q(s.slug)}, ${q(s.common_name)}, ${q(s.scientific_name)}, ${q(s.group)}, ${q(s.summary)}, ${qn(s.habitat)}, ${qn(s.best_time)})`)
    .join(',\n'),
);
lines.push(') as v(slug, common_name, scientific_name, group_slug, summary, habitat, best_time)');
lines.push('join public.groups g on g.slug = v.group_slug');
lines.push('on conflict (slug) do update set');
lines.push('  common_name = excluded.common_name, scientific_name = excluded.scientific_name, group_id = excluded.group_id,');
lines.push('  summary = excluded.summary, habitat = excluded.habitat, best_time = excluded.best_time;', '');

// Replace each seeded species' region rows so removed nations disappear too.
lines.push('delete from public.species_regions');
lines.push(`where species_id in (select id from public.species where slug in (${species.records.map((s) => q(s.slug)).join(', ')}));`, '');

const presence = [];
for (const s of species.records) {
  for (const { slug, column } of regionColumns) {
    if (s[column]) presence.push(`  (${q(s.slug)}, ${q(slug)}, ${q(s[column])})`);
  }
}
lines.push('insert into public.species_regions (species_id, region_id, rarity)');
lines.push('select sp.id, rg.id, v.rarity::public.rarity_tier');
lines.push('from (values');
lines.push(presence.join(',\n'));
lines.push(') as v(species_slug, region_slug, rarity)');
lines.push('join public.species sp on sp.slug = v.species_slug');
lines.push('join public.regions rg on rg.slug = v.region_slug;', '');
lines.push('commit;', '');

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, lines.join('\n'));

// --- Report ---
console.log(`OK: ${species.records.length} species, ${groups.records.length} groups, ${regions.records.length} regions -> ${outFile}`);
console.log('\nSpecies per group:');
for (const g of groups.records) console.log(`  ${g.name.padEnd(18)} ${perGroup.get(g.slug) ?? 0}`);
console.log('\nSpecies per region:');
for (const r of regions.records) console.log(`  ${r.name.padEnd(18)} ${perRegion.get(r.slug) ?? 0}`);
if (warnings.length) console.log(`\n${warnings.length} warning(s) above.`);
