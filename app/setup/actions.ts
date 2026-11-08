"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SaveDexState =
    | { status: "idle" }
    | { status: "error"; message: string };

const MAX_NAME = 40;

function ids(formData: FormData, key: string): number[] {
    return formData
        .getAll(key)
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0);
}

export async function saveDex(
    _prev: SaveDexState,
    formData: FormData,
): Promise<SaveDexState> {
    const supabase = await createClient();

    // Re-check the session here: the page check does not protect the action.
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) redirect("/login");

    const name = String(formData.get("name") ?? "").trim();
    const groupIds = ids(formData, "group");
    const regionIds = ids(formData, "region");

    if (!name || name.length > MAX_NAME)
        return { status: "error", message: `Give your dex a name (up to ${MAX_NAME} characters).` };
    if (groupIds.length === 0)
        return { status: "error", message: "Pick at least one species group." };
    if (regionIds.length === 0)
        return { status: "error", message: "Pick at least one region." };

    const { error } = await supabase.rpc("save_dex_settings", {
        p_dex_name: name,
        p_group_ids: groupIds,
        p_region_ids: regionIds,
    });

    if (error) {
        console.error("save_dex_settings failed", error.message);
        return { status: "error", message: "Couldn't save your dex. Please try again." };
    }

    // redirect() throws, so keep it outside any try/catch.
    redirect("/dex");
}
