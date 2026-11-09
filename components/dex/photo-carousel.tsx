"use client";

import { useState, useSyncExternalStore } from "react";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    useCarousel,
} from "@/components/ui/carousel";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
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
// Tapping a photo opens it full screen, in a slider that starts on that photo.
export function PhotoCarousel({
    photos,
    readOnly = false,
}: {
    photos: CarouselPhoto[];
    readOnly?: boolean; // a shared dex: no photo menu
}) {
    const many = photos.length > 1;
    // Index of the photo open full screen, or null when closed.
    const [viewing, setViewing] = useState<number | null>(null);
    return (
        <>
            <Carousel
                aria-label="Your photos"
                className="overflow-hidden rounded-3xl"
            >
                <CarouselContent className="ml-0">
                    {photos.map((p, i) => (
                        <CarouselItem
                            key={p.id}
                            className="relative aspect-square bg-muted pl-0"
                        >
                            {/* Signed private-bucket URLs, so next/image's optimiser can't be used. */}
                            {/* The button covers the photo only; the badge and menu sit on top of it. */}
                            <button
                                type="button"
                                aria-label="View photo full screen"
                                onClick={() => setViewing(i)}
                                className="block size-full cursor-zoom-in"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={p.src}
                                    alt={p.alt}
                                    loading={i === 0 ? "eager" : "lazy"}
                                    className="size-full object-cover"
                                    draggable={false}
                                />
                            </button>
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
            <Dialog
                open={viewing !== null}
                onOpenChange={(open) => !open && setViewing(null)}
            >
                <DialogContent
                    showCloseButton={false}
                    aria-describedby={undefined}
                    className="top-0 left-0 h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none bg-black p-0 ring-0 sm:max-w-none"
                >
                    <DialogTitle className="sr-only">Photo viewer</DialogTitle>
                    <Carousel
                        aria-label="Photos full screen"
                        opts={{ startIndex: viewing ?? 0 }}
                    >
                        <CarouselContent className="ml-0">
                            {photos.map((p) => (
                                <CarouselItem
                                    key={p.id}
                                    className="flex h-dvh items-center justify-center pl-0"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.src}
                                        alt={p.alt}
                                        className="size-full object-contain"
                                        draggable={false}
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {many && (
                            <>
                                <CarouselPrevious
                                    className={`left-2 ${CHEVRON}`}
                                />
                                <CarouselNext
                                    className={`right-2 ${CHEVRON}`}
                                />
                                <div className="pb-[env(safe-area-inset-bottom)]">
                                    <Dots count={photos.length} />
                                </div>
                            </>
                        )}
                    </Carousel>
                    <DialogClose asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 size-10 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
                        >
                            <XIcon />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>
        </>
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
