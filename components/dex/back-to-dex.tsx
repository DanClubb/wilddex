"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { readDexView } from "@/lib/dex-view";

// "Back to your dex" on a species page. It goes to the dex as the user left it (same filters),
// and the grid then scrolls back to where they were. With nothing saved (they arrived by a
// direct link, say) it goes to the plain dex at the top.
export function BackToDex({
    href,
    className,
    children,
}: {
    href: string; // the dex page to fall back to, e.g. "/dex"
    className?: string;
    children: React.ReactNode;
}) {
    const router = useRouter();

    return (
        <Link
            href={href}
            transitionTypes={["nav-back"]}
            onClick={(e) => {
                // Plain clicks only: a new-tab click should just open the plain link.
                if (
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.altKey ||
                    e.button !== 0
                )
                    return;
                const saved = readDexView();
                // Only trust it if it's for this dex (the shared dex uses a different path).
                if (!saved || saved.url.split("?")[0] !== href) return;
                e.preventDefault();
                // Next scrolls to the top on navigation; the grid restores the saved position itself.
                router.push(saved.url, {
                    scroll: false,
                    transitionTypes: ["nav-back"],
                });
            }}
            className={className}
        >
            {children}
        </Link>
    );
}
