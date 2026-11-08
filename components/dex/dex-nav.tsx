import { LogOut, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { PendingIcon } from "./link-pending";

// Account actions, kept above the dex like navigation.
export function DexNav() {
    return (
        <nav
            aria-label="Dex"
            className="flex items-center justify-between gap-2"
        >
            <Button asChild variant="default" size="sm" className="h-9">
                <Link href="/setup">
                    <PendingIcon>
                        <SlidersHorizontal aria-hidden="true" />
                    </PendingIcon>
                    Edit dex settings
                </Link>
            </Button>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <form action="/auth/signout" method="post">
                    <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        className="h-9"
                    >
                        <LogOut aria-hidden="true" />
                        Sign out
                    </Button>
                </form>
            </div>
        </nav>
    );
}
