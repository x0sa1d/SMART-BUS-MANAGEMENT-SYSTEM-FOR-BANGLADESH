"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, Loader2, MapPin } from "lucide-react";
import { addCalendarDays } from "@/lib/calendar-date";
import { isSameCity } from "@/lib/district-search";

type DestinationOption = {
  name: string;
  aliases?: string[];
};

const EXTRA_ALIASES: Record<string, string[]> = {
  Chattogram: ["Chittagong", "CTG"],
  Chittagong: ["Chattogram", "CTG"],
  Jessore: ["Jashore"],
  Jashore: ["Jessore"],
  Barishal: ["Barisal"],
  Barisal: ["Barishal"],
  Bogura: ["Bogra"],
  Bogra: ["Bogura"],
  Cumilla: ["Comilla"],
  Comilla: ["Cumilla"],
};

function matchesQuery(option: DestinationOption, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (option.name.toLowerCase().includes(q)) return true;
  return (option.aliases ?? []).some((alias) => alias.toLowerCase().includes(q));
}

function DestinationField({
  id,
  name,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  placeholder: string;
  options: DestinationOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => {
    const filtered = options.filter((option) => matchesQuery(option, value)).slice(0, 8);
    return filtered;
  }, [options, value]);

  const selectSuggestion = (next: string) => {
    onChange(next);
    setOpen(false);
    setActiveIndex(0);
  };

  return (
    <div className="space-y-1.5 min-w-0 relative">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wide text-bd-green">
        {label}
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
        <input
          id={id}
          name={name}
          required
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-suggestions`}
          aria-autocomplete="list"
          className="w-full min-h-12 rounded-[10px] border border-border bg-input pl-9 pr-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/25"
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (!open || suggestions.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
            } else if (event.key === "Enter" && suggestions[activeIndex]) {
              const selected = suggestions[activeIndex].name;
              if (value.trim().toLowerCase() !== selected.toLowerCase()) {
                event.preventDefault();
                selectSuggestion(selected);
              }
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card py-1 shadow-soft-lg"
        >
          {suggestions.map((option, index) => (
            <li key={`${id}-${option.name}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                  index === activeIndex ? "bg-primary/10 text-primary" : "text-ink hover:bg-muted"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(option.name)}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                <span className="font-medium">{option.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HomeSearchForm({ destinations, today }: { destinations: string[]; today: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const lastDate = addCalendarDays(today, 7);
  const options = useMemo<DestinationOption[]>(
    () =>
      destinations.map((name) => ({
        name,
        aliases: EXTRA_ALIASES[name] ?? [],
      })),
    [destinations]
  );

  return (
    <form
      action="/search"
      method="get"
      className="search-panel overflow-visible rounded-xl bg-card p-5 sm:p-6"
      onSubmit={(event) => {
        const source = from.trim();
        const destination = to.trim();
        const passengers = Number(String(new FormData(event.currentTarget).get("passengers") ?? "1"));
        if (!source || !destination) {
          event.preventDefault();
          setError("Select both Travel From and Travel To");
          return;
        }
        if (isSameCity(source, destination)) {
          event.preventDefault();
          setError("Origin and destination must be different");
          setPending(false);
          return;
        }
        if (!Number.isFinite(passengers) || passengers < 1 || passengers > 10) {
          event.preventDefault();
          setError("Passengers must be between 1 and 10");
          setPending(false);
          return;
        }
        setError("");
        setPending(true);
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        <DestinationField
          id="travel-from"
          name="source"
          label="Travel From"
          value={from}
          placeholder="Type a City"
          options={options}
          onChange={setFrom}
        />
        <DestinationField
          id="travel-to"
          name="destination"
          label="Travel To"
          value={to}
          placeholder="Type a City"
          options={options}
          onChange={setTo}
        />
        <div className="space-y-1.5 min-w-0">
          <label htmlFor="travel-date" className="text-[11px] font-semibold uppercase tracking-wide text-bd-green">
            Select Date
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
            <input
              id="travel-date"
              name="date"
              type="date"
              required
              min={today}
              max={lastDate}
              defaultValue={today}
              className="w-full min-h-12 rounded-[10px] border border-border bg-input pl-9 pr-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
        </div>
        <div className="space-y-1.5 min-w-0">
          <label htmlFor="travel-passengers" className="text-[11px] font-semibold uppercase tracking-wide text-bd-green">
            Passengers
          </label>
          <select
            id="travel-passengers"
            name="passengers"
            required
            defaultValue={1}
            className="w-full min-h-12 rounded-[10px] border border-border bg-input px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/25"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 xl:col-span-1 flex items-end">
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="w-full min-h-12 rounded-[10px] gradient-primary text-white font-semibold py-3 hover:opacity-95 transition-all shadow-soft disabled:opacity-70 inline-flex items-center justify-center gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {pending ? "Searching…" : "Book Now"}
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
