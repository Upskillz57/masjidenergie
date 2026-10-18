import Image from "next/image";
import type { ReactNode } from "react";
import { VideoButton } from "@/components/home/video-button";
import { ArrowRight, Check, House, Leaf, Play, ShieldCheck, SunRays } from "@/components/icons";
import { site } from "@/lib/site";

const big = "text-[26px] font-extrabold leading-[1.15] tracking-[-0.01em] text-accent";

const stats: { icon: ReactNode; title: ReactNode; body: ReactNode; highlight?: boolean }[] = [
  {
    icon: <Leaf strokeWidth={1.5} className="size-[42px]" />,
    title: "Réduction des coûts",
    body: (
      <>
        <span className="text-sm">
          jusqu’à <span className={big}>70 %</span>
        </span>
        <span className="text-sm">sur la facture d’énergie</span>
      </>
    ),
  },
  {
    icon: <SunRays strokeWidth={1.5} className="size-[46px]" />,
    title: "Énergie propre",
    body: (
      <>
        <span className={big}>100 %</span>
        <span className="text-sm">renouvelable</span>
      </>
    ),
  },
  {
    icon: <House strokeWidth={1.5} className="size-[46px]" />,
    title: (
      <>
        Accompagnement
        <br />
        de A à Z
      </>
    ),
    body: (
      <span className="mt-1 text-sm leading-[1.3] text-on-brand">
        Un partenaire unique
        <br />à chaque étape
      </span>
    ),
  },
  {
    icon: <ShieldCheck strokeWidth={1.5} className="size-[46px]" />,
    title: <span className="whitespace-nowrap text-[clamp(20px,1.7vw,24px)] font-extrabold leading-none tracking-[-0.01em]">Sans crédit</span>,
    body: (
      <span className="mt-1 whitespace-nowrap text-[14.5px] font-semibold leading-[1.3]">
        Sans emprunt,
        <br />
        sans endettement
      </span>
    ),
    highlight: true,
  },
];

