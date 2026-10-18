import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import { MobileMenu } from "@/components/dashboard/nav";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { STATUS_META, type RequestStatus } from "@/lib/workflow";

// --- Icônes (trait 1.8, 24×24) ------------------------------------------------

const paths = {
  inbox: "M4 13h4l1.5 3h5L16 13h4M5.5 5h13L21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z",
  userPlus: "M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19 8v6M22 11h-6",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M22 19v-1a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8",
  gauge: "M12 14l4-4M3.5 17a9 9 0 1 1 17 0M12 14a1 1 0 1 0 0 .01",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-3.5-3.5",
  clip: "M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10.2 17.7a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8",
  message: "M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2",
  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M3 7l9 6 9-6",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5",
  plug: "M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  trash: "M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  back: "M15 18l-6-6 6-6",
  euro: "M17 5.5A7 7 0 1 0 17 18.5M4 10h9M4 14h9",
  leaf: "M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  check: "M5 12.5l4.5 4.5L19 7",
  card: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 16c.5-1.7 1.6-2.5 3-2.5s2.5.8 3 2.5M14 9h4M14 13h4",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-[18px]", ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

// --- Cadre commun admin / espace mosquée ---------------------------------------

function Brand({ area }: { area: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Retour au site Masjid Energie">
      <LogoMark variant="gold" width={52} />
      <span className="grid leading-none">
        <span className="font-display text-[19px] text-white">
          <span className="font-bold">Masjid</span> Energie
        </span>
        <span className="mt-1 text-[10.5px] font-semibold tracking-[0.2em] text-gold">{area.toUpperCase()}</span>
      </span>
    </Link>
  );
}

export function DashboardShell({
  area,
  nav,
  account,
  children,
}: {
  area: string;
  nav: ReactNode;
  account: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-bg-soft">
      <aside className="sticky top-0 hidden h-dvh w-[264px] flex-none flex-col bg-brand-deep px-4 py-6 lg:flex">
        <Brand area={area} />
        <div className="mt-9 flex-1 overflow-y-auto">{nav}</div>
        <div className="grid gap-3 border-t border-white/10 pt-4">
          {account}
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-deep px-4 py-3 lg:hidden">
          <Brand area={area} />
          <MobileMenu>
            {nav}
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
              {account}
              <ThemeToggle />
            </div>
          </MobileMenu>
        </header>
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-[clamp(16px,3vw,40px)] py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1.5">
        {eyebrow && <span className="text-[12px] font-semibold tracking-[0.22em] text-gold">{eyebrow}</span>}
        <h1 className="text-[clamp(24px,2.2vw,30px)] font-extrabold leading-tight tracking-[-0.02em] text-heading">
          {title}
        </h1>
        {description && <p className="max-w-[640px] text-[14.5px] text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({
  title,
  icon,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-card shadow-[0_4px_14px_#0000000a] ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-heading">
            {icon && <Icon name={icon} className="size-[18px] text-brand-text" />}
            {title}
          </h2>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: IconName;
  tone?: "default" | "brand" | "gold";
}) {
  const box =
    tone === "brand"
      ? "bg-brand text-white border-transparent"
      : tone === "gold"
        ? "bg-[linear-gradient(180deg,#d6a94e,#b08431)] text-brand-deep border-transparent"
        : "bg-card text-fg border-line";
  return (
    <div className={`flex items-start gap-3.5 rounded-xl border px-5 py-4 shadow-[0_4px_14px_#0000000a] ${box}`}>
      <span
        className={`flex size-10 flex-none items-center justify-center rounded-lg ${
          tone === "default" ? "bg-brand/8 text-brand-text" : "bg-black/10"
        }`}
      >
        <Icon name={icon} className="size-5" />
      </span>
      <div className="grid gap-0.5">
        <span className={`text-[13px] font-medium ${tone === "default" ? "text-muted" : "opacity-85"}`}>{label}</span>
        <span className="text-[24px] font-extrabold leading-tight tracking-[-0.01em]">{value}</span>
        {sub && <span className={`text-[12.5px] ${tone === "default" ? "text-muted" : "opacity-85"}`}>{sub}</span>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-line bg-card px-6 py-14 text-center">
      <Icon name={icon} className="size-8 text-muted" />
      <p className="text-[15px] font-semibold text-heading">{title}</p>
      {children && <div className="max-w-[440px] text-[14px] text-muted">{children}</div>}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="grid animate-pulse gap-5" aria-busy="true" aria-label="Chargement">
      <div className="h-9 w-64 rounded-lg bg-placeholder" />
      <div className="h-24 rounded-xl bg-placeholder" />
      <div className="h-80 rounded-xl bg-placeholder" />
    </div>
  );
}

export const inputClass =
  "h-10 w-full rounded-lg border border-line bg-bg px-3 text-[14px] text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20";

export const buttonClass =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover disabled:cursor-default disabled:opacity-60";

export const ghostButtonClass =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-card px-4 text-[14px] font-semibold text-fg hover:bg-bg-soft";
