import type { ReactNode } from "react";
import { Droplet, Leaf, Sun } from "@/components/icons";

const steps: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <Sun strokeWidth={1.6} className="size-[28px]" />,
    title: "Le soleil travaille pour vous",
    text: "Une énergie propre et renouvelable, produite sur le toit de votre mosquée.",
  },
  {
    icon: <Leaf strokeWidth={1.6} className="size-[28px]" />,
    title: "Des économies chaque mois",
    text: "Moins de dépenses d’électricité, plus de moyens pour la vie de la mosquée.",
  },
  {
    icon: <Droplet strokeWidth={1.6} className="size-[28px]" />,
    title: "Des puits pour les plus démunis",
    text: "Une partie de chaque abonnement finance la construction de puits.",
  },
];

export function Sadaqa() {
  return (
    <section id="sadaqa" className="bg-bg">
      <div className="mx-auto grid max-w-[1536px] items-center gap-8 px-[clamp(20px,4.7vw,72px)] py-14 lg:grid-cols-2">
        <div className="grid gap-3">
          <span className="text-[13px] font-semibold tracking-[0.26em] text-gold">ÉCONOMIE ET SADAQA</span>
          <h2 className="text-[clamp(26px,2.1vw,32px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-heading">
            Masjid Energie : <span className="text-brand-text">Économie</span> et{" "}
            <span className="text-gold-dark dark:text-gold">Sadaqa</span> !
          </h2>
          <p className="text-[15.5px] leading-[1.55] text-muted">
            En équipant votre mosquée de panneaux solaires, vous profitez de la lumière du soleil, une énergie
            propre et renouvelable, et vous allégez durablement vos factures. Et ce n’est pas tout : une partie de
            chaque abonnement est reversée à la construction de puits pour les plus démunis.
          </p>
          <p className="mt-2 justify-self-start rounded-xl bg-brand px-5 py-4 text-[15px] font-semibold leading-[1.45] text-white shadow-[0_8px_20px_#0e5c4730]">
            Pour chaque abonnement, une <span className="text-gold">sadaqa jariya</span> : les mosquées et leurs
            fidèles investissent pour l’éternel !
          </p>
          <figure className="mt-2 grid gap-1.5 border-l-2 border-gold pl-4">
            <blockquote className="text-[14.5px] italic leading-[1.5] text-fg">
              « Lorsque l’homme meurt, ses œuvres s’interrompent, sauf trois : une aumône continue, une science
              utile, ou un enfant vertueux qui invoque pour lui. »
            </blockquote>
            <figcaption className="text-[12.5px] font-semibold tracking-[0.12em] text-gold-dark">
              Hadith rapporté par Muslim
            </figcaption>
          </figure>
        </div>
        <ol className="grid gap-3.5">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex items-start gap-4 rounded-lg border border-line bg-card px-5 py-[22px] shadow-[0_4px_14px_#0000000a]"
            >
              <span className="flex size-12 flex-none items-center justify-center rounded-full bg-brand/10 text-brand-text">
                {s.icon}
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-heading">
                  <span className="text-gold-dark dark:text-gold">{i + 1}.</span> {s.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-[1.45] text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
