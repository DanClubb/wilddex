import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · WildDex" };

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    return (
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-12">
            <header className="space-y-2 text-center">
                <h1 className="font-heading text-3xl font-bold">WildDex</h1>
                <p className="text-muted-foreground">
                    Sign in or create your account. No password needed.
                </p>
            </header>

            {error === "link" && (
                <p
                    role="alert"
                    className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                    That link didn&apos;t work. It may have expired, or been
                    opened in a different browser from the one you requested it
                    in. Request a new one below.
                </p>
            )}

            <LoginForm />
        </main>
    );
}
