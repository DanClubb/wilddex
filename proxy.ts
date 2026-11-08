import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed the `middleware` file convention to `proxy`.
export async function proxy(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    matcher: [
        // Everything except static files, image optimisation, image assets and the
        // PWA manifest (browsers fetch it without a session, so it must stay public).
        "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
