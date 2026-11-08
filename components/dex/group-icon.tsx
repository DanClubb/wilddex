import { Bird, Fish, FishSymbol, PawPrint, Squirrel, Turtle } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// Lucide has no frog, bat or whale, so these three are drawn to match its style
// (24px grid, 2px round strokes) and take the same props.
function svg(props: IconProps, children: React.ReactNode) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {children}
        </svg>
    );
}

function Frog(props: IconProps) {
    return svg(
        props,
        <>
            <circle cx="7.5" cy="7" r="2.5" />
            <circle cx="16.5" cy="7" r="2.5" />
            <path d="M5.3 8.8C3.6 10.2 3 12 3 14c0 3.6 4 6 9 6s9-2.4 9-6c0-2-.6-3.8-2.3-5.2" />
            <path d="M8 15c2.5 2 5.5 2 8 0" />
            <path d="M7.5 7h.01M16.5 7h.01" />
        </>,
    );
}

function Bat(props: IconProps) {
    return svg(
        props,
        <>
            <path d="M12 7.5 10.6 4.5 9.6 7.6C8.6 7.9 8.2 8.8 8.4 9.8 6 9.4 3.8 8 2 6c.2 3.6 1 6 2.5 7.5 1-1.2 2.4-1.4 3.6-.7.4 1.7 1.4 3.2 3.9 5.7 2.5-2.5 3.5-4 3.9-5.7 1.2-.7 2.6-.5 3.6.7C21 12 21.8 9.6 22 6c-1.8 2-4 3.4-6.4 3.8.2-1-.2-1.9-1.2-2.2L13.4 4.5Z" />
            <path d="M10.5 10h.01M13.5 10h.01" />
        </>,
    );
}

function Whale(props: IconProps) {
    return svg(
        props,
        <>
            <path d="M2.5 13.5C2.5 10 6 8 10.5 8c4 0 7.5 2 8.5 5 .8-.9 1.8-2 2.5-3.2.3 2.600.2 4.800-1.500 6.700-2 2-5.500 2.700-9.500 2.300-4.500-.5-8-1.700-8-5.300Z" />
            <path d="M6.5 12.5h.01" />
            <path d="M10.5 8V4.5M10.5 4.5 8.8 3M10.5 4.5 12.2 3" />
        </>,
    );
}

// One animal per species group, keyed by the group's slug (data/groups.csv).
// Anything not listed (a group added later) falls back to a paw print.
const ICONS: Record<string, ComponentType<IconProps>> = {
    birds: Bird,
    "land-mammals": Squirrel,
    bats: Bat,
    "marine-mammals": Whale,
    reptiles: Turtle,
    amphibians: Frog,
    "freshwater-fish": Fish,
    "marine-fish": FishSymbol,
};

export function GroupIcon({
    slug,
    ...props
}: { slug: string } & IconProps) {
    const Icon = ICONS[slug] ?? PawPrint;
    return <Icon aria-hidden="true" {...props} />;
}
