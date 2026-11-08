import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DexCard, Rarity } from "@/lib/dex";
import { GroupIcon } from "./group-icon";

// How many of the four circles are filled, and the colours for each tier. The
// class names are written out in full so Tailwind can see them.
const RARITY: Record<
    Rarity,
    { label: string; filled: number; dot: string; text: string }
> = {
    common: { label: "Common", filled: 1, dot: "border-rarity-common bg-rarity-common", text: "text-rarity-common-foreground" },
    uncommon: { label: "Uncommon", filled: 2, dot: "border-rarity-uncommon bg-rarity-uncommon", text: "text-rarity-uncommon-foreground" },
    rare: { label: "Rare", filled: 3, dot: "border-rarity-rare bg-rarity-rare", text: "text-rarity-rare-foreground" },
    legendary: { label: "Legendary", filled: 4, dot: "border-rarity-legendary bg-rarity-legendary", text: "text-rarity-legendary-foreground" },
};

// Four circles, filled one to four from common to legendary, in the tier's colour,
// with the tier name beside them. Unfilled circles are faint outlines.
function RarityPips({ rarity }: { rarity: Rarity }) {
    const { label, filled, dot, text } = RARITY[rarity];
    return (
        <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex items-center gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={cn(
                            "size-2.5 rounded-full border-[1.5px]",
                            i < filled ? dot : cn(dot, "bg-transparent opacity-35"),
                        )}
                    />
                ))}
            </span>
            <span className={cn("text-xs font-medium", text)}>{label}</span>
        </span>
    );
}

// A found species shows the user's own cover photo; one still to find is a grey
// placeholder (name and rarity stay visible, so it doubles as a target list).
export function SpeciesCard({ card }: { card: DexCard }) {
    return (
        <li
            className={cn(
                "overflow-hidden rounded-3xl border",
                card.found ? "border-border bg-card" : "border-transparent bg-muted",
            )}
        >
            <div
                className={cn(
                    "relative flex aspect-square items-center justify-center",
                    card.found && "bg-muted",
                )}
            >
                {card.found && card.thumbUrl ? (
                    // Plain <img> on purpose: the URL is a short-lived signed link to a
                    // private bucket, so next/image's optimiser and cache don't apply.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={card.thumbUrl}
                        alt={`Your photo of a ${card.name}`}
                        loading="lazy"
                        className="size-full object-cover"
                    />
                ) : (
                    <GroupIcon
                        slug={card.groupSlug}
                        className={cn(
                            "size-12",
                            card.found ? "text-primary/40" : "text-muted-foreground/30",
                        )}
                    />
                )}

                {card.found && (
                    <span
                        className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                        title="Found"
                    >
                        <Check aria-hidden="true" className="size-3.5" />
                        <span className="sr-only">Found</span>
                    </span>
                )}
            </div>

            <div className="space-y-1.5 p-3">
                <h3
                    className={cn(
                        "text-sm leading-tight font-semibold",
                        !card.found && "text-muted-foreground",
                    )}
                >
                    {card.name}
                </h3>
                {card.found ? (
                    <p className="truncate text-xs text-muted-foreground italic">
                        {card.scientificName}
                    </p>
                ) : (
                    <p className="sr-only">Not found yet</p>
                )}
                <RarityPips rarity={card.rarity} />
            </div>
        </li>
    );
}
