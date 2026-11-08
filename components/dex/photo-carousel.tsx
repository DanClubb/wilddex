"use client";

import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { PhotoMenu } from "./photo-menu";

// The default outline button turns transparent in dark mode, which lets the
// photo show through. A solid backdrop and shadow keep the arrows readable on
// any image, light or dark, in both themes.
const CHEVRON =
    "size-10 border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm hover:bg-background disabled:opacity-0 dark:bg-background/90 dark:hover:bg-background";

export type CarouselPhoto = {
    id: string;
    src: string;
    alt: string;
    isCover: boolean;
};

// Swipeable photo slider. Controls and dots only appear when there's more than
// one photo. Each photo has a menu to set it as the cover or delete it.
export function PhotoCarousel({
    photos,
    readOnly = false,
}: {
    photos: CarouselPhoto[];
    readOnly?: boolean; // a shared dex: no photo menu
}) {
    const many = photos.length > 1;
    return (
        <Carousel
            aria-label="Your photos"
            className="overflow-hidden rounded-3xl"
        >
            <CarouselContent className="ml-0">
                {photos.map((p, i) => (
                    <CarouselItem
                        key={p.id}
                        className="relative aspect-4/3 bg-muted pl-0"
                    >
                        {/* Signed private-bucket URLs, so next/image's optimiser can't be used. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={p.src}
                            alt={p.alt}
                            loading={i === 0 ? "eager" : "lazy"}
                            className="size-full object-cover"
                            draggable={false}
                        />
                        {p.isCover && (
                            <Badge
                                className="absolute top-3 left-3"
                                variant="secondary"
                            >
                                Cover
                            </Badge>
                        )}
                        {!readOnly && (
                            <PhotoMenu
                                photoId={p.id}
                                isCover={p.isCover}
                                isOnly={!many}
                            />
                        )}
                    </CarouselItem>
                ))}
            </CarouselContent>
            {many && (
                <>
                    <CarouselPrevious className={`left-2 ${CHEVRON}`} />
                    <CarouselNext className={`right-2 ${CHEVRON}`} />
                    <Dots count={photos.length} />
                </>
            )}
        </Carousel>
    );
}

// The selected slide lives inside the carousel library, so it is read through
// useSyncExternalStore (the React way to follow an outside value).
function useSelectedIndex() {
    const { api } = useCarousel();
    return useSyncExternalStore(
        (notify) => {
            api?.on("select", notify).on("reInit", notify);
            return () => {
                api?.off("select", notify).off("reInit", notify);
            };
        },
        () => api?.selectedScrollSnap() ?? 0,
        () => 0,
    );
}

function Dots({ count }: { count: number }) {
    const { api } = useCarousel();
    const selected = useSelectedIndex();
    return (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {Array.from({ length: count }, (_, i) => (
                <button
                    key={i}
                    type="button"
                    aria-label={`Go to photo ${i + 1}`}
                    aria-current={i === selected}
                    onClick={() => api?.scrollTo(i)}
                    className={cn(
                        "size-2 rounded-full bg-white/60 shadow-md ring-1 ring-black/10 transition-all",
                        i === selected && "w-5 bg-white",
                    )}
                />
            ))}
        </div>
    );
}
