"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "@/components/icons";
import { Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/lib/site";

// « À propos » est une ancre à l'intérieur de « Partenaires » : on ne suit que les sections.
const tracked = site.nav.filter((n) => n.section !== "a-propos").map((n) => n.section);

export function SiteHeader() {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sections = tracked
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const links = site.nav.map((n) => ({ ...n, on: active === n.section }));

  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <header className="mx-auto flex h-[90px] max-w-[1536px] items-center gap-6 px-[clamp(20px,5.7vw,88px)] pt-[10px]">
        <Wordmark />

        <nav
          aria-label="Navigation principale"
          className="ml-[clamp(20px,4vw,62px)] hidden gap-[clamp(18px,2.1vw,33px)] whitespace-nowrap text-[13.5px] nav:flex"
        >
          {links.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setActive(n.section)}
              aria-current={n.on ? "location" : undefined}
              className={`border-b-2 py-2 hover:text-brand-text ${
                n.on
                  ? "border-brand-text font-semibold text-brand-text"
                  : "border-transparent font-medium text-fg"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <Link
          href="/#contact"
          className="hidden flex-none items-center gap-3.5 whitespace-nowrap rounded-[9px] bg-brand px-5 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_0_0_2px_#ffffff,0_6px_16px_#0e5c4733] hover:bg-brand-hover sm:flex dark:shadow-[0_0_0_2px_#ffffff22,0_6px_16px_#00000055]"
        >
          Demander une étude <ArrowRight className="size-[15px]" />
        </Link>
        <ThemeToggle />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-[10px] border border-brand/20 bg-white text-brand nav:hidden dark:bg-card dark:text-brand-text"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="size-[22px]" aria-hidden>
            <path d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
      </header>

      {open && (
        <nav
          id="menu-mobile"
          aria-label="Navigation mobile"
          className="absolute inset-x-3 top-[92px] grid rounded-[14px] bg-card px-5 py-2 shadow-[0_16px_40px_#00000022] nav:hidden"
        >
          {links.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => {
                setActive(n.section);
                setOpen(false);
              }}
              className={`border-b border-line py-3.5 text-[17px] last:border-b-0 ${
                n.on ? "font-semibold text-brand-text" : "font-medium text-fg"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            onClick={() => setOpen(false)}
            className="my-3 flex items-center justify-center gap-3 rounded-[10px] bg-brand py-3.5 font-semibold text-white sm:hidden"
          >
            Demander une étude <ArrowRight className="size-4" />
          </Link>
        </nav>
      )}
    </div>
  );
}
