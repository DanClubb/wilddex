import { cn } from "@/lib/utils";
import type { Rarity } from "@/lib/dex";

// How many of the four circles are filled, and the colours for each tier. The
// class names are written out in full so Tailwind can see them.
const RARITY: Record<
    Rarity,
    { label: string; filled: number; dot: string; text: string }
> = {
    common: {
        label: "Common",
        filled: 1,
        dot: "border-rarity-common bg-rarity-common",
        text: "text-rarity-common-foreground",
    },
    uncommon: {
        label: "Uncommon",
        filled: 2,
        dot: "border-rarity-uncommon bg-rarity-uncommon",
        text: "text-rarity-uncommon-foreground",
    },
    rare: {
        label: "Rare",
        filled: 3,
        dot: "border-rarity-rare bg-rarity-rare",
        text: "text-rarity-rare-foreground",
    },
    legendary: {
        label: "Legendary",
        filled: 4,
        dot: "border-rarity-legendary bg-rarity-legendary",
        text: "text-rarity-legendary-foreground",
    },
};

// Four circles, filled one to four from common to legendary, in the tier's colour,
// with the tier name beside them. Unfilled circles are faint outlines.
export function RarityPips({ rarity }: { rarity: Rarity }) {
    const { label, filled, dot, text } = RARITY[rarity];
    return (
        <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex items-center gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={cn(
                            "size-2.5 rounded-full border-[1.5px]",
                            i < filled
                                ? dot
                                : cn(dot, "bg-transparent opacity-35"),
                        )}
                    />
                ))}
            </span>
            <span className={cn("text-xs font-medium", text)}>{label}</span>
        </span>
    );
}
