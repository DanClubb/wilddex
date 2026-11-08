import { createClient } from "@/lib/supabase/client";
import { makePhotoPair, ImageReadError } from "@/lib/images";

// The browser-side half of logging a sighting: prepare the photo, put the two
// files in the private bucket under the user's own folder, then tell the database
// (through log_entry / add_entry_photo, which enforce the rules).

const BUCKET = "entry-photos";

export type SightingDetails = {
    seenOn: string; // YYYY-MM-DD; empty means today
    location: string;
    notes: string;
};

// Today's date where the person is (not UTC), formatted for a date column.
export function localToday(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}

export type UploadProgress = (done: number, total: number) => void;

export type UploadResult =
    | { ok: true; saved: number }
    // `saved` photos made it before the failure, so the page should still refresh.
    | { ok: false; saved: number; message: string };

type Supabase = ReturnType<typeof createClient>;

// Uploads both files. If the second fails, the first is removed again so no
// orphan is left in storage.
async function uploadPair(
    supabase: Supabase,
    userId: string,
    file: File,
): Promise<{ storagePath: string; thumbPath: string }> {
    const { full, thumb } = await makePhotoPair(file);
    const id = crypto.randomUUID();
    const storagePath = `${userId}/${id}.jpg`;
    const thumbPath = `${userId}/${id}-thumb.jpg`;
    const options = { contentType: "image/jpeg", upsert: false };

    const first = await supabase.storage.from(BUCKET).upload(storagePath, full, options);
    if (first.error) throw first.error;
    const second = await supabase.storage.from(BUCKET).upload(thumbPath, thumb, options);
    if (second.error) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw second.error;
    }
    return { storagePath, thumbPath };
}

async function removeFiles(supabase: Supabase, paths: { storagePath: string; thumbPath: string }) {
    // Best effort: a leftover file is harmless clutter, not a reason to hide the real error.
    await supabase.storage.from(BUCKET).remove([paths.storagePath, paths.thumbPath]);
}

function describe(error: unknown): string {
    if (error instanceof ImageReadError) {
        return "We couldn't read that image. Try a JPEG or PNG.";
    }
    const code = (error as { code?: string })?.code;
    if (code === "23505") return "You've already logged this species.";
    return "Something went wrong saving your photo. Please try again.";
}

// First sighting: creates the entry (first photo = cover), then adds any other
// photos to it.
export async function logSighting(
    userId: string,
    speciesId: number,
    files: File[],
    details: SightingDetails,
    onProgress: UploadProgress,
): Promise<UploadResult> {
    const supabase = createClient();
    let saved = 0;
    let entryId: string | null = null;

    for (const [index, file] of files.entries()) {
        onProgress(index, files.length);
        let paths;
        try {
            paths = await uploadPair(supabase, userId, file);
        } catch (error) {
            return { ok: false, saved, message: describe(error) };
        }

        if (entryId === null) {
            const { data, error } = await supabase.rpc("log_entry", {
                p_species_id: speciesId,
                p_first_seen_on: details.seenOn || localToday(),
                p_location_text: details.location,
                p_notes: details.notes,
                p_storage_path: paths.storagePath,
                p_thumb_path: paths.thumbPath,
            });
            if (error || !data) {
                await removeFiles(supabase, paths);
                return { ok: false, saved, message: describe(error) };
            }
            entryId = data;
        } else {
            const { error } = await supabase.rpc("add_entry_photo", {
                p_entry_id: entryId,
                p_storage_path: paths.storagePath,
                p_thumb_path: paths.thumbPath,
            });
            if (error) {
                await removeFiles(supabase, paths);
                return { ok: false, saved, message: describe(error) };
            }
        }
        saved++;
    }
    onProgress(files.length, files.length);
    return { ok: true, saved };
}

// Later sightings: more photos for an entry that already exists.
export async function addPhotos(
    userId: string,
    entryId: string,
    files: File[],
    onProgress: UploadProgress,
): Promise<UploadResult> {
    const supabase = createClient();
    let saved = 0;

    for (const [index, file] of files.entries()) {
        onProgress(index, files.length);
        let paths;
        try {
            paths = await uploadPair(supabase, userId, file);
        } catch (error) {
            return { ok: false, saved, message: describe(error) };
        }
        const { error } = await supabase.rpc("add_entry_photo", {
            p_entry_id: entryId,
            p_storage_path: paths.storagePath,
            p_thumb_path: paths.thumbPath,
        });
        if (error) {
            await removeFiles(supabase, paths);
            return { ok: false, saved, message: describe(error) };
        }
        saved++;
    }
    onProgress(files.length, files.length);
    return { ok: true, saved };
}
