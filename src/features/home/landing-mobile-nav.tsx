"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string }[] = [
  { href: "#about", label: "About" },
  { href: "#destinations", label: "Destinations" },
  { href: "#services", label: "Services" },
  { href: "#fleet", label: "Bus" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "/operators", label: "Operators" },
];

export function LandingMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <div
        className={cn(
          "fixed inset-x-0 top-16 z-40 border-b border-white/15 bg-bd-green shadow-soft transition-all duration-200 md:top-[4.5rem]",
          open ? "visible opacity-100 max-h-[min(80vh,520px)]" : "invisible opacity-0 max-h-0 overflow-hidden"
        )}
      >
        <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
          {LINKS.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {link.label}
              </a>
            )
          )}
          <div className="mt-2 flex flex-col gap-2 border-t border-white/15 pt-3 sm:hidden">
            <LinkButton href="/login" className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/25">
              Sign in
            </LinkButton>
          </div>
        </nav>
      </div>
    </div>
  );
}
