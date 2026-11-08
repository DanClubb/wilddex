"use client";

import { SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    filterCards,
    groupProgress,
    type DexCard,
    type DexStatus,
} from "@/lib/dex";
import { LogSpeciesModal } from "./log-species-modal";
import { SpeciesCard } from "./species-card";

const STATUSES: { value: DexStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "found", label: "Found" },
    { value: "missing", label: "To find" },
];

// Filtering happens in the browser: the whole dex is a few hundred small
// cards, so it is instant and needs no round trip.
export function DexBrowser({
    cards,
    userId,
}: {
    cards: DexCard[];
    userId: string;
}) {
    const [group, setGroup] = useState("all");
    const [status, setStatus] = useState<DexStatus>("all");
    const [query, setQuery] = useState("");

    const groups = useMemo(() => groupProgress(cards), [cards]);
    const visible = useMemo(
        () => filterCards(cards, { group, status, query }),
        [cards, group, status, query],
    );
    const foundTotal = useMemo(
        () => cards.filter((c) => c.found).length,
        [cards],
    );

    const filtering =
        group !== "all" || status !== "all" || query.trim() !== "";
    function clear() {
        setGroup("all");
        setStatus("all");
        setQuery("");
    }

    return (
        <div className="space-y-4">
            {/* Stays in view while the grid scrolls underneath. */}
            <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-background/95 px-4 pt-2 pb-3 backdrop-blur">
                <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search species"
                    aria-label="Search species"
                    autoComplete="off"
                />

                <div
                    className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="group"
                    aria-label="Species group"
                >
                    <Chip
                        active={group === "all"}
                        onClick={() => setGroup("all")}
                    >
                        All {foundTotal}/{cards.length}
                    </Chip>
                    {groups.map((g) => (
                        <Chip
                            key={g.slug}
                            active={group === g.slug}
                            onClick={() => setGroup(g.slug)}
                        >
                            {g.name} {g.found}/{g.total}
                        </Chip>
                    ))}
                </div>

                <div
                    className="grid grid-cols-3 gap-1 rounded-4xl bg-muted p-1"
                    role="group"
                    aria-label="Status"
                >
                    {STATUSES.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            aria-pressed={status === s.value}
                            onClick={() => setStatus(s.value)}
                            className={cn(
                                "h-9 rounded-4xl text-sm font-medium transition-colors",
                                status === s.value
                                    ? "bg-background shadow-sm"
                                    : "text-muted-foreground",
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <SearchX
                        aria-hidden="true"
                        className="size-10 text-muted-foreground/50"
                    />
                    <p className="text-muted-foreground">
                        {cards.length === 0
                            ? "Your dex is empty. Edit your dex settings to add some groups."
                            : "No species match."}
                    </p>
                    {filtering && (
                        <Button
                            variant="outline"
                            className="h-11"
                            onClick={clear}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {visible.map((card) => (
                        <SpeciesCard key={card.speciesId} card={card} />
                    ))}
                </ul>
            )}

            <LogSpeciesModal cards={cards} userId={userId} />
        </div>
    );
}

function Chip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                "h-9 shrink-0 rounded-4xl border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background",
            )}
        >
            {children}
        </button>
    );
}
