import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where the magic link lands. Supports both formats Supabase can send:
//   ?code=...                     the default email template (PKCE)
//   ?token_hash=...&type=email    a custom template, which also works across
//                                 browsers and is what email codes would use later
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;

    // Only allow redirects to paths on this site.
    const nextParam = searchParams.get("next") ?? "/dex";
    const next =
        nextParam.startsWith("/") && !nextParam.startsWith("//")
            ? nextParam
            : "/dex";

    const supabase = await createClient();
    let signedIn = false;

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        signedIn = !error;
    } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
        });
        signedIn = !error;
    }

    // Redirect without the one-time secrets in the URL.
    const destination = request.nextUrl.clone();
    destination.search = "";
    destination.pathname = signedIn ? next : "/login";
    if (!signedIn) destination.searchParams.set("error", "link");

    return NextResponse.redirect(destination);
}
