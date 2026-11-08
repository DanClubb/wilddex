"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    sendSignInEmail,
    verifyCode,
    type LoginState,
    type VerifyState,
} from "./actions";

const initialLogin: LoginState = { status: "idle" };
const initialVerify: VerifyState = { status: "idle" };

export function LoginForm() {
    const [state, formAction, pending] = useActionState(
        sendSignInEmail,
        initialLogin,
    );

    if (state.status === "sent") {
        return <CodeStep email={state.email} />;
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
                {pending ? "Sending…" : "Email me a sign-in code"}
            </Button>
        </form>
    );
}

function CodeStep({ email }: { email: string }) {
    const [state, formAction, pending] = useActionState(
        verifyCode,
        initialVerify,
    );
    const [code, setCode] = useState("");

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="email" value={email} />

            <div className="space-y-1 text-center">
                <h2 className="text-xl font-semibold">Check your email</h2>
                <p className="text-muted-foreground">
                    We sent a code to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                    .
                </p>
            </div>

            <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                    Code from the email
                </label>
                <Input
                    id="code"
                    name="code"
                    value={code}
                    onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    // numeric keypad on phones; lets iOS/Android offer the code
                    // from the email as a one-tap suggestion above the keyboard
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    placeholder="123456"
                    required
                    autoFocus
                    aria-invalid={state.status === "error"}
                    aria-describedby={
                        state.status === "error" ? "code-error" : undefined
                    }
                    className="text-center text-xl tracking-[0.3em]"
                />
                {state.status === "error" && (
                    <p
                        id="code-error"
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
                disabled={pending || code.length < 6}
            >
                {pending ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
                On a computer you can also open the link in the email, in this
                same browser.{" "}
                <a className="underline underline-offset-4" href="/login">
                    Use a different email
                </a>
            </p>
        </form>
    );
}
