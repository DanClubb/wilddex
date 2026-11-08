"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Dates travel as plain "YYYY-MM-DD" strings (what a database date column wants),
// built from the local calendar day so the user's timezone can't shift them.
function toISODate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fromISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

type DatePickerProps = {
  id?: string;
  name: string;
  defaultValue?: string; // YYYY-MM-DD
  max?: string; // latest selectable day, YYYY-MM-DD
  disabled?: boolean;
  className?: string;
};

// A button that opens a calendar. A hidden input carries the chosen date, so it
// works inside a normal <form> / FormData like the native date field did.
function DatePicker({
  id,
  name,
  defaultValue,
  max,
  disabled,
  className,
}: DatePickerProps) {
  const [value, setValue] = React.useState(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const selected = value ? fromISODate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-start px-4 text-base font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon aria-hidden="true" />
          {selected
            ? selected.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          weekStartsOn={1}
          disabled={max ? { after: fromISODate(max) } : undefined}
          onSelect={(d) => {
            if (!d) return;
            setValue(toISODate(d));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
      <input type="hidden" name={name} value={value} />
    </Popover>
  );
}

export { DatePicker };
