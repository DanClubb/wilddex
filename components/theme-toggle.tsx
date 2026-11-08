"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
    { value: "system", label: "System", Icon: Monitor },
] as const;

// Sun/moon button with a Light / Dark / System menu. Both icons are always in
// the markup and CSS picks one, so the server and browser render the same HTML.
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-9">
                    <Sun
                        aria-hidden="true"
                        className="scale-100 dark:scale-0"
                    />
                    <Moon
                        aria-hidden="true"
                        className="absolute scale-0 dark:scale-100"
                    />
                    <span className="sr-only">Change theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {OPTIONS.map(({ value, label, Icon }) => (
                    <DropdownMenuItem
                        key={value}
                        onSelect={() => setTheme(value)}
                    >
                        <Icon aria-hidden="true" />
                        {label}
                        {theme === value && (
                            <Check aria-hidden="true" className="ml-auto" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
