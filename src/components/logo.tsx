import Image from "next/image";
import Link from "next/link";

export function LogoMark({
  variant,
  width,
  className,
}: {
  variant: "color" | "gold" | "white";
  width: number;
  className?: string;
}) {
  return (
    <Image
      src={`/images/logo-${variant}.svg`}
      alt=""
      width={width}
      height={Math.round((width * 276) / 406)}
      className={className}
    />
  );
}

/** Logo complet du header : pictogramme + « Masjid Energie » + « ÉNERGIE SOLAIRE » (en or). */
export function Wordmark() {
  return (
    <Link href="/#accueil" className="flex flex-none items-center gap-2" aria-label="Masjid Energie — accueil">
      <LogoMark variant="color" width={92} className="w-16 sm:w-[92px] dark:hidden" />
      <LogoMark variant="gold" width={92} className="hidden w-16 sm:w-[92px] dark:block" />
      <span className="grid gap-1">
        <span className="whitespace-nowrap font-display text-[22px] leading-none tracking-[-0.02em] text-brand-text sm:text-[30px]">
          <span className="font-bold">Masjid</span> <span className="font-normal">Energie</span>
        </span>
        <span className="flex items-center gap-[7px] whitespace-nowrap font-display text-[7px] font-semibold tracking-[0.24em] text-gold sm:text-[8.5px]">
          <span className="h-px flex-1 bg-gold" />
          ÉNERGIE SOLAIRE
          <span className="h-px flex-1 bg-gold" />
        </span>
      </span>
    </Link>
  );
}
