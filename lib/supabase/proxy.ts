import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

// Routes that work without being signed in. Everything else redirects to /login.
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublic(pathname: string) {
    return (
        pathname === "/" ||
        PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    );
}

// Refreshes the Supabase session on every request and passes the refreshed
// cookies on to both Server Components and the browser. Called from proxy.ts.
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet, headers) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                    Object.entries(headers).forEach(([key, value]) =>
                        supabaseResponse.headers.set(key, value),
                    );
                },
            },
        },
    );

    // Do not put code between createServerClient and getClaims(): it can cause
    // users to be logged out at random. getClaims() also verifies the token.
    const { data } = await supabase.auth.getClaims();
    const signedIn = Boolean(data?.claims);

    if (!signedIn && !isPublic(request.nextUrl.pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
