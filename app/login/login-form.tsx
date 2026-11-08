"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MIN_PASSWORD } from "@/lib/auth";
import { signIn, signUp, type AuthState } from "./actions";

const initial: AuthState = { status: "idle" };

type Mode = "signin" | "signup";

export function LoginForm() {
    const [mode, setMode] = useState<Mode>("signin");

    return (
        <div className="space-y-6">
            <div
                className="grid grid-cols-2 gap-1 rounded-4xl bg-muted p-1"
                role="group"
                aria-label="Sign in or create an account"
            >
                {(
                    [
                        ["signin", "Sign in"],
                        ["signup", "Create account"],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={mode === value}
                        onClick={() => setMode(value)}
                        className={cn(
                            "h-9 rounded-4xl text-sm font-medium transition-colors",
                            mode === value
                                ? "bg-background shadow-sm"
                                : "text-muted-foreground",
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* key makes each mode a fresh form, so errors don't carry across. */}
            {mode === "signin" ? (
                <CredentialsForm key="signin" mode="signin" />
            ) : (
                <CredentialsForm key="signup" mode="signup" />
            )}
        </div>
    );
}

function CredentialsForm({ mode }: { mode: Mode }) {
    const signingUp = mode === "signup";
    const [state, formAction, pending] = useActionState(
        signingUp ? signUp : signIn,
        initial,
    );
    const [show, setShow] = useState(false);
    // Controlled on purpose: React clears an uncontrolled form after every
    // submit, so a typo'd password would also wipe the email field.
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    if (state.status === "confirm") {
        return (
            <div className="space-y-3 text-center" role="status">
                <h2 className="text-xl font-semibold">Check your email</h2>
                <p className="text-muted-foreground">
                    We sent a confirmation link to{" "}
                    <span className="font-medium text-foreground">{state.email}</span>
                    . Open it, then come back and sign in.
                </p>
            </div>
        );
    }

    const error = state.status === "error" ? state.message : null;

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                    Email address
                </label>
                <Input
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    required
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                    Password
                </label>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={show ? "text" : "password"}
                        // These hints let phone and browser password managers offer to
                        // save, fill or suggest a strong password.
                        autoComplete={signingUp ? "new-password" : "current-password"}
                        minLength={signingUp ? MIN_PASSWORD : undefined}
                        required
                        aria-invalid={!!error}
                        aria-describedby={
                            [signingUp ? "password-hint" : null, error ? "auth-error" : null]
                                .filter(Boolean)
                                .join(" ") || undefined
                        }
                        className="pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        aria-label={show ? "Hide password" : "Show password"}
                        aria-pressed={show}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-full text-muted-foreground"
                    >
                        {show ? (
                            <EyeOff aria-hidden="true" className="size-5" />
                        ) : (
                            <Eye aria-hidden="true" className="size-5" />
                        )}
                    </button>
                </div>
                {signingUp && (
                    <p id="password-hint" className="text-sm text-muted-foreground">
                        At least {MIN_PASSWORD} characters.
                    </p>
                )}
            </div>

            {error && (
                <p id="auth-error" role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}

            <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
                {pending
                    ? signingUp
                        ? "Creating account…"
                        : "Signing in…"
                    : signingUp
                      ? "Create account"
                      : "Sign in"}
            </Button>
        </form>
    );
}
