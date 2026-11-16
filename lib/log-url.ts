// The log modal on the dex grid lives at /dex?log=<slug> (plus any filters already in the address). It's opened with the
// browser's History API (which Next.js syncs with useSearchParams), so opening it
// doesn't re-fetch the page, and the back button closes it.
let pushed = false;

export function openLog(slug: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("log", slug);
    window.history.pushState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`,
    );
    pushed = true;
}

// Close by going back if we opened it ourselves; if the page was loaded
// straight at /dex?log=..., there is nothing to go back to, so replace the URL.
export function closeLog() {
    if (pushed) {
        pushed = false;
        window.history.back();
    } else {
        const params = new URLSearchParams(window.location.search);
        params.delete("log");
        const qs = params.toString();
        window.history.replaceState(
            null,
            "",
            window.location.pathname + (qs ? `?${qs}` : ""),
        );
    }
}

// Called when the modal goes away by other means (e.g. the back button).
export function resetLogState() {
    pushed = false;
}
