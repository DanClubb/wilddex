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
