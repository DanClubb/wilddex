"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Light, dark, or follow the device. next-themes puts a `dark` class on <html>
// (what our CSS tokens key off) and remembers the choice in localStorage; a tiny
// inline script applies it before first paint so there's no flash.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}
