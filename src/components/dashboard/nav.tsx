"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";

/** Menu déroulant du cadre sur mobile, refermé dès qu'on clique sur un lien. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-white hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="size-[22px]" aria-hidden>
          <path d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
        </svg>
      </button>
      {open && (
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className="fixed inset-x-0 top-[64px] bottom-0 z-30 overflow-y-auto bg-brand-deep px-5 py-5"
        >
          {children}
        </div>
      )}
    </>
  );
}

export type NavItem = { href: string; label: string; icon: ReactNode; badge?: number; exact?: boolean };

function NavList({ items, pathname }: { items: NavItem[]; pathname: string | null }) {
  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const on =
          pathname !== null &&
          (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] font-medium transition-colors ${
              on ? "bg-white/12 text-white" : "text-on-brand/80 hover:bg-white/6 hover:text-white"
            }`}
          >
            {on && <span aria-hidden className="absolute -left-4 top-2 bottom-2 w-1 rounded-r bg-gold" />}
            <span className={`flex-none ${on ? "text-gold" : "text-on-brand/60"}`}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="min-w-6 rounded-full bg-gold px-1.5 py-0.5 text-center text-[11.5px] font-bold text-brand-deep">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveNavList({ items }: { items: NavItem[] }) {
  return <NavList items={items} pathname={usePathname()} />;
}

// La page active n'est connue qu'à la requête : le menu s'affiche d'abord sans surbrillance.
export function SidebarNav({ items }: { items: NavItem[] }) {
  return (
    <Suspense fallback={<NavList items={items} pathname={null} />}>
      <ActiveNavList items={items} />
    </Suspense>
  );
}
