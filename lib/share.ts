// Share links look like /s/<token>. The token is a random UUID, so anything else
// can be rejected before it reaches the database.
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isShareToken(value: string): boolean {
    return TOKEN.test(value);
}

// Never index or follow a shared page, and don't leak the link in a Referer header.
export const sharedPageMetadata = {
    robots: { index: false, follow: false },
    referrer: "no-referrer",
} as const;
