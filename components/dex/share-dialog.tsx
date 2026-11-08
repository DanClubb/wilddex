"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export type ShareState = { token: string; showDetails: boolean } | null;

// Share button in the nav: switch the read-only link on or off and choose
// whether notes and places are included.
export function ShareDialog({ share }: { share: ShareState }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="size-9">
                    <Share2 aria-hidden="true" />
                    <span className="sr-only">Share your dex</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <ShareForm initial={share} />
            </DialogContent>
        </Dialog>
    );
}

const OPTIONS = [
    { value: false, label: "Photos only" },
    { value: true, label: "Photos + notes & places" },
] as const;

function ShareForm({ initial }: { initial: ShareState }) {
    const router = useRouter();
    const [token, setToken] = useState(initial?.token ?? null);
    const [showDetails, setShowDetails] = useState(
        initial?.showDetails ?? false,
    );
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    // This form only mounts once the dialog is open, in the browser.
    const [origin] = useState(() => window.location.origin);
    const [canShare] = useState(
        () => typeof navigator !== "undefined" && "share" in navigator,
    );

    const url = token ? `${origin}/s/${token}` : "";

    async function save(enabled: boolean, details: boolean) {
        setBusy(true);
        const { data, error } = await createClient().rpc("set_sharing", {
            p_enabled: enabled,
            p_show_details: details,
        });
        setBusy(false);
        if (error) {
            toast.error("Something went wrong. Please try again.");
            return;
        }
        setToken(enabled ? data : null);
        setShowDetails(details);
        router.refresh(); // so reopening the dialog starts from the saved state
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Link copied");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy. Select the link and copy it by hand.");
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Share your dex</DialogTitle>
                <DialogDescription>
                    Anyone with the link can browse your dex and see your
                    photos. They don&apos;t need to sign in, and can&apos;t
                    change anything.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
                <p className="text-sm font-medium" id="share-includes">
                    What to include
                </p>
                <div
                    className="grid grid-cols-2 gap-1 rounded-4xl bg-muted p-1"
                    role="group"
                    aria-labelledby="share-includes"
                >
                    {OPTIONS.map((o) => (
                        <button
                            key={String(o.value)}
                            type="button"
                            aria-pressed={showDetails === o.value}
                            disabled={busy}
                            onClick={() =>
                                o.value !== showDetails &&
                                (token
                                    ? save(true, o.value)
                                    : setShowDetails(o.value))
                            }
                            className={cn(
                                "min-h-9 rounded-4xl px-2 text-sm font-medium transition-colors disabled:opacity-50",
                                showDetails === o.value
                                    ? "bg-background shadow-sm"
                                    : "text-muted-foreground",
                            )}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    {showDetails
                        ? "Visitors will see the notes and place you wrote for each sighting."
                        : "Notes and places stay private (people sometimes write things like “behind my house”)."}
                </p>
            </div>

            {token ? (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input
                            readOnly
                            value={url}
                            aria-label="Share link"
                            onFocus={(e) => e.currentTarget.select()}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-11 shrink-0"
                            onClick={copy}
                        >
                            {copied ? (
                                <Check aria-hidden="true" />
                            ) : (
                                <Copy aria-hidden="true" />
                            )}
                            <span className="sr-only">Copy link</span>
                        </Button>
                    </div>
                    {canShare && (
                        <Button
                            type="button"
                            size="lg"
                            className="h-11 w-full"
                            onClick={() =>
                                navigator
                                    .share({ title: "My WildDex", url })
                                    .catch(() => {})
                            }
                        >
                            <Share2 aria-hidden="true" />
                            Share…
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="destructive"
                        size="lg"
                        className="h-11 w-full"
                        disabled={busy}
                        onClick={() => save(false, showDetails)}
                    >
                        {busy && (
                            <Spinner aria-hidden="true" role="presentation" />
                        )}
                        Stop sharing
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Stopping makes the link stop working straight away.
                        Sharing again creates a new link.
                    </p>
                </div>
            ) : (
                <Button
                    type="button"
                    size="lg"
                    className="h-11 w-full"
                    disabled={busy}
                    onClick={() => save(true, showDetails)}
                >
                    {busy ? (
                        <Spinner aria-hidden="true" role="presentation" />
                    ) : (
                        <Share2 aria-hidden="true" />
                    )}
                    Create share link
                </Button>
            )}
        </>
    );
}
