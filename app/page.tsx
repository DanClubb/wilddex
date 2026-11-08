import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/dex");

    return (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12 text-center">
            <div className="space-y-4">
                <h1 className="font-heading text-5xl font-bold tracking-tight">
                    WildDex
                </h1>
                <p className="text-lg text-muted-foreground">
                    A real-life Pokédex for UK wildlife. Find it, photograph it,
                    and watch your collection fill up.
                </p>
            </div>
            <Button asChild size="lg" className="mx-auto h-11 px-8">
                <Link href="/login">Get started</Link>
            </Button>
        </main>
    );
}
