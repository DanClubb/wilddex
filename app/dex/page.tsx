import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your WildDex" };

// Placeholder until the dex grid replaces it.
export default async function DexPage() {
    const supabase = await createClient();

    // getClaims() verifies the session token; never trust the cookie alone.
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) redirect("/login");

    const [{ count: dexCount }, { count: foundCount }, { data: profile }] = await Promise.all([
        supabase.from("my_dex").select("species_id", { count: "exact", head: true }),
        supabase.from("entries").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("dex_name").eq("id", claims.sub).maybeSingle(),
    ]);

    // No profile means the setup wizard has not been finished yet.
    if (!profile) redirect("/setup");

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
                {foundCount ?? 0} of {dexCount ?? 0} species found. The dex grid is
                the next thing we&apos;re building.
            </p>

            <Button asChild variant="outline" className="h-11 w-full">
                <Link href="/setup">Edit dex settings</Link>
            </Button>

            <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline" className="h-11 w-full">
                    Sign out
                </Button>
            </form>
        </main>
    );
}
