import Link from "next/link";
import { notFound } from "next/navigation";
import { DexBrowser } from "@/components/dex/dex-browser";
import { ThemeToggle } from "@/components/theme-toggle";
import { Progress } from "@/components/ui/progress";
import type { DexCard, Rarity } from "@/lib/dex";
import { isShareToken, sharedPageMetadata } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "A shared WildDex", ...sharedPageMetadata };

const PHOTO_LINK_SECONDS = 60 * 60;

type SharedDex = {
    dex_name: string | null;
    species: {
        slug: string;
        common_name: string;
        scientific_name: string | null; // only for species the owner has found
        group_slug: string;
        group_name: string;
        rarity: Rarity;
        found: boolean;
        cover_thumb_path: string | null;
    }[];
};

// Someone's dex, read-only, for anyone with the link (no sign-in).
export default async function SharedDexPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    if (!isShareToken(token)) notFound();

    const supabase = await createClient();
    const { data } = await supabase.rpc("shared_dex", { p_token: token });
    const dex = data as SharedDex | null;
    if (!dex) notFound(); // unknown link, or sharing was switched off

    const paths = dex.species
        .map((s) => s.cover_thumb_path)
        .filter((p): p is string => !!p);
    const signed = paths.length
        ? await supabase.storage
              .from("entry-photos")
              .createSignedUrls(paths, PHOTO_LINK_SECONDS)
        : { data: [] };
    const urlByPath = new Map<string, string>();
    for (const s of signed.data ?? []) {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }

    const cards: DexCard[] = dex.species.map((s, i) => ({
        speciesId: i, // only used as a list key here
        slug: s.slug,
        name: s.common_name,
        scientificName: s.scientific_name ?? "",
        groupSlug: s.group_slug,
        groupName: s.group_name,
        rarity: s.rarity,
        found: s.found,
        thumbUrl: s.cover_thumb_path
            ? (urlByPath.get(s.cover_thumb_path) ?? null)
            : null,
        habitat: null,
        bestTime: null,
    }));

    const found = cards.filter((c) => c.found).length;
    const percent = cards.length ? Math.round((found / cards.length) * 100) : 0;

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pt-8 pb-12">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Shared WildDex · view only
                </p>
                <ThemeToggle />
            </div>

            <header className="space-y-3">
                <h1 className="font-heading text-3xl font-bold">
                    {dex.dex_name ?? "A WildDex"}
                </h1>
                <div className="space-y-1.5">
                    <Progress
                        value={percent}
                        aria-label="Species found"
                        className="h-2.5"
                    />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                            {found} of {cards.length}
                        </span>{" "}
                        species found · {percent}%
                    </p>
                </div>
            </header>

            <DexBrowser cards={cards} basePath={`/s/${token}`} readOnly />

            <p className="pt-4 text-center text-sm text-muted-foreground">
                Want to build your own?{" "}
                <Link
                    href="/"
                    className="font-medium text-foreground underline"
                >
                    Start your WildDex
                </Link>
            </p>
        </main>
    );
}
