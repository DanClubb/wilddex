"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { countInDex, type DexSpecies } from "@/lib/dex";
import { saveDex, type SaveDexState } from "./actions";

type Option = { id: number; name: string };

type Props = {
    editing: boolean;
    groups: Option[];
    regions: Option[];
    species: DexSpecies[];
    initial: { name: string; groupIds: number[]; regionIds: number[] };
};

const STEPS = ["Name", "Species", "Regions"] as const;
const LAST = STEPS.length - 1;

const initialState: SaveDexState = { status: "idle" };

export function DexWizard({ editing, groups, regions, species, initial }: Props) {
    const [step, setStep] = useState(0);
    const [name, setName] = useState(initial.name);
    const [groupIds, setGroupIds] = useState(() => new Set(initial.groupIds));
    const [regionIds, setRegionIds] = useState(() => new Set(initial.regionIds));
    const [state, formAction, pending] = useActionState(saveDex, initialState);

    // Move focus to the step heading so screen readers announce the change.
    const headingRef = useRef<HTMLHeadingElement>(null);
    const mounted = useRef(false);
    useEffect(() => {
        if (mounted.current) headingRef.current?.focus();
        mounted.current = true;
    }, [step]);

    const total = useMemo(
        () => countInDex(species, groupIds, regionIds),
        [species, groupIds, regionIds],
    );

    const trimmed = name.trim();
    const stepError =
        step === 0 && !trimmed
            ? "Give your dex a name to continue."
            : step === 1 && groupIds.size === 0
              ? "Pick at least one group."
              : step === 2 && regionIds.size === 0
                ? "Pick at least one region."
                : null;
    const [showError, setShowError] = useState(false);

    function next() {
        if (stepError) return setShowError(true);
        setShowError(false);
        setStep((s) => Math.min(s + 1, LAST));
    }

    function toggle(set: Set<number>, id: number): Set<number> {
        const copy = new Set(set);
        if (copy.has(id)) copy.delete(id);
        else copy.add(id);
        return copy;
    }

    const allRegions = regionIds.size === regions.length;

    return (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
            <div className="space-y-3">
                <div className="flex gap-1.5" aria-hidden="true">
                    {STEPS.map((label, i) => (
                        <div
                            key={label}
                            className={cn(
                                "h-1.5 flex-1 rounded-full bg-muted transition-colors",
                                i <= step && "bg-primary",
                            )}
                        />
                    ))}
                </div>
                <p className="text-sm text-muted-foreground">
                    Step {step + 1} of {STEPS.length}
                </p>
            </div>

            <form
                action={formAction}
                className="flex flex-1 flex-col gap-6"
                onKeyDown={(e) => {
                    // Enter on an earlier step moves on instead of submitting early.
                    if (e.key === "Enter" && step < LAST && e.target instanceof HTMLInputElement && e.target.type === "text") {
                        e.preventDefault();
                        next();
                    }
                }}
            >
                {/* The source of truth for submission, whichever step is showing. */}
                <input type="hidden" name="name" value={trimmed} />
                {[...groupIds].map((id) => (
                    <input key={`g${id}`} type="hidden" name="group" value={id} />
                ))}
                {[...regionIds].map((id) => (
                    <input key={`r${id}`} type="hidden" name="region" value={id} />
                ))}

                {step === 0 && (
                    <section className="space-y-4">
                        <h1 ref={headingRef} tabIndex={-1} className="font-heading text-3xl font-bold outline-none">
                            {editing ? "Rename your dex" : "Name your dex"}
                        </h1>
                        <p className="text-muted-foreground">
                            Make it yours. You can change it any time.
                        </p>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium">Dex name</span>
                            <Input
                                type="text"
                                value={name}
                                maxLength={40}
                                placeholder="e.g. Dan's WildDex"
                                autoComplete="off"
                                onChange={(e) => setName(e.target.value)}
                            />
                        </label>
                    </section>
                )}

                {step === 1 && (
                    <section className="space-y-4">
                        <h1 ref={headingRef} tabIndex={-1} className="font-heading text-3xl font-bold outline-none">
                            What do you want to find?
                        </h1>
                        <p className="text-muted-foreground">
                            Pick the groups for your dex. Harder ones are off to start with.
                        </p>
                        <div className="grid gap-2">
                            {groups.map((g) => {
                                const n = species.filter((s) => s.groupId === g.id && s.regionIds.some((r) => regionIds.has(r))).length;
                                return (
                                    <ChoiceCard
                                        key={g.id}
                                        label={g.name}
                                        detail={`${n} species`}
                                        checked={groupIds.has(g.id)}
                                        onChange={() => setGroupIds((s) => toggle(s, g.id))}
                                    />
                                );
                            })}
                        </div>
                    </section>
                )}

                {step === 2 && (
                    <section className="space-y-4">
                        <h1 ref={headingRef} tabIndex={-1} className="font-heading text-3xl font-bold outline-none">
                            Where will you look?
                        </h1>
                        <p className="text-muted-foreground">
                            Your dex only includes species found in the regions you pick.
                        </p>
                        <div className="grid gap-2">
                            <ChoiceCard
                                label="All of the UK"
                                checked={allRegions}
                                onChange={() =>
                                    setRegionIds(allRegions ? new Set() : new Set(regions.map((r) => r.id)))
                                }
                            />
                            {regions.map((r) => {
                                const n = species.filter((s) => groupIds.has(s.groupId) && s.regionIds.includes(r.id)).length;
                                return (
                                    <ChoiceCard
                                        key={r.id}
                                        label={r.name}
                                        detail={`${n} species`}
                                        checked={regionIds.has(r.id)}
                                        onChange={() => setRegionIds((s) => toggle(s, r.id))}
                                    />
                                );
                            })}
                        </div>
                        <p className="rounded-2xl bg-muted px-4 py-3 text-sm">
                            Your dex will have <strong>{total}</strong> species.
                        </p>
                    </section>
                )}

                {(showError && stepError) || state.status === "error" ? (
                    <p role="alert" className="text-sm text-destructive">
                        {showError && stepError ? stepError : state.status === "error" ? state.message : null}
                    </p>
                ) : null}

                <div className="mt-auto flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
                    {step < LAST ? (
                        // Distinct keys matter: without them React reuses this one <button> as the
                        // submit button on the last step, and the same click then submits the form.
                        <Button key="next" type="button" className="h-11 w-full" onClick={next}>
                            Next
                        </Button>
                    ) : (
                        <Button key="submit" type="submit" className="h-11 w-full" disabled={pending || !!stepError}>
                            {pending ? "Saving…" : editing ? "Save changes" : "Create my dex"}
                        </Button>
                    )}
                    {step > 0 && (
                        <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => { setShowError(false); setStep((s) => s - 1); }}>
                            Back
                        </Button>
                    )}
                    {editing && step === 0 && (
                        <Button asChild variant="ghost" className="h-11 w-full">
                            <Link href="/dex">Cancel</Link>
                        </Button>
                    )}
                </div>
            </form>
        </main>
    );
}

function ChoiceCard({
    label,
    detail,
    checked,
    onChange,
}: {
    label: string;
    detail?: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label
            className={cn(
                "relative flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors",
                "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30",
                checked ? "border-primary bg-primary/10" : "border-input bg-input/30",
            )}
        >
            {/* Native checkbox keeps keyboard and screen-reader behaviour for free. */}
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <span className="font-medium">{label}</span>
            <span className="flex items-center gap-3 text-sm text-muted-foreground">
                {detail}
                <span
                    aria-hidden="true"
                    className={cn(
                        "flex size-5 items-center justify-center rounded-full border text-xs",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                >
                    {checked ? "✓" : ""}
                </span>
            </span>
        </label>
    );
}
