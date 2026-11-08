import { createClient } from "@/lib/supabase/client";

// Changes to photos and sightings the user has already logged. The database
// functions do the checking (ownership, "an entry always has a cover"); this
// file is just the browser-side calls.

const BUCKET = "entry-photos";

export type ManageResult = { ok: true } | { ok: false; message: string };

const FAILED = "Something went wrong. Please try again.";

export async function setCoverPhoto(photoId: string): Promise<ManageResult> {
    const { error } = await createClient().rpc("set_cover_photo", {
        p_photo_id: photoId,
    });
    return error ? { ok: false, message: FAILED } : { ok: true };
}

// Deleting the last photo also deletes the entry (the species goes back to
// "not found"), so the caller should warn first. The database returns the two
// file paths; removing the files is best effort (a leftover file is harmless
// and invisible, a failed database delete is not).
export async function deletePhoto(photoId: string): Promise<ManageResult> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("delete_entry_photo", {
        p_photo_id: photoId,
    });
    if (error) return { ok: false, message: FAILED };
    if (data?.length) await supabase.storage.from(BUCKET).remove(data);
    return { ok: true };
}

export type SightingEdit = { seenOn: string; location: string; notes: string };

export async function updateSighting(
    entryId: string,
    edit: SightingEdit,
): Promise<ManageResult> {
    const { error } = await createClient()
        .from("entries")
        .update({
            first_seen_on: edit.seenOn,
            location_text: edit.location.trim() || null,
            notes: edit.notes.trim() || null,
        })
        .eq("id", entryId);
    return error ? { ok: false, message: FAILED } : { ok: true };
}
