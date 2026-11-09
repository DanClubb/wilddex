import type { MetadataRoute } from "next";

// Makes WildDex installable ("Add to Home Screen"). It opens full-screen like
// a native app. start_url "/" is fine: signed-in visitors are sent on to /dex.
// background_color is the colour of the Android launch screen (with the icon); iOS uses the
// images in public/splash/ instead (see scripts/build-splash.mjs).
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "WildDex",
        short_name: "WildDex",
        description:
            "A real-life Pokédex for UK wildlife. Find it, photograph it, collect it.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#15803d",
        theme_color: "#15803d",
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
                src: "/icons/icon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
