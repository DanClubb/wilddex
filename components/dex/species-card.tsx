import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DexCard } from "@/lib/dex";
import { GroupIcon } from "./group-icon";
import { RarityPips } from "./rarity-pips";

// A found species shows the user's own cover photo; one still to find is a grey
// placeholder (name and rarity stay visible, so it doubles as a target list).
export function SpeciesCard({ card }: { card: DexCard }) {
  return (
    <li
      className={cn(
        "overflow-hidden rounded-3xl border focus-within:ring-3 focus-within:ring-ring/40",
        card.found ? "border-border bg-card" : "border-transparent bg-muted",
      )}
    >
      <Link href={`/dex/${card.slug}`} className="block outline-none">
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
      </Link>
    </li>
  );
}
