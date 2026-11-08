import { Check, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DexCard, Rarity } from "@/lib/dex";

const RARITY: Record<Rarity, { label: string; className: string }> = {
    common: { label: "Common", className: "bg-rarity-common text-rarity-common-foreground" },
    uncommon: { label: "Uncommon", className: "bg-rarity-uncommon text-rarity-uncommon-foreground" },
    rare: { label: "Rare", className: "bg-rarity-rare text-rarity-rare-foreground" },
    legendary: { label: "Legendary", className: "bg-rarity-legendary text-rarity-legendary-foreground" },
};

// A found species shows the user's own cover photo; one still to find is a grey
// placeholder (name and rarity stay visible, so it doubles as a target list).
export function SpeciesCard({ card }: { card: DexCard }) {
    const rarity = RARITY[card.rarity];

    return (
        <li
            className={cn(
                "overflow-hidden rounded-3xl border",
                card.found ? "border-border bg-card" : "border-transparent bg-muted",
            )}
        >
            <div
                className={cn(
                    "relative aspect-square",
                    card.found ? "bg-muted" : "flex items-center justify-center",
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
                    <Leaf
                        aria-hidden="true"
                        className={cn(
                            "size-10",
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
                <span
                    className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                        rarity.className,
                    )}
                >
                    {rarity.label}
                </span>
            </div>
        </li>
    );
}
