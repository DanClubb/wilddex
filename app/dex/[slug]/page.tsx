import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ViewTransition } from "react";
import { PhotoCarousel } from "@/components/dex/photo-carousel";
import { PhotoUploader } from "@/components/dex/photo-uploader";
import { GroupIcon } from "@/components/dex/group-icon";
import { RarityPips } from "@/components/dex/rarity-pips";
import { createClient } from "@/lib/supabase/server";
import type { Rarity } from "@/lib/dex";

// Photos live in a private bucket; each is shown through a link that expires.
const PHOTO_LINK_SECONDS = 60 * 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const supabase = await createClient();
    const { data } = await supabase
        .from("species")
        .select("common_name")
        .eq("slug", slug)
        .maybeSingle();
    return { title: data?.common_name ?? "Species" };
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

    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) redirect("/login");

    const { data: species } = await supabase
        .from("species")
        .select(
            "id, common_name, scientific_name, summary, habitat, best_time, groups(slug, name)",
        )
        .eq("slug", slug)
        .maybeSingle();
    if (!species) notFound();

    const [{ data: dexRow }, { data: entry }] = await Promise.all([
        supabase
            .from("my_dex")
            .select("rarity")
            .eq("species_id", species.id)
            .maybeSingle(),
        supabase
            .from("entries")
            .select("id, first_seen_on, location_text, notes")
            .eq("species_id", species.id)
            .maybeSingle(),
    ]);

    // Not in this user's dex and never found: there is nothing to show.
    if (!dexRow && !entry) notFound();

    const photos = entry
        ? ((
              await supabase
                  .from("entry_photos")
                  .select("id, storage_path, thumb_path, is_cover")
                  .eq("entry_id", entry.id)
                  .order("is_cover", { ascending: false })
                  .order("created_at")
          ).data ?? [])
        : [];

    const paths = photos.map((p) => p.storage_path);
    const signed = paths.length
        ? await supabase.storage
              .from("entry-photos")
              .createSignedUrls(paths, PHOTO_LINK_SECONDS)
        : { data: [] };
    const urlByPath = new Map<string, string>();
    for (const s of signed.data ?? []) {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }

    const group = species.groups;
    const found = !!entry;
    const rarity = (dexRow?.rarity ?? null) as Rarity | null;

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-6 pb-12">
            <Link
                href="/dex"
                transitionTypes={["nav-back"]}
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Back to your dex
            </Link>

            <header className="space-y-2">
                <p className="text-sm text-muted-foreground">{group?.name}</p>
                <h1 className="font-heading text-3xl font-bold">
                    {species.common_name}
                </h1>
                {found && (
                    <p className="text-muted-foreground italic">
                        {species.scientific_name}
                    </p>
                )}
                {rarity ? (
                    <RarityPips rarity={rarity} />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Not in your current dex
                    </p>
                )}
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
                                      },
                                  ]
                                : [];
                        })}
                    />
                </ViewTransition>
            ) : (
                <div className="flex aspect-4/3 items-center justify-center rounded-3xl bg-muted">
                    <GroupIcon
                        slug={group?.slug ?? ""}
                        className="size-16 text-muted-foreground/30"
                    />
                </div>
            )}

            {entry && (
                <section
                    aria-labelledby="sighting-heading"
                    className="space-y-1"
                >
                    <h2
                        id="sighting-heading"
                        className="font-heading text-xl font-bold"
                    >
                        Your sighting
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
            />
        </main>
    );
}
