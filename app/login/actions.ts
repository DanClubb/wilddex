"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
    | { status: "idle" }
    | { status: "sent"; email: string }
    | { status: "error"; message: string };

export type VerifyState =
    | { status: "idle" }
    | { status: "error"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Supabase codes are 6 digits by default and can be configured up to 10.
const CODE_PATTERN = /^\d{6,10}$/;

// Emails the person a sign-in link AND a code (once the Supabase email template
// includes {{ .Token }}). Signs the person up automatically if they're new.
//
// Why a code as well as a link: when WildDex is installed on a phone's home
// screen, the installed app and the browser keep separate storage, so a link
// opened from the email app cannot sign the installed app in. A code typed into
// the app itself always works.
export async function sendSignInEmail(
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
                    : "We couldn't send the email. Try again in a moment.",
        };
    }

    return { status: "sent", email };
}

// Checks the code and starts the session. Runs on the server, so the session
// cookies are set by this response and the app is signed in straight away.
export async function verifyCode(
    _previous: VerifyState,
    formData: FormData,
): Promise<VerifyState> {
    const email = String(formData.get("email") ?? "")
        .trim()
        .toLowerCase();
    // People paste codes with spaces ("123 456"), so strip anything that isn't a digit.
    const token = String(formData.get("code") ?? "").replace(/\D/g, "");

    if (!EMAIL_PATTERN.test(email)) {
        return { status: "error", message: "Something went wrong. Start again." };
    }
    if (!CODE_PATTERN.test(token)) {
        return { status: "error", message: "Enter the code from the email." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
    });

    if (error) {
        return {
            status: "error",
            message:
                error.status === 429
                    ? "Too many attempts. Wait a minute and try again."
                    : "That code didn't work or has expired. Check it, or go back and request a new one.",
        };
    }

    // redirect() throws, so keep it outside any try/catch.
    redirect("/dex");
}
