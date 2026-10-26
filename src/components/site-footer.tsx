import Link from "next/link";
import { LogoMark } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="bg-brand-deep text-on-brand">
      <div className="mx-auto flex max-w-[1536px] flex-wrap items-center justify-between gap-4 px-[clamp(20px,4.7vw,72px)] py-7 text-[13px]">
        <div className="flex items-center gap-2.5">
          <LogoMark variant="gold" width={60} />
          <span className="font-display text-xl text-white">
            <span className="font-bold">Masjid</span> Energie
          </span>
        </div>
        <span>Avec le soutien financier de SunLib</span>
        <span>
          © 2026 ·{" "}
          <Link href="/connexion" className="underline-offset-2 hover:underline">
            Espace mosquée
          </Link>{" "}
          ·{" "}
          <Link href="/mentions-legales" className="underline-offset-2 hover:underline">
            Mentions légales
          </Link>
        </span>
      </div>
    </footer>
  );
}
