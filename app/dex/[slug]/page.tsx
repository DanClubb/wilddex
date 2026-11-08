import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache, ViewTransition } from "react";
import { PendingIcon } from "@/components/dex/link-pending";
import { EditSighting } from "@/components/dex/edit-sighting";
import { PhotoCarousel } from "@/components/dex/photo-carousel";
import { PhotoUploader } from "@/components/dex/photo-uploader";
import { GroupIcon } from "@/components/dex/group-icon";
import { RarityPips } from "@/components/dex/rarity-pips";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { Rarity } from "@/lib/dex";

// Photos live in a private bucket; each is shown through a link that expires.
const PHOTO_LINK_SECONDS = 60 * 60;

type Props = { params: Promise<{ slug: string }> };

type SpeciesPageData = {
    species: {
        id: number;
        common_name: string;
        scientific_name: string;
        summary: string;
        habitat: string | null;
        best_time: string | null;
        group_slug: string;
        group_name: string;
    };
    rarity: Rarity | null; // null when the species isn't in the user's dex
    entry: {
        id: string;
        first_seen_on: string;
        location_text: string | null;
        notes: string | null;
    } | null;
    photos: { id: string; storage_path: string; is_cover: boolean }[];
};

// One database round trip for everything on the page. cache() lets the page and
// generateMetadata share the result instead of asking twice.
const getSpeciesPage = cache(async (slug: string) => {
    const supabase = await createClient();
    const { data } = await supabase.rpc("species_page", { p_slug: slug });
    return data as SpeciesPageData | null;
});

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const data = await getSpeciesPage(slug);
    return { title: data?.species.common_name ?? "Species" };
}

function formatDate(iso: string) {
    // Parsed as a plain date so the user's timezone can't shift it by a day.
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

export default async function SpeciesPage({ params }: Props) {
    const { slug } = await params;
    const supabase = await createClient();

    // Independent of each other, so they run at the same time.
    const [{ data: auth }, page] = await Promise.all([
        supabase.auth.getClaims(),
        getSpeciesPage(slug),
    ]);
    const claims = auth?.claims;
    if (!claims) redirect("/login");
    if (!page) notFound();

    const { species, entry, photos } = page;
    // Not in this user's dex and never found: there is nothing to show.
    if (!page.rarity && !entry) notFound();

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

    const group = { slug: species.group_slug, name: species.group_name };
    const found = !!entry;
    const rarity = page.rarity;

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-6 pb-12">
            <div className="flex items-center justify-between">
                <Link
                    href="/dex"
                    transitionTypes={["nav-back"]}
                    className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    <PendingIcon>
                        <ArrowLeft aria-hidden="true" className="size-4" />
                    </PendingIcon>
                    Back to your dex
                </Link>
                <ThemeToggle />
            </div>

            <header className="space-y-2">
                <p className="text-sm text-muted-foreground">{group.name}</p>
                <h1 className="font-heading text-3xl font-bold">
                    {species.common_name}
                </h1>
                {found && (
                    <p className="text-muted-foreground italic">
                        {species.scientific_name}
                    </p>
                )}
                <div className="flex items-center gap-3">
                    {found && <Badge>Found</Badge>}
                    {rarity ? (
                        <RarityPips rarity={rarity} />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Not in your current dex
                        </p>
                    )}
                </div>
            </header>

            {photos.length > 0 ? (
                <ViewTransition
                    name={`species-${slug}`}
                    share="morph"
                    default="none"
                >
                    <PhotoCarousel
                        photos={photos.flatMap((p, i) => {
                            const src = urlByPath.get(p.storage_path);
                            return src
                                ? [
                                      {
                                          id: p.id,
                                          src,
                                          alt: `Your photo ${i + 1} of a ${species.common_name}`,
                                          isCover: p.is_cover,
                                      },
                                  ]
                                : [];
                        })}
                    />
                </ViewTransition>
            ) : (
                <div className="flex aspect-4/3 items-center justify-center rounded-3xl bg-muted">
                    <GroupIcon
                        slug={group.slug}
                        className="size-16 text-muted-foreground/30"
                    />
                </div>
            )}

            {entry && (
                <section
                    aria-labelledby="sighting-heading"
                    className="space-y-1"
                >
                    <div className="flex items-center justify-between">
                        <h2
                            id="sighting-heading"
                            className="font-heading text-xl font-bold"
                        >
                            Your sighting
                        </h2>
                        <EditSighting
                            entryId={entry.id}
                            seenOn={entry.first_seen_on}
                            location={entry.location_text}
                            notes={entry.notes}
                        />
                    </div>
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
            )}

            <section aria-labelledby="about-heading" className="space-y-3">
                <h2
                    id="about-heading"
                    className="font-heading text-xl font-bold"
                >
                    {found ? "About" : "Where to look"}
                </h2>
                {found ? (
                    <p>{species.summary}</p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Find and photograph this species to unlock what we know
                        about it.
                    </p>
                )}
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

            <PhotoUploader
                userId={claims.sub}
                speciesId={species.id}
                speciesName={species.common_name}
                entryId={entry?.id ?? null}
                clues={{
                    habitat: species.habitat,
                    bestTime: species.best_time,
                }}
            />
        </main>
    );
}