export function Hero() {
  return (
    <section id="accueil" className="relative min-h-[655px] overflow-hidden bg-hero pt-[90px]">
      <Image
        src="/images/hero-mosquee-solaire.jpg"
        alt="Mosquée équipée de panneaux solaires au coucher du soleil"
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(var(--hero-fade),0.97)_0%,rgba(var(--hero-fade),0.9)_32%,rgba(var(--hero-fade),0.45)_52%,rgba(var(--hero-fade),0)_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_62%_30%,rgba(255,214,140,0.35),rgba(255,214,140,0)_70%)] dark:opacity-40"
      />

      <div className="relative mx-auto max-w-[1536px] px-[clamp(20px,7vw,108px)]">
        <div className="grid max-w-[620px] pt-6">
          <p
            lang="ar"
            dir="rtl"
            className="mb-4 justify-self-start font-arabic text-[clamp(26px,2.2vw,32px)] leading-[1.6] text-gold-dark"
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
          <span className="mb-5 text-[13px] font-semibold tracking-[0.26em] text-gold">
            TRANSITION ÉNERGÉTIQUE
          </span>
          <h1 className="text-[clamp(40px,4.1vw,62px)] font-extrabold leading-[0.98] tracking-[-0.03em] text-fg">
            L’énergie solaire
            <br />
            <span className="text-brand-text">au</span> service des
            <br />
            <span className="bg-[linear-gradient(180deg,#d6a94e,#b08431)] bg-clip-text text-transparent">
              mosquées
            </span>{" "}
            <span className="text-brand-text">de France</span>
          </h1>
          <p className="mt-[22px] max-w-[570px] text-[clamp(16px,1.2vw,18px)] leading-[1.38] text-fg">
            <strong className="font-semibold">{site.name}</strong>, une solution de {site.company},
            accompagne les mosquées dans leur transition énergétique grâce au photovoltaïque. Un
            avenir plus durable, pour des lieux de culte plus autonomes.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[14.5px] font-semibold text-brand-text">
            {["Une expertise dédiée aux mosquées et lieux de culte", "Économie immédiate dès l’installation"].map(
              (t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 flex-none text-gold" />
                  {t}
                </li>
              ),
            )}
          </ul>
          <div className="mt-6 flex flex-wrap gap-6">
            <a
              href="#etude"
              className="flex h-[55px] items-center gap-7 rounded-[10px] bg-[linear-gradient(180deg,#126a52,#0b4f3d)] px-7 text-base font-semibold text-white shadow-[0_0_0_2px_#ffffff,0_10px_24px_#0e5c4740] hover:bg-brand-hover hover:bg-none dark:shadow-[0_0_0_2px_#ffffff22,0_10px_24px_#00000055]"
            >
              Demander une étude gratuite <ArrowRight className="size-[17px]" />
            </a>
            <a
              href="#accompagnement"
              className="flex h-[53px] items-center gap-3.5 rounded-[10px] border border-[#ece6db] bg-white px-[30px] text-[14.5px] font-medium text-[#1d2a26] shadow-[0_6px_18px_#00000012] hover:bg-[#faf8f4] hover:text-brand dark:border-line dark:bg-card dark:text-fg dark:hover:bg-bg-soft dark:hover:text-brand-text"
            >
              <Play className="size-[15px]" />
              Découvrir notre solution
            </a>
          </div>
        </div>
      </div>

      {site.videoUrl && <VideoButton url={site.videoUrl} />}

      <div
        aria-hidden
        className="pointer-events-none absolute right-[clamp(80px,5.5vw,110px)] top-[170px] hidden -rotate-[6deg] text-right font-script text-[clamp(36px,2.7vw,50px)] leading-[1.2] tracking-[0.06em] whitespace-nowrap text-brand nav:block"
      >
        Des mosquées plus vertes
        <br />
        pour demain
        <svg viewBox="0 0 200 20" className="mt-1 ml-auto block w-[220px]">
          <path d="M4 16C60 6 130 2 196 4" fill="none" stroke="#c8a24c" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <div
        aria-hidden
        className="absolute right-[38px] top-[182px] hidden justify-items-center gap-2.5 text-[15px] font-medium text-white [text-shadow:0_1px_4px_#00000055] nav:grid"
      >
        <span>01</span>
        <span className="relative h-[150px] w-0.5 bg-white/40">
          <span className="absolute -left-px top-0 h-11 w-1 rounded-sm bg-white" />
          <span className="absolute -bottom-1.5 -left-1.5 size-[9px] rounded-full border-2 border-white" />
        </span>
        <span className="mt-[22px]">03</span>
      </div>

      <div className="relative mx-auto max-w-[1536px] px-[clamp(12px,7.2vw,111px)]">
        <ul className="mt-[38px] grid grid-cols-1 rounded-t-xl bg-[linear-gradient(180deg,rgba(10,60,44,0.95),rgba(8,48,36,0.97))] py-[18px] text-white min-[560px]:grid-cols-2 nav:grid-cols-4">
          {stats.map((s, i) => (
            <li
              key={i}
              className={
                s.highlight
                  ? "mx-3 flex items-center gap-[clamp(12px,1.5vw,22px)] rounded-xl bg-[linear-gradient(180deg,#d6a94e,#b08431)] px-[clamp(14px,2.2vw,34px)] py-4 text-brand-deep shadow-[0_10px_28px_#00000040] ring-1 ring-white/30 nav:-my-[30px] nav:mr-[18px]"
                  : "flex items-center gap-[clamp(14px,1.8vw,26px)] border-white/20 px-[clamp(16px,3.2vw,56px)] py-4 min-[560px]:max-[1439px]:odd:border-r nav:not-last:border-r"
              }
            >
              <span className={`flex-none ${s.highlight ? "text-brand-deep" : "text-gold"}`}>{s.icon}</span>
              <div className="grid gap-0.5">
                <span className="text-[15.5px] font-bold leading-[1.25]">{s.title}</span>
                {s.body}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
