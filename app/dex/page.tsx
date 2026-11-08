import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your WildDex" };

// Placeholder: proves sign-in and the database connection work end to end.
// Next up: the dex setup wizard, then the dex grid replaces this page.
export default async function DexPage() {
    const supabase = await createClient();

    // getClaims() verifies the session token; never trust the cookie alone.
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) redirect("/login");

    const [{ count: speciesCount }, { data: profile }] = await Promise.all([
        supabase
            .from("species")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
        supabase.from("profiles").select("dex_name").eq("id", claims.sub).maybeSingle(),
    ]);

    return (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
            <header className="space-y-1">
                <h1 className="font-heading text-3xl font-bold">
                    {profile?.dex_name ?? "Your WildDex"}
                </h1>
                <p className="text-muted-foreground">
                    Signed in as {claims.email}
                </p>
            </header>

            <p className="rounded-2xl bg-muted px-4 py-3 text-sm">
                {speciesCount ?? 0} species in the database.{" "}
                {profile
                    ? "Your dex is set up."
                    : "Dex setup is the next thing we're building."}
            </p>

            <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline" className="h-11 w-full">
                    Sign out
                </Button>
            </form>
        </main>
    );
}
