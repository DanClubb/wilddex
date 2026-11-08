"use server";

import { redirect } from "next/navigation";
import { MAX_PASSWORD, MIN_PASSWORD } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState =
    | { status: "idle" }
    | { status: "error"; message: string }
    // Only when the Supabase project has "Confirm email" switched on.
    | { status: "confirm"; email: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthFailure = { code?: string; status?: number; message: string };

// Supabase has two different "429 too many requests" errors, and they need
// different advice. Turns an auth error into a message a person can act on, and
// logs the real code on the server so it can be diagnosed.
function describeRateLimit(
    action: string,
    error: AuthFailure,
): string | null {
    if (error.code === "over_email_send_rate_limit") {
        // Almost always means "Confirm email" is still on in Supabase: sign-up is
        // trying to send an email, and the built-in sender allows only a few an hour.
        console.error(`${action}: email send limit reached (${error.message})`);
        return "We can't send any more emails right now, so we can't finish that. Try again in an hour.";
    }
    if (error.code === "over_request_rate_limit" || error.status === 429) {
        console.error(`${action}: request rate limit (${error.code ?? error.message})`);
        return "Too many attempts from your connection. Wait a minute and try again.";
    }
    return null;
}

function readCredentials(formData: FormData) {
    const email = String(formData.get("email") ?? "")
        .trim()
        .toLowerCase();
    // Never trim or alter a password: spaces may be part of it.
    const password = String(formData.get("password") ?? "");
    return { email, password };
}

export async function signIn(
    _previous: AuthState,
    formData: FormData,
): Promise<AuthState> {
    const { email, password } = readCredentials(formData);

    if (!EMAIL_PATTERN.test(email)) {
        return { status: "error", message: "Enter a valid email address." };
    }
    if (!password) {
        return { status: "error", message: "Enter your password." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        if (error.code === "email_not_confirmed") {
            return {
                status: "error",
                message: "Confirm your email first. Check your inbox for the link.",
            };
        }
        const limited = describeRateLimit("signIn", error);
        if (limited) return { status: "error", message: limited };
        if (error.code !== "invalid_credentials") {
            console.error("signIn failed", error.code, error.message);
        }
        return {
            status: "error",
            message:
                // Same message for a wrong email and a wrong password, on purpose.
                error.code === "invalid_credentials"
                    ? "That email and password don't match."
                    : "We couldn't sign you in. Try again in a moment.",
        };
    }

    // redirect() throws, so keep it outside any try/catch.
    redirect("/dex");
}

export async function signUp(
    _previous: AuthState,
    formData: FormData,
): Promise<AuthState> {
    const { email, password } = readCredentials(formData);

    if (!EMAIL_PATTERN.test(email)) {
        return { status: "error", message: "Enter a valid email address." };
    }
    if (password.length < MIN_PASSWORD) {
        return {
            status: "error",
            message: `Use at least ${MIN_PASSWORD} characters for your password.`,
        };
    }
    if (password.length > MAX_PASSWORD) {
        return {
            status: "error",
            message: `Use ${MAX_PASSWORD} characters or fewer for your password.`,
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // Only used if "Confirm email" is on: where the confirmation link lands.
            emailRedirectTo: `${
                process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
            }/auth/confirm`,
        },
    });

    if (error) {
        if (error.code === "user_already_exists") {
            return {
                status: "error",
                message: "An account with that email already exists. Try signing in.",
            };
        }
        if (error.code === "weak_password") {
            return {
                status: "error",
                message: "That password is too easy to guess. Try a longer or less common one.",
            };
        }
        const limited = describeRateLimit("signUp", error);
        if (limited) return { status: "error", message: limited };
        console.error("signUp failed", error.code, error.message);
        return {
            status: "error",
            message: "We couldn't create your account. Try again in a moment.",
        };
    }

    // With "Confirm email" off, signing up also signs in. With it on there is no
    // session yet: the person has to click the link in the email first.
    if (!data.session) return { status: "confirm", email };

    redirect("/dex");
}
