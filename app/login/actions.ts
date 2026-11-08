"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
    | { status: "idle" }
    | { status: "sent"; email: string }
    | { status: "error"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sends a magic link. Signs the person up automatically if they're new.
export async function sendMagicLink(
    _previous: LoginState,
    formData: FormData,
): Promise<LoginState> {
    const email = String(formData.get("email") ?? "")
        .trim()
        .toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
        return { status: "error", message: "Enter a valid email address." };
    }

    // The link must point at a URL on Supabase's redirect allow-list.
    const origin =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (await headers()).get("origin") ??
        "http://localhost:3000";

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/confirm` },
    });

    if (error) {
        return {
            status: "error",
            message:
                error.status === 429
                    ? "Too many requests. Wait a minute and try again."
                    : "We couldn't send the link. Try again in a moment.",
        };
    }

    return { status: "sent", email };
}
