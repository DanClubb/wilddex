"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { savedDexUrl, subscribeDexView } from "@/lib/dex-view";

// "Back to your dex" on a species page. It goes to the dex as the user left it (same filters),
// and the grid then scrolls back to where they were. With nothing saved (they arrived by a
// direct link, say) it goes to the plain dex at the top.
//
// This is a real <Link> with the saved address as its href (rather than a click handler calling
// router.push) so the loading spinner inside it (useLinkStatus) keeps working.
export function BackToDex({
    href,
    className,
    children,
}: {
    href: string; // the dex page to fall back to, e.g. "/dex"
    className?: string;
    children: React.ReactNode;
}) {
    // sessionStorage doesn't exist on the server, so the server (and the first client render)
    // use the plain href and the saved one takes over straight after.
    const saved = useSyncExternalStore(
        subscribeDexView,
        savedDexUrl,
        () => null,
    );
    // Only trust it if it's for this dex (the shared dex uses a different path).
    const restoring = saved !== null && saved.split("?")[0] === href;
    const target = restoring ? saved : href;

    return (
        <Link
            href={target}
            transitionTypes={["nav-back"]}
            // Next scrolls to the top on navigation; the grid restores the saved position itself.
            scroll={!restoring}
            className={className}
        >
            {children}
        </Link>
    );
}
