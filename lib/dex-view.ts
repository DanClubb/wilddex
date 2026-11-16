// Remembers where the user was in the dex grid (filters and scroll position) while they look
// at a species page, so the back button can put them back exactly there.
//
// The filters live in the dex page's address (?group=&status=&q=), so they survive a refresh
// and the browser's own back button. The scroll position can't live there, so it is kept in
// sessionStorage (per tab, gone when the tab closes).
const KEY = "wilddex:dex-view";

type SavedView = { url: string; scrollY: number };

// The page address without the log popup's ?log= (that popup is not part of the view).
function currentUrl() {
    const params = new URLSearchParams(window.location.search);
    params.delete("log");
    const qs = params.toString();
    return window.location.pathname + (qs ? `?${qs}` : "");
}

// Call just before leaving the grid for a species page.
export function saveDexView() {
    try {
        const view: SavedView = { url: currentUrl(), scrollY: window.scrollY };
        sessionStorage.setItem(KEY, JSON.stringify(view));
    } catch {
        // Storage can be blocked (private mode); back then just goes to the top of the dex.
    }
}

export function readDexView(): SavedView | null {
    try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return null;
        const view = JSON.parse(raw) as Partial<SavedView>;
        if (typeof view.url !== "string" || typeof view.scrollY !== "number")
            return null;
        return { url: view.url, scrollY: view.scrollY };
    } catch {
        return null;
    }
}

export function clearDexView() {
    try {
        sessionStorage.removeItem(KEY);
    } catch {
        // ignore
    }
}

// Used by the grid on load: scrolls back if we've just come back from a species page.
export function restoreDexScroll() {
    const view = readDexView();
    if (!view) return;
    if (view.url === currentUrl()) window.scrollTo(0, view.scrollY);
    clearDexView();
}
