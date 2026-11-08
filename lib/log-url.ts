// The log modal on the dex grid lives at /dex?log=<slug>. It's opened with the
// browser's History API (which Next.js syncs with useSearchParams), so opening it
// doesn't re-fetch the page, and the back button closes it.
let pushed = false;

export function openLog(slug: string) {
    window.history.pushState(null, "", `/dex?log=${encodeURIComponent(slug)}`);
    pushed = true;
}

// Close by going back if we opened it ourselves; if the page was loaded
// straight at /dex?log=..., there is nothing to go back to, so replace the URL.
export function closeLog() {
    if (pushed) {
        pushed = false;
        window.history.back();
    } else {
        window.history.replaceState(null, "", "/dex");
    }
}

// Called when the modal goes away by other means (e.g. the back button).
export function resetLogState() {
    pushed = false;
}
