// Pure helpers for working out what a dex contains. No database access here,
// so they are easy to test and safe to use in client components.

export type DexSpecies = {
    groupId: number;
    regionIds: number[];
};

// A species is in the dex when its group is selected AND it occurs in at least
// one selected region.
export function inDex(
    species: DexSpecies,
    groupIds: ReadonlySet<number>,
    regionIds: ReadonlySet<number>,
): boolean {
    return (
        groupIds.has(species.groupId) &&
        species.regionIds.some((id) => regionIds.has(id))
    );
}

export function countInDex(
    all: readonly DexSpecies[],
    groupIds: ReadonlySet<number>,
    regionIds: ReadonlySet<number>,
): number {
    let n = 0;
    for (const s of all) if (inDex(s, groupIds, regionIds)) n++;
    return n;
}

// ---------------------------------------------------------------------------
// Dex grid
// ---------------------------------------------------------------------------

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

// One card in the dex grid: a species in the user's dex, found or not.
export type DexCard = {
    speciesId: number;
    slug: string;
    name: string;
    scientificName: string;
    groupSlug: string;
    groupName: string;
    rarity: Rarity;
    found: boolean;
    thumbUrl: string | null; // signed URL of the cover photo, when found
};

export type DexStatus = "all" | "found" | "missing";

export type DexFilters = {
    group: string; // group slug, or "all"
    status: DexStatus;
    query: string;
};

export function filterCards(
    cards: readonly DexCard[],
    { group, status, query }: DexFilters,
): DexCard[] {
    const q = query.trim().toLowerCase();
    return cards.filter(
        (c) =>
            (group === "all" || c.groupSlug === group) &&
            (status === "all" || (status === "found") === c.found) &&
            (!q ||
                c.name.toLowerCase().includes(q) ||
                c.scientificName.toLowerCase().includes(q)),
    );
}

export type GroupProgress = {
    slug: string;
    name: string;
    found: number;
    total: number;
};

// Found/total per group, in the order the groups first appear (the page
// sorts by group order, so this is the display order).
export function groupProgress(cards: readonly DexCard[]): GroupProgress[] {
    const byGroup = new Map<string, GroupProgress>();
    for (const c of cards) {
        const g = byGroup.get(c.groupSlug) ?? {
            slug: c.groupSlug,
            name: c.groupName,
            found: 0,
            total: 0,
        };
        g.total++;
        if (c.found) g.found++;
        byGroup.set(c.groupSlug, g);
    }
    return [...byGroup.values()];
}
