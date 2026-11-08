import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DexWizard } from "./dex-wizard";

export const metadata = { title: "Set up your dex" };

export default async function SetupPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) redirect("/login");

    // Reference data is small, so the wizard gets all of it and counts live in
    // the browser. Supabase returns at most 1000 rows per request: species_regions
    // is ~200 rows today; move the counts to an RPC before it nears that.
    const [groups, regions, species, speciesRegions, profile, myGroups, myRegions] =
        await Promise.all([
            supabase.from("groups").select("id, name, default_selected").order("sort_order"),
            supabase.from("regions").select("id, name").order("sort_order"),
            supabase.from("species").select("id, group_id").eq("is_active", true),
            supabase.from("species_regions").select("species_id, region_id"),
            supabase.from("profiles").select("dex_name").eq("id", claims.sub).maybeSingle(),
            supabase.from("user_dex_groups").select("group_id"),
            supabase.from("user_dex_regions").select("region_id"),
        ]);

    if (groups.error || regions.error || species.error || speciesRegions.error) {
        throw new Error("Could not load dex options");
    }

    const regionsBySpecies = new Map<number, number[]>();
    for (const sr of speciesRegions.data) {
        const list = regionsBySpecies.get(sr.species_id) ?? [];
        list.push(sr.region_id);
        regionsBySpecies.set(sr.species_id, list);
    }
    const allSpecies = species.data.map((s) => ({
        groupId: s.group_id,
        regionIds: regionsBySpecies.get(s.id) ?? [],
    }));

    const editing = !!profile.data;
    const selectedGroups = editing
        ? (myGroups.data ?? []).map((g) => g.group_id)
        : groups.data.filter((g) => g.default_selected).map((g) => g.id);
    const selectedRegions = editing
        ? (myRegions.data ?? []).map((r) => r.region_id)
        : regions.data.map((r) => r.id);

    return (
        <DexWizard
            editing={editing}
            groups={groups.data.map((g) => ({ id: g.id, name: g.name }))}
            regions={regions.data}
            species={allSpecies}
            initial={{
                name: profile.data?.dex_name ?? "",
                groupIds: selectedGroups,
                regionIds: selectedRegions,
            }}
        />
    );
}
