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
        return {
            status: "error",
            message:
                error.status === 429
                    ? "Too many attempts. Wait a minute and try again."
                    : // Same message for a wrong email and a wrong password, on purpose.
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
        return {
            status: "error",
            message:
                error.status === 429
                    ? "Too many attempts. Wait a minute and try again."
                    : "We couldn't create your account. Try again in a moment.",
        };
    }

    // With "Confirm email" off, signing up also signs in. With it on there is no
    // session yet: the person has to click the link in the email first.
    if (!data.session) return { status: "confirm", email };

    redirect("/dex");
}
