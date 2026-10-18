import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)]">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/images/hero-mosquee-solaire.jpg" alt="" fill sizes="60vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,61,46,0.2),rgba(10,61,46,0.85))]" />
        <div className="absolute inset-x-12 bottom-12 grid gap-3 text-white">
          <p lang="ar" dir="rtl" className="justify-self-start font-arabic text-[30px] text-gold">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
          <p className="max-w-[520px] text-[22px] font-bold leading-snug">
            Suivez votre consommation, vos factures et votre projet solaire, au même endroit.
          </p>
        </div>
      </div>
      <main className="flex flex-col px-[clamp(20px,5vw,56px)] py-10">
        <Link href="/" className="mb-12 flex items-center gap-2.5 self-start">
          <LogoMark variant="color" width={60} className="dark:hidden" />
          <LogoMark variant="gold" width={60} className="hidden dark:block" />
          <span className="font-display text-[22px] text-brand-text">
            <span className="font-bold">Masjid</span> Energie
          </span>
        </Link>
        <div className="my-auto w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
