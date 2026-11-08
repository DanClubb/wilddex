"use client";

import { Ellipsis, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { deletePhoto, setCoverPhoto } from "@/lib/photo-manage";

// The "..." on a photo: make it the cover, or delete it (after a confirmation).
export function PhotoMenu({
    photoId,
    isCover,
    isOnly,
}: {
    photoId: string;
    isCover: boolean;
    isOnly: boolean; // the only photo: deleting it removes the species from the collection
}) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);

    async function makeCover() {
        const result = await setCoverPhoto(photoId);
        if (result.ok) {
            toast.success("Cover photo updated");
            router.refresh();
        } else toast.error(result.message);
    }

    async function remove() {
        setBusy(true);
        const result = await deletePhoto(photoId);
        if (!result.ok) {
            setBusy(false);
            toast.error(result.message);
            return;
        }
        if (isOnly) {
            toast.success("Removed from your collection");
            router.push("/dex", { transitionTypes: ["nav-back"] });
        } else {
            toast.success("Photo deleted");
            setConfirming(false);
            setBusy(false);
            router.refresh();
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 size-9 rounded-full shadow"
                    >
                        <Ellipsis aria-hidden="true" />
                        <span className="sr-only">Photo options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={isCover} onSelect={makeCover}>
                        <Star aria-hidden="true" />
                        {isCover ? "This is the cover" : "Set as cover"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setConfirming(true)}
                    >
                        <Trash2 aria-hidden="true" />
                        Delete photo
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
                open={confirming}
                onOpenChange={(open) => !busy && setConfirming(open)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isOnly
                                ? "This is your only photo of this species. Deleting it removes the species from your collection, along with your sighting details."
                                : "This can't be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>
                            Keep it
                        </AlertDialogCancel>
                        {/* A plain Button, not AlertDialogAction, so the dialog stays open while deleting. */}
                        <Button
                            variant="destructive"
                            onClick={remove}
                            disabled={busy}
                        >
                            {busy && (
                                <Spinner
                                    aria-hidden="true"
                                    role="presentation"
                                />
                            )}
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
