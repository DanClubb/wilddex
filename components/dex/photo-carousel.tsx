"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type CarouselPhoto = { id: string; src: string; alt: string };

// Swipeable photo slider. Controls and dots only appear when there's more than one photo.
export function PhotoCarousel({ photos }: { photos: CarouselPhoto[] }) {
  const many = photos.length > 1;
  return (
    <Carousel aria-label="Your photos">
      <CarouselContent>
        {photos.map((p, i) => (
          <CarouselItem key={p.id} className="aspect-4/3 bg-muted">
            {/* Signed private-bucket URLs, so next/image's optimiser can't be used. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt={p.alt}
              loading={i === 0 ? "eager" : "lazy"}
              className="size-full object-cover"
              draggable={false}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {many && (
        <>
          <CarouselPrevious />
          <CarouselNext />
          <Dots count={photos.length} />
        </>
      )}
    </Carousel>
  );
}

function Dots({ count }: { count: number }) {
  const { api, selectedIndex } = useCarousel();
  return (
    <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to photo ${i + 1}`}
          aria-current={i === selectedIndex}
          onClick={() => api?.scrollTo(i)}
          className={cn(
            "size-2 rounded-full bg-background/60 shadow transition-all",
            i === selectedIndex && "w-5 bg-background",
          )}
        />
      ))}
    </div>
  );
}
