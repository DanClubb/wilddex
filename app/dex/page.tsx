import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DexBrowser } from "@/components/dex/dex-browser";
import { createClient } from "@/lib/supabase/server";
import type { DexCard } from "@/lib/dex";

export const metadata = { title: "Your WildDex" };

// Cover photos live in a private bucket, so each one is shown through a link
// that expires. One hour is plenty for a visit; the page makes fresh ones on load.
const PHOTO_LINK_SECONDS = 60 * 60;

export default async function DexPage() {
    const supabase = await createClient();

    // getClaims() verifies the session token; never trust the cookie alone.
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) redirect("/login");

    const [{ data: rows, error }, { data: profile }] = await Promise.all([
        // my_dex is already limited to the user's chosen groups and regions.
        // Supabase returns at most 1000 rows per request; once a dex can be bigger
        // than that, page through it (or move the grid to an RPC).
        supabase
            .from("my_dex")
            .select(
                "species_id, common_name, scientific_name, group_slug, group_name, rarity, entry_id, cover_thumb_path",
            )
            .order("group_sort_order")
            .order("common_name"),
        supabase.from("profiles").select("dex_name").eq("id", claims.sub).maybeSingle(),
    ]);

    // No profile means the setup wizard has not been finished yet.
    if (!profile) redirect("/setup");
    if (error) throw new Error("Could not load your dex");

    // One request signs every cover photo.
    const coverPaths = (rows ?? [])
        .map((r) => r.cover_thumb_path)
        .filter((p): p is string => !!p);
    const signed = coverPaths.length
        ? await supabase.storage
              .from("entry-photos")
              .createSignedUrls(coverPaths, PHOTO_LINK_SECONDS)
        : { data: [] };
    const urlByPath = new Map<string, string>();
    for (const s of signed.data ?? []) {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }

    // The view's columns are all nullable in the generated types, so only
    // keep rows that have what a card needs.
    const cards: DexCard[] = [];
    for (const r of rows ?? []) {
        if (
            r.species_id == null ||
            !r.common_name ||
            !r.group_slug ||
            !r.group_name ||
            !r.rarity
        )
            continue;
        cards.push({
            speciesId: r.species_id,
            name: r.common_name,
            scientificName: r.scientific_name ?? "",
            groupSlug: r.group_slug,
            groupName: r.group_name,
            rarity: r.rarity,
            found: r.entry_id != null,
            thumbUrl: r.cover_thumb_path
                ? (urlByPath.get(r.cover_thumb_path) ?? null)
                : null,
        });
    }

    const found = cards.filter((c) => c.found).length;
    const percent = cards.length ? Math.round((found / cards.length) * 100) : 0;

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pt-8 pb-12">
            <header className="space-y-3">
                <h1 className="font-heading text-3xl font-bold">
                    {profile.dex_name ?? "Your WildDex"}
                </h1>
                <div className="space-y-1.5">
                    <div
                        role="progressbar"
                        aria-label="Species found"
                        aria-valuemin={0}
                        aria-valuemax={cards.length}
                        aria-valuenow={found}
                        className="h-2.5 overflow-hidden rounded-full bg-muted"
                    >
                        <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                            {found} of {cards.length}
                        </span>{" "}
                        species found · {percent}%
                    </p>
                </div>
            </header>

            <DexBrowser cards={cards} />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button asChild variant="default" className="h-11 w-full">
                    <Link href="/setup">Edit dex settings</Link>
                </Button>
                <form action="/auth/signout" method="post">
                    <Button
                        type="submit"
                        variant="destructive"
                        className="h-11 w-full"
                    >
                        Sign out
                    </Button>
                </form>
            </div>
        </main>
    );
}
