"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { DexCard } from "@/lib/dex";
import { closeLog, resetLogState } from "@/lib/log-url";
import { UploadForm } from "./photo-uploader";

// Opens when the URL is /dex?log=<slug> for a species that hasn't been found yet.
// After a successful log it moves on to the species page, with the first photo
// morphing into the page's photo (a view transition).
export function LogSpeciesModal({ cards, userId }: { cards: DexCard[]; userId: string }) {
    const router = useRouter();
    const slug = useSearchParams().get("log");
    const card = slug ? cards.find((c) => c.slug === slug && !c.found) : undefined;

    useEffect(() => {
        if (!card) resetLogState();
    }, [card]);

    return (
        <Dialog open={!!card} onOpenChange={(open) => !open && closeLog()}>
            <DialogContent>
                {card && (
                    <UploadForm
                        userId={userId}
                        speciesId={card.speciesId}
                        speciesName={card.name}
                        entryId={null}
                        transitionName={`species-${card.slug}`}
                        onSaved={() => {
                            resetLogState();
                            router.push(`/dex/${card.slug}`, { transitionTypes: ["nav-forward"] });
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
