"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/ui/spinner";

// Both must be rendered inside a <Link>: they show while that link's page is
// loading, so a tap always gets visible feedback even when the server is slow.

// Dims whatever it sits over (give the parent `relative`) and shows a spinner.
// Waits a beat before appearing so fast navigations don't flash it.
export function PendingOverlay() {
    const { pending } = useLinkStatus();
    if (!pending) return null;
    return (
        <span className="absolute inset-0 z-10 flex animate-in items-center justify-center bg-background/60 duration-200 fade-in delay-150 fill-mode-backwards">
            <Spinner
                aria-hidden="true"
                role="presentation"
                className="size-7"
            />
        </span>
    );
}

// Swaps a link's icon for a spinner while it loads.
export function PendingIcon({ children }: { children: React.ReactNode }) {
    const { pending } = useLinkStatus();
    return pending ? (
        <Spinner aria-hidden="true" role="presentation" />
    ) : (
        children
    );
}
