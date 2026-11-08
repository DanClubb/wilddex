"use client";

import { Camera, CircleHelp, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useRef, useState, ViewTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { addPhotos, localToday, logSighting } from "@/lib/photo-upload";

const MAX_PHOTOS = 10;

type Picked = { id: string; file: File; previewUrl: string };

type Props = {
    userId: string;
    speciesId: number;
    speciesName: string;
    // null until the species has been found; then more photos are added to it.
    entryId: string | null;
    // Hunting hints for a species not found yet.
    clues?: { habitat: string | null; bestTime: string | null };
};

// A button that opens a modal for logging a first sighting (a photo is required)
// or adding photos to an existing one.
export function PhotoUploader(props: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const firstLog = props.entryId === null;
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="h-11 w-full">
                    <Plus aria-hidden="true" />
                    {firstLog ? "Log a sighting" : "Add more photos"}
                </Button>
            </DialogTrigger>
            {/* Unmounts when closed, so unsaved choices and previews are discarded. */}
            <DialogContent>
                <UploadForm
                    {...props}
                    onSaved={(complete) => {
                        // Re-reads the page on the server so the new photos (and the unlocked
                        // species) appear. Safe even after a partial failure.
                        router.refresh();
                        if (complete) {
                            toast.success("Photos added");
                            setOpen(false);
                        }
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}

// The form itself, shared by the species page and the dex grid's log modal.
// onSaved runs after any photos were saved; `complete` is false if some failed.
// transitionName, when given, lets the first preview morph into the species
// page's photo when the caller navigates there.
export function UploadForm({
    userId,
    speciesId,
    speciesName,
    entryId,
    clues,
    onSaved,
    transitionName,
}: Props & {
    onSaved: (complete: boolean) => void;
    transitionName?: string;
}) {
    const [picked, setPicked] = useState<Picked[]>([]);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Previews are object URLs, which must be released or they leak memory.
    const latest = useRef(picked);
    useEffect(() => {
        latest.current = picked;
    }, [picked]);
    useEffect(
        () => () =>
            latest.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)),
        [],
    );

    const firstLog = entryId === null;

    function choose(event: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        // Clear the input so choosing the same photo again still fires a change.
        event.target.value = "";
        if (files.length === 0) return;

        setError(null);
        const room = MAX_PHOTOS - picked.length;
        if (files.length > room) {
            setError(`You can add up to ${MAX_PHOTOS} photos at a time.`);
        }
        const added = files.slice(0, Math.max(room, 0)).map((file) => ({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setPicked((current) => [...current, ...added]);
    }

    function remove(id: string) {
        setPicked((current) => {
            const gone = current.find((p) => p.id === id);
            if (gone) URL.revokeObjectURL(gone.previewUrl);
            return current.filter((p) => p.id !== id);
        });
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy || picked.length === 0) return;

        const form = new FormData(event.currentTarget);
        const files = picked.map((p) => p.file);
        setBusy(true);
        setError(null);
        setProgress({ done: 0, total: files.length });

        const onProgress = (done: number, total: number) =>
            setProgress({ done, total });
        const result = firstLog
            ? await logSighting(
                  userId,
                  speciesId,
                  files,
                  {
                      seenOn: String(form.get("seenOn") ?? ""),
                      location: String(form.get("location") ?? ""),
                      notes: String(form.get("notes") ?? ""),
                  },
                  onProgress,
              )
            : await addPhotos(userId, entryId, files, onProgress);

        if (result.ok) {
            // Everything saved. Leave the previews and the busy state as they are: the
            // caller closes the dialog or navigates away, and a preview that is still on
            // screen is what the view transition morphs into the species page.
            onSaved(true);
            return;
        }

        // Some photos failed. Saved ones leave the list; the rest can be retried.
        setPicked((current) => {
            current
                .slice(0, result.saved)
                .forEach((p) => URL.revokeObjectURL(p.previewUrl));
            return current.slice(result.saved);
        });
        setError(result.message);
        setBusy(false);
        if (result.saved > 0) onSaved(false);
    }

    const count = picked.length;

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {firstLog ? "Log a sighting" : "Add more photos"}
                </DialogTitle>
                <DialogDescription>
                    {firstLog
                        ? `Add a photo of your ${speciesName} to unlock it. The first photo becomes its cover.`
                        : "Seen it again? Add another photo to this species."}
                </DialogDescription>
            </DialogHeader>

            {firstLog && <Clues clues={clues} />}

            <form onSubmit={submit} className="space-y-4">
                <label className="relative flex h-11 cursor-pointer items-center justify-center gap-2 rounded-4xl border border-input bg-input/30 px-4 text-sm font-medium has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30 has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
                    <Camera aria-hidden="true" className="size-5" />
                    {count === 0 ? "Choose photos" : "Add more"}
                    {/* image/* lets phones offer the camera as well as the photo library. */}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={choose}
                        disabled={busy || count >= MAX_PHOTOS}
                    />
                </label>

                {count > 0 && (
                    <ul className="grid grid-cols-3 gap-2">
                        {picked.map((p, i) => (
                            <li
                                key={p.id}
                                className="relative aspect-square overflow-hidden rounded-2xl bg-muted"
                            >
                                {/* A local preview of a chosen file; next/image can't optimise it. */}
                                {(() => {
                                    const img = (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={p.previewUrl}
                                            alt={`Selected photo ${i + 1}`}
                                            className="size-full object-cover"
                                        />
                                    );
                                    return firstLog &&
                                        i === 0 &&
                                        transitionName ? (
                                        <ViewTransition
                                            name={transitionName}
                                            share="morph"
                                            default="none"
                                        >
                                            {img}
                                        </ViewTransition>
                                    ) : (
                                        img
                                    );
                                })()}
                                {firstLog && i === 0 && (
                                    <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
                                        Cover
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => remove(p.id)}
                                    disabled={busy}
                                    aria-label={`Remove photo ${i + 1}`}
                                    className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/90 disabled:opacity-50"
                                >
                                    <X aria-hidden="true" className="size-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {count > 0 && firstLog && <DetailsFields disabled={busy} />}

                {busy && (
                    <p
                        role="status"
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                        <Spinner aria-hidden="true" role="presentation" />
                        Saving photo{" "}
                        {Math.min(progress.done + 1, progress.total)} of{" "}
                        {progress.total}…
                    </p>
                )}
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}

                {count > 0 && (
                    <Button
                        type="submit"
                        className="h-11 w-full"
                        disabled={busy}
                    >
                        {busy ? (
                            <>
                                <Spinner
                                    aria-hidden="true"
                                    role="presentation"
                                />
                                Saving…
                            </>
                        ) : firstLog ? (
                            "Log sighting"
                        ) : (
                            `Add ${count} ${count === 1 ? "photo" : "photos"}`
                        )}
                    </Button>
                )}
            </form>
        </>
    );
}

// Only mounted once a photo is chosen, so "today" is worked out in the browser,
// never during server rendering (where it could be a different day or zone).
function DetailsFields({ disabled }: { disabled: boolean }) {
    const [today] = useState(localToday);
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label htmlFor="seenOn">Date seen</Label>
                <DatePicker
                    id="seenOn"
                    name="seenOn"
                    defaultValue={today}
                    max={today}
                    disabled={disabled}
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="location">
                    Where{" "}
                    <span className="font-normal text-muted-foreground">
                        (optional)
                    </span>
                </Label>
                <Input
                    id="location"
                    name="location"
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Ruislip Woods"
                    autoComplete="off"
                    disabled={disabled}
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="notes">
                    Notes{" "}
                    <span className="font-normal text-muted-foreground">
                        (optional)
                    </span>
                </Label>
                <Textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    maxLength={2000}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

// Where-to-look hints, shown on a species that hasn't been found yet.
function Clues({ clues }: { clues: Props["clues"] }) {
    const rows = [
        { label: "Habitat", text: clues?.habitat },
        { label: "Best time", text: clues?.bestTime },
    ].filter((r) => r.text);
    if (rows.length === 0) return null;
    return (
        <dl className="space-y-2 rounded-2xl bg-muted p-3 text-sm">
            {rows.map((r) => (
                <div key={r.label} className="flex gap-2.5">
                    <CircleHelp
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <div>
                        <dt className="font-medium">{r.label}</dt>
                        <dd className="text-muted-foreground">{r.text}</dd>
                    </div>
                </div>
            ))}
        </dl>
    );
}
