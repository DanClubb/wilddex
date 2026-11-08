"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { localToday } from "@/lib/photo-upload";
import { updateSighting } from "@/lib/photo-manage";

type Props = {
    entryId: string;
    seenOn: string;
    location: string | null;
    notes: string | null;
};

// "Edit" on the sighting card: change the date, place and notes.
export function EditSighting(props: Props) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil aria-hidden="true" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <EditForm {...props} onSaved={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function EditForm({
    entryId,
    seenOn,
    location,
    notes,
    onSaved,
}: Props & { onSaved: () => void }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [today] = useState(localToday);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const form = new FormData(event.currentTarget);
        setBusy(true);
        setError(null);
        const result = await updateSighting(entryId, {
            seenOn: String(form.get("seenOn") || seenOn),
            location: String(form.get("location") ?? ""),
            notes: String(form.get("notes") ?? ""),
        });
        setBusy(false);
        if (!result.ok) {
            setError(result.message);
            return;
        }
        toast.success("Sighting updated");
        router.refresh();
        onSaved();
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Edit sighting</DialogTitle>
                <DialogDescription>
                    Change when and where you saw it, or your notes.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="edit-seenOn">Date seen</Label>
                    <DatePicker
                        id="edit-seenOn"
                        name="seenOn"
                        defaultValue={seenOn}
                        max={today}
                        disabled={busy}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="edit-location">
                        Where{" "}
                        <span className="font-normal text-muted-foreground">
                            (optional)
                        </span>
                    </Label>
                    <Input
                        id="edit-location"
                        name="location"
                        maxLength={200}
                        defaultValue={location ?? ""}
                        autoComplete="off"
                        disabled={busy}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="edit-notes">
                        Notes{" "}
                        <span className="font-normal text-muted-foreground">
                            (optional)
                        </span>
                    </Label>
                    <Textarea
                        id="edit-notes"
                        name="notes"
                        rows={4}
                        maxLength={2000}
                        defaultValue={notes ?? ""}
                        disabled={busy}
                        className="text-base"
                    />
                </div>
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
                <Button
                    type="submit"
                    size="lg"
                    className="h-11 w-full"
                    disabled={busy}
                >
                    {busy ? (
                        <>
                            <Spinner aria-hidden="true" role="presentation" />
                            Saving…
                        </>
                    ) : (
                        "Save changes"
                    )}
                </Button>
            </form>
        </>
    );
}
