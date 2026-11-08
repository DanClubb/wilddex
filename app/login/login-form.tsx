"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
    const [state, formAction, pending] = useActionState(
        sendMagicLink,
        initialState,
    );

    if (state.status === "sent") {
        return (
            <div className="space-y-3 text-center" role="status">
                <h2 className="text-xl font-semibold">Check your email</h2>
                <p className="text-muted-foreground">
                    We sent a sign-in link to{" "}
                    <span className="font-medium text-foreground">
                        {state.email}
                    </span>
                    . Open it in this same browser.
                </p>
                <p className="text-sm text-muted-foreground">
                    Nothing there?{" "}
                    <a className="underline underline-offset-4" href="/login">
                        Try again
                    </a>
                </p>
            </div>
        );
    }

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                    Email address
                </label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    required
                    aria-invalid={state.status === "error"}
                    aria-describedby={
                        state.status === "error" ? "email-error" : undefined
                    }
                />
                {state.status === "error" && (
                    <p
                        id="email-error"
                        role="alert"
                        className="text-sm text-destructive"
                    >
                        {state.message}
                    </p>
                )}
            </div>
            <Button
                type="submit"
                size="lg"
                className="h-11 w-full"
                disabled={pending}
            >
                {pending ? "Sending…" : "Email me a sign-in link"}
            </Button>
        </form>
    );
}
