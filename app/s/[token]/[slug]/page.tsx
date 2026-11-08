import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, ViewTransition } from "react";
import { PendingIcon } from "@/components/dex/link-pending";
import { PhotoCarousel } from "@/components/dex/photo-carousel";
import { RarityPips } from "@/components/dex/rarity-pips";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import type { Rarity } from "@/lib/dex";
import { isShareToken, sharedPageMetadata } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";

const PHOTO_LINK_SECONDS = 60 * 60;

type Props = { params: Promise<{ token: string; slug: string }> };

type SharedSpecies = {
    dex_name: string | null;
    species: {
        common_name: string;
        scientific_name: string;
        summary: string;
        habitat: string | null;
        best_time: string | null;
        group_slug: string;
        group_name: string;
    };
    rarity: Rarity | null;
    entry: {
        first_seen_on: string;
        // Only present if the owner chose to share notes and places.
        location_text: string | null;
        notes: string | null;
    };
    photos: { id: string; storage_path: string; is_cover: boolean }[];
};

const getShared = cache(async (token: string, slug: string) => {
    if (!isShareToken(token)) return null;
    const supabase = await createClient();
    const { data } = await supabase.rpc("shared_species", {
        p_token: token,
        p_slug: slug,
    });
    return data as SharedSpecies | null;
});

export async function generateMetadata({ params }: Props) {
    const { token, slug } = await params;
    const data = await getShared(token, slug);
    return {
        title: data?.species.common_name ?? "Shared species",
        ...sharedPageMetadata,
    };
}

function formatDate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

// One found species on a shared dex: photos and info, with no actions.
export default async function SharedSpeciesPage({ params }: Props) {
    const { token, slug } = await params;
    const page = await getShared(token, slug);
    if (!page) notFound(); // bad link, sharing off, or a species they haven't found

    const { species, entry, photos } = page;
    const supabase = await createClient();
    const signed = photos.length
        ? await supabase.storage.from("entry-photos").createSignedUrls(
              photos.map((p) => p.storage_path),
              PHOTO_LINK_SECONDS,
          )
        : { data: [] };
    const urlByPath = new Map<string, string>();
    for (const s of signed.data ?? []) {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-6 pb-12">
            <div className="flex items-center justify-between">
                <Link
                    href={`/s/${token}`}
                    transitionTypes={["nav-back"]}
                    className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    <PendingIcon>
                        <ArrowLeft aria-hidden="true" className="size-4" />
                    </PendingIcon>
                    Back to {page.dex_name ?? "the dex"}
                </Link>
                <ThemeToggle />
            </div>

            <header className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    {species.group_name}
                </p>
                <h1 className="font-heading text-3xl font-bold">
                    {species.common_name}
                </h1>
                <p className="text-muted-foreground italic">
                    {species.scientific_name}
                </p>
                <div className="flex items-center gap-3">
                    <Badge>Found</Badge>
                    {page.rarity && <RarityPips rarity={page.rarity} />}
                </div>
            </header>

            <ViewTransition
                name={`species-${slug}`}
                share="morph"
                default="none"
            >
                <PhotoCarousel
                    readOnly
                    photos={photos.flatMap((p, i) => {
                        const src = urlByPath.get(p.storage_path);
                        return src
                            ? [
                                  {
                                      id: p.id,
                                      src,
                                      alt: `Photo ${i + 1} of a ${species.common_name}`,
                                      isCover: p.is_cover,
                                  },
                              ]
                            : [];
                    })}
                />
            </ViewTransition>

            <section aria-labelledby="sighting-heading" className="space-y-1">
                <h2
                    id="sighting-heading"
                    className="font-heading text-xl font-bold"
                >
                    Sighting
                </h2>
                <p className="text-sm">
                    First seen {formatDate(entry.first_seen_on)}
                </p>
                {entry.location_text && (
                    <p className="text-sm">{entry.location_text}</p>
                )}
                {entry.notes && (
                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                        {entry.notes}
                    </p>
                )}
            </section>

            <section aria-labelledby="about-heading" className="space-y-3">
                <h2
                    id="about-heading"
                    className="font-heading text-xl font-bold"
                >
                    About
                </h2>
                <p>{species.summary}</p>
                <dl className="space-y-2 text-sm">
                    {species.habitat && (
                        <div>
                            <dt className="font-medium">Habitat</dt>
                            <dd className="text-muted-foreground">
                                {species.habitat}
                            </dd>
                        </div>
                    )}
                    {species.best_time && (
                        <div>
                            <dt className="font-medium">Best time</dt>
                            <dd className="text-muted-foreground">
                                {species.best_time}
                            </dd>
                        </div>
                    )}
                </dl>
            </section>
        </main>
    );
}
